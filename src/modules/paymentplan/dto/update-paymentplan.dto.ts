import { PartialType } from '@nestjs/mapped-types';
import { IsUUID, IsOptional } from 'class-validator';
import { CreatePaymentPlanDto } from './create-paymentplan.dto';

export class UpdatePaymentPlanDto extends PartialType(CreatePaymentPlanDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}