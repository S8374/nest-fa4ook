import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';

@Module({
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],   // ✅ ADD THIS
})
export class PropertyModule {}