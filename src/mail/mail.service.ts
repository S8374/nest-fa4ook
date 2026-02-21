import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue('mail') private mailQueue: Queue) {}

  async sendUserOtp(user: { email: string; name: string }, otp: string) {
    await this.mailQueue.add(
      'send-otp-email',
      {
        email: user.email,
        name: user.name,
        otp,
      },
      {
        attempts: 3,
        backoff: 3000, // Wait 3s before retry
        removeOnComplete: false,
      },
    );
  }
}
