import { Response } from 'express';
import { config } from 'src/config/config.index';

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  if (tokenInfo.accessToken) {
    res.cookie('accessToken', tokenInfo.accessToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'none',
    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie('refreshToken', tokenInfo.refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'none',
    });
  }
};

export const removeAuthCookie = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export const setResetPassCookie = (res: Response, token: string) => {
  res.cookie('exchangeToken', token, {
    httpOnly: true,
    secure: config.node_env === 'production',
    sameSite: 'none',
  });
};
