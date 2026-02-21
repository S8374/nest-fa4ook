import { Module } from '@nestjs/common';

import { PrismaService } from 'src/common/context/prisma.service';
import { MilestonePaymentController } from './mileston-payment.controller';
import { MilestonePaymentService } from './mileston-payment.service';

@Module({
  controllers: [MilestonePaymentController],
  providers: [MilestonePaymentService, PrismaService],
  exports: [MilestonePaymentService],
})
export class MilestonePaymentModule {}