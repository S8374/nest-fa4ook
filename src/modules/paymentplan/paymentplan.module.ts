import { Module } from '@nestjs/common';

import { PrismaService } from 'src/common/context/prisma.service';
import { PaymentPlanService } from './paymentplan.service';
import { PaymentPlanController } from './paymentplan.controller';

@Module({
  controllers: [PaymentPlanController],
  providers: [PaymentPlanService, PrismaService],
  exports: [PaymentPlanService],
})
export class PaymentPlanModule {}