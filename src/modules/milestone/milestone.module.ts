import { Module } from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { MilestoneController } from './milestone.controller';
import { PrismaService } from 'src/common/context/prisma.service';

@Module({
  controllers: [MilestoneController],
  providers: [MilestoneService, PrismaService],
  exports: [MilestoneService],
})
export class MilestoneModule {}