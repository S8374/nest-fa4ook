import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

import { getOtpEmail } from './templates/otp';
import { getResetPasswordEmail } from './templates/reset-password';
import { getWelcomeEmail } from './templates/welcome';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);

    switch (job.name) {
      case 'send-welcome-email':
        await this.handleWelcomeEmail(
          job.data as { email: string; fullName: string },
        );
        break;
      case 'send-otp-email':
        await this.handleOtpEmail(job.data as { email: string; otp: string });
        break;
      case 'send-reset-password':
        await this.handleResetPassword(
          job.data as { email: string; token: string },
        );
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleWelcomeEmail(data: { email: string; fullName: string }) {
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Welcome to our App! 🎉',
      html: getWelcomeEmail(data.fullName),
    });
    this.logger.log(`Email sent to ${data.email}`);
  }

  private async handleOtpEmail(data: { email: string; otp: string }) {
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Your Login OTP',
      html: getOtpEmail(data.otp),
    });
  }

  private async handleResetPassword(data: { email: string; token: string }) {
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Reset Password',
      html: getResetPasswordEmail(data.token),
    });
  }
}
