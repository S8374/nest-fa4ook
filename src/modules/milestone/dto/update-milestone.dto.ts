import { PartialType } from '@nestjs/mapped-types';
import { CreateMilestoneDto } from './create-milestone.dto';
import { IsUUID, IsOptional } from 'class-validator';

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}