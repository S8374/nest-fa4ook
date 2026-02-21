import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class AcceptPaymentPlanDto {
  @IsUUID()
  buyerId: string;

  @IsUUID()
  propertyId: string;

  @IsUUID()
  paymentPlanId: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsUUID()
  acceptedById?: string; // Agent/Admin who verified the acceptance
}