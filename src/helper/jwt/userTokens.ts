import { generateToken } from './jwtHelper';
import { config } from 'src/config/config.index';
import { User } from 'src/generated/prisma/client';

export const createUserTokens = (user: Partial<User>) => {
  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    config.jwt.jwt_secret,
    config.jwt.expires_in,
  );

  const refreshToken = generateToken(
    jwtPayload,
    config.jwt.refresh_token_secret,
    config.jwt.refresh_token_expires_in,
  );

  return {
    accessToken,
    refreshToken,
  };
};
