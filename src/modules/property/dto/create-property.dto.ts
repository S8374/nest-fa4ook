import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  IsLatitude,
  IsLongitude,
  Length,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingPurpose, ProjectType, PropertyStatus } from 'src/generated/prisma/enums';

class PropertyAttributeDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  valueType: string;
}

export class CreatePropertyDto {
  @IsUUID()
  listingAgentId: string;

  @IsEnum(PropertyStatus)
  status: PropertyStatus;

  @IsEnum(ListingPurpose)
  listingPurpose: ListingPurpose;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @IsInt()
  districtId: number;

  @IsOptional()
  @IsUUID()
  developerId?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  totalUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableUnits?: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  mapEmbedUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @Length(1, 255)
  title: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number;

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
  floorNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1800)
  yearBuilt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parkingSlots?: number;

  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  roiProjectionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRentalIncome?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  estimatedRentalCurrency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valueApproximate?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  valueApproximateCurrency?: string;

  @IsOptional()
  amenities?: any; // Json field

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsDateString()
  featuredUntil?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyAttributeDto)
  attributes?: PropertyAttributeDto[];
}