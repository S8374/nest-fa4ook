import { IsUUID, IsString, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
  @IsUUID()
  verifiedById: string;

  @IsOptional()
  @IsString()
  notes?: string;
}