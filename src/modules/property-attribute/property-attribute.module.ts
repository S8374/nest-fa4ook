import { Module } from '@nestjs/common';
import { PropertyAttributeService } from './property-attribute.service';
import { PropertyAttributeController } from './property-attribute.controller';
import { PrismaService } from 'src/common/context/prisma.service';

@Module({
  controllers: [PropertyAttributeController],
  providers: [PropertyAttributeService, PrismaService],
  exports: [PropertyAttributeService],
})
export class PropertyAttributeModule {}