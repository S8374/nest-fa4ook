import {
  getBaseStyle,
  getHeaderStyle,
  getButtonStyle,
  getFooterStyle,
} from './styles';

export function getWelcomeEmail(name: string): string {
  return `
    <div style="${getBaseStyle()}">
      <div style="${getHeaderStyle()}">
        <h1 style="margin: 0; color: #1a202c;">Welcome to Our Platform!</h1>
      </div>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Welcome to our platform! We are excited to have you join our community.</p>
      <p>We're dedicated to providing you with the best experience possible.</p>
      <div style="text-align: center;">
        <a href="#" style="${getButtonStyle()}">Get Started</a>
      </div>
      <div style="${getFooterStyle()}">
        <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}
