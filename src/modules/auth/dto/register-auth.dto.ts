import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class RegisterAuthDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;


  nationality?: string;
  investmentField?: string;
  avatarUrl?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;


  licenseNumber?: number;
  ragaId?: number;
  termsAndCondition?: boolean;
}
