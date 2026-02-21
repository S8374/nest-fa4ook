import {
  IsString,
  IsUUID,
  IsNumber,
  IsUrl,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { MilestonePaymentStatus } from 'src/generated/prisma/enums';

export class CreateMilestonePaymentDto {
  @IsUUID()
  milestoneId: string;

  @IsUUID()
  buyerId: string;

  @IsUUID()
  propertyId: string;

  @IsNumber()
  @Min(0)
  amountPaid: number;

  @IsUrl()
  proofUrl: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsEnum(MilestonePaymentStatus)
  status?: MilestonePaymentStatus;

  @IsOptional()
  @IsBoolean()
  isReadByAgent?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}