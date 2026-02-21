import {
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { MilestoneTrigger } from 'src/generated/prisma/enums';

export class CreateMilestoneDto {
  @IsUUID()
  planId: string;

  @IsInt()
  @Min(1)
  milestoneOrder: number;

  @IsString()
  @Length(1, 500)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentageDue: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsEnum(MilestoneTrigger)
  triggerCondition: MilestoneTrigger;

  @IsOptional()
  @IsString()
  constructionStage?: string;
}