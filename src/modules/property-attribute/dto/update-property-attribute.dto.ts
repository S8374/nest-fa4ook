import { PartialType } from '@nestjs/mapped-types';
import { IsUUID, IsOptional } from 'class-validator';
import { CreatePropertyAttributeDto } from './create-property-attribute.dto';

export class UpdatePropertyAttributeDto extends PartialType(CreatePropertyAttributeDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}