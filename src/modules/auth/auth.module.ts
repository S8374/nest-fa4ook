import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MailModule } from 'src/mail/mail.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
