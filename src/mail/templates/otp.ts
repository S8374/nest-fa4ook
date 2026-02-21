import { getBaseStyle, getHeaderStyle, getFooterStyle } from './styles';

export function getOtpEmail(otp: string): string {
  return `
    <div style="${getBaseStyle()}">
      <div style="${getHeaderStyle()}">
        <h1 style="margin: 0; color: #1a202c;">Your Login OTP</h1>
      </div>
      <p>Hello,</p>
      <p>Please use the following One-Time Password (OTP) to verify your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2b6cb0; background-color: #ebf8ff; padding: 10px 20px; border-radius: 8px; border: 1px dashed #bee3f8;">${otp}</span>
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <div style="${getFooterStyle()}">
        <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}
