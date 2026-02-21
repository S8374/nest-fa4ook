import { PartialType } from '@nestjs/mapped-types';
import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { MilestonePaymentStatus } from 'src/generated/prisma/enums';
import { CreateMilestonePaymentDto } from './create-mileston-payment.dto';

export class UpdateMilestonePaymentDto extends PartialType(CreateMilestonePaymentDto) {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsOptional()
  @IsEnum(MilestonePaymentStatus)
  status?: MilestonePaymentStatus;

  @IsUUID()
  @IsOptional()
  verifiedById?: string;
}