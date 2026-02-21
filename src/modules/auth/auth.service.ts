import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import * as bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from 'src/helper/jwt/jwtHelper';
import { config } from 'src/config/config.index';
import {
  AuthTokens,
  setAuthCookie,
  setResetPassCookie,
} from 'src/helper/jwt/setCookie';
import { Response, Request } from 'express';
import { LogInAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { MailService } from 'src/mail/mail.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { UserEntity } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { JwtPayload } from 'jsonwebtoken';
import { KycStatus, Role, UserStatus } from 'src/generated/prisma/enums';

interface OtpCachePayload {
  otp: string;
  attempts: number;
  maxAttempts: number;
  email: string;
}

interface ExchangeTokenPayload extends JwtPayload {
  email: string;
  type: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async register(dto: RegisterAuthDto) {
    const { fullName, email, password, role = Role.BUYER } = dto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new BadRequestException('User already exists');
      }
      throw new BadRequestException(
        'User already exists. Please login or verify your account.',
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          fullName,
          email,
          password: hashPassword,
          nationality: dto.nationality,
          avatarUrl: dto.avatarUrl,
          role,
          status: UserStatus.PENDING_VERIFICATION,
          isVerified: false,
        },
      });

      // Create role-specific profile
      if (role === Role.AGENT) {
        await tx.agentProfile.create({
          data: {
            userId: newUser.id,
            licenseId: dto.licenseNumber?.toString(),
            agencyName: null,
            trustScore: 0,
          },
        });
      } else if (role === Role.BUYER) {
        await tx.buyerProfile.create({
          data: {
            userId: newUser.id,
            kycStatus: KycStatus.
          PENDING,
            preferredPropertyTypes: [],
          },
        });
      }
      // Admin doesn't need a profile

      return newUser;
    });

    // Send Registration OTP
    await this.sendOtp(user.email, user.fullName || 'User', 'register_otp');

    return new UserEntity(user);
  }

  // --- 1. Account Verification (Registration) ---
  async verifyOtp(dto: VerifyOtpDto, res: Response) {
    const { email, otp } = dto;
    const cacheKey = `register_otp:${email}`;

    // Verify OTP logic with attempts count
    await this.validateOtp(cacheKey, otp);

    // If successful:
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await this.cacheManager.del(cacheKey);

    // Auto-login
    const payload = { userId: updatedUser.id, role: updatedUser.role };
    const accessToken = generateToken(
      payload,
      config.jwt.jwt_secret,
      config.jwt.expires_in,
    );
    const refreshToken = generateToken(
      payload,
      config.jwt.refresh_token_secret,
      config.jwt.refresh_token_expires_in,
    );

    const tokenInfo: AuthTokens = { accessToken, refreshToken };
    setAuthCookie(res, tokenInfo);

    return {
      message: 'Account verified successfully.',
      accessToken,
      user: new UserEntity(updatedUser),
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');
    if (user.isVerified) {
      throw new BadRequestException('Account is already verified.');
    }

    await this.sendOtp(user.email, user.fullName || 'User', 'register_otp');

    return { message: 'OTP sent successfully.' };
  }

  // --- 2. Forgot Password Flow ---

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');

    // Send Reset OTP
    await this.sendOtp(user.email, user.fullName || 'User', 'reset_otp');

    return {
      message: 'If an account exists, an OTP has been sent to your email.',
    };
  }

  // Step B: Verify Reset OTP and Issue Exchange Token
  async verifyResetOtp(dto: VerifyOtpDto, res: Response) {
    const { email, otp } = dto;
    const cacheKey = `reset_otp:${email}`;

    // 1. Verify OTP with attempts logic
    await this.validateOtp(cacheKey, otp);

    // 2. Clear OTP
    await this.cacheManager.del(cacheKey);

    // 3. Generate Exchange Token (Short-lived, e.g., 5 mins)
    // This token proves the user verified their email successfully
    const exchangePayload = { email, type: 'password_exchange' };
    const exchangeToken = generateToken(
      exchangePayload,
      config.jwt.reset_pass_secret, // Use a specific secret for this
      '5m', // Valid for only 5 minutes
    );

    setResetPassCookie(res, exchangeToken);

    return {
      message: 'OTP verified. Use this token to reset your password.',
      exchangeToken,
    };
  }

  // Step C: Complete Reset using Exchange Token
  async resetPassword(dto: ResetPasswordDto, req: Request, res: Response) {
    const { newPassword } = dto;

    // 1. Resolve Token: Check Payload (DTO) first, then Cookie
    const exchangeToken =
      dto.exchangeToken || (req.cookies?.['exchangeToken'] as string);

    if (!exchangeToken) {
      throw new UnauthorizedException(
        'You are not authorized to reset your password.',
      );
    }

    let decoded: ExchangeTokenPayload;
    try {
      // Cast the result to our interface to fix ESLint errors
      decoded = verifyToken(
        exchangeToken,
        config.jwt.reset_pass_secret,
      ) as ExchangeTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired exchange token.');
    }

    if (decoded.type !== 'password_exchange' || !decoded.email) {
      throw new UnauthorizedException('Invalid token type.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: decoded.email },
    });
    if (!user) throw new NotFoundException('User not found.');

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword },
    });

    // Clear Exchange Token
    res.clearCookie('exchangeToken');

    return { message: 'Password has been reset successfully. Please login.' };
  }

  async login(dto: LogInAuthDto, res: Response) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    if (!user.isVerified || user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Account not verified. Please verify your email.',
      );
    }

    if (
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.INACTIVE
    ) {
      throw new UnauthorizedException('Account is not active.');
    }

    // Check if password exists (users might have registered via OAuth)
    if (!user.password) {
      throw new UnauthorizedException('Account has no password set. Please use social login or reset your password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestException('Invalid credentials');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateToken(
      payload,
      config.jwt.jwt_secret,
      config.jwt.expires_in,
    );
    const refreshToken = generateToken(
      payload,
      config.jwt.refresh_token_secret,
      config.jwt.refresh_token_expires_in,
    );

    const tokenInfo: AuthTokens = { accessToken, refreshToken };
    setAuthCookie(res, tokenInfo);

    return {
      accessToken,
      user: new UserEntity(user),
    };
  }

  logout(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logout successful.' };
  }

  async changePassword(dto: ChangePasswordDto) {
    const { email, oldPassword, newPassword } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found.');

    // Check if password exists
    if (!user.password) {
      throw new BadRequestException('Account has no password set. Please use social login or reset your password.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Invalid old password.');

    const hashPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword },
    });

    return new UserEntity(updatedUser);
  }

  // --- Helper Methods ---

  private async sendOtp(email: string, name: string, prefix: string) {
    // Generate secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const ttl = 5 * 60 * 1000; // 5 Minutes

    const hashedOtp = await bcrypt.hash(otp, 10);
    const payload: OtpCachePayload = {
      email,
      otp: hashedOtp,
      maxAttempts: 3,
      attempts: 0,
    };

    // Store in Redis with prefix (e.g., 'register_otp:email' or 'reset_otp:email')
    await this.cacheManager.set(`${prefix}:${email}`, payload, ttl);

    // Send Email
    await this.mailService.sendUserOtp({ email, name }, otp);
  }

  // Centralized OTP Validation Logic
  private async validateOtp(key: string, inputOtp: string) {
    const payload = await this.cacheManager.get<OtpCachePayload>(key);

    if (!payload) {
      throw new BadRequestException('OTP has expired or is invalid.');
    }

    if (payload.attempts >= payload.maxAttempts) {
      await this.cacheManager.del(key); // Security: Delete blocked OTP
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    const isMatch = await bcrypt.compare(inputOtp, payload.otp);

    if (!isMatch) {
      // Increment attempts
      payload.attempts += 1;
      const ttl = await this.cacheManager.ttl(key); // Preserve remaining TTL
      await this.cacheManager.set(key, payload, ttl);

      throw new BadRequestException(
        `Invalid OTP. Attempts remaining: ${payload.maxAttempts - payload.attempts}`,
      );
    }

    return payload; // Valid
  }
}