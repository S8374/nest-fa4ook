import { getBaseStyle, getHeaderStyle, getFooterStyle } from './styles';

export function getCommonEmail(title: string, message: string): string {
  return `
    <div style="${getBaseStyle()}">
      <div style="${getHeaderStyle()}">
        <h1 style="margin: 0; color: #1a202c;">${title}</h1>
      </div>
      <p>Hello,</p>
      <p>${message}</p>
      <div style="${getFooterStyle()}">
        <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}
