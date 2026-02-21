import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreatePropertyAttributeDto {
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  valueType: string;
}