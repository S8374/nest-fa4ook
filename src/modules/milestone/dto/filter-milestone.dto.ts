import { IsOptional, IsUUID, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { MilestoneTrigger } from 'src/generated/prisma/enums';

export class FilterMilestoneDto {
  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsEnum(MilestoneTrigger)
  triggerCondition?: MilestoneTrigger;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasDueDate?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}