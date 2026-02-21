import { getWelcomeEmail } from '../src/mail/templates/welcome';
import { getOtpEmail } from '../src/mail/templates/otp';
import { getResetPasswordEmail } from '../src/mail/templates/reset-password';
import { getCommonEmail } from '../src/mail/templates/common';

console.log('--- Welcome Email ---');
console.log(getWelcomeEmail('John Doe'));

console.log('\n--- OTP Email ---');
console.log(getOtpEmail('123456'));

console.log('\n--- Reset Password Email ---');
console.log(getResetPasswordEmail('your-reset-token'));

console.log('\n--- Common Email ---');
console.log(getCommonEmail('Notification', 'This is a test notification.'));
