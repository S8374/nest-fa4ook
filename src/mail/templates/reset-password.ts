import { getBaseStyle, getHeaderStyle, getFooterStyle } from './styles';

export function getResetPasswordEmail(token: string): string {
  return `
    <div style="${getBaseStyle()}">
      <div style="${getHeaderStyle()}">
        <h1 style="margin: 0; color: #1a202c;">Reset Your Password</h1>
      </div>
      <p>Hello,</p>
      <p>You have requested to reset your password. Please copy the token below or verify directly.</p>
      <div style="text-align: center; margin: 30px 0;">
         <div style="word-break: break-all; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; color: #4a5568;">
            ${token}
         </div>
      </div>
      <p>If you did not request a password reset, please ignore this email.</p>
      <div style="${getFooterStyle()}">
        <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}
