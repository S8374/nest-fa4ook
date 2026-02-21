import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { PrismaService } from 'src/common/context/prisma.service';

@Module({
  controllers: [UnitController],
  providers: [UnitService, PrismaService],
  exports: [UnitService],
})
export class UnitModule {}