import { PartialType } from '@nestjs/mapped-types';
import { CreateUnitDto } from './create-unit.dto';
import { IsUUID, IsOptional } from 'class-validator';

export class UpdateUnitDto extends PartialType(CreateUnitDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}