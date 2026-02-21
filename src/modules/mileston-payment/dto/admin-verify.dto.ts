import { IsUUID, IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminVerifyDto {
  @IsUUID()
  adminId: string;

  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}