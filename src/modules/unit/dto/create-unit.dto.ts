import {
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUrl,
  Min,
  Max,
  Length,
} from 'class-validator';
import { UnitStatus } from 'src/generated/prisma/enums';

export class CreateUnitDto {
  @IsUUID()
  propertyId: string;

  @IsString()
  @Length(1, 50)
  unitNumber: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  floorNumber?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsNumber()
  @Min(0)
  areaSqm: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqFt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  balconies?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parkingSlots?: number;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPricedOnRequest?: boolean;
}