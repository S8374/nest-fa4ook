import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { FilterMilestoneDto } from './dto/filter-milestone.dto';
import { MilestoneTrigger } from 'src/generated/prisma/enums';

@Controller('milestones')
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMilestoneDto: CreateMilestoneDto) {
    return this.milestoneService.create(createMilestoneDto);
  }

  @Post('plan/:planId/reorder')
  reorder(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() items: { id: string; milestoneOrder: number }[],
  ) {
    return this.milestoneService.reorder(planId, items);
  }

  @Get()
  findAll(@Query() filterDto: FilterMilestoneDto) {
    return this.milestoneService.findAll(filterDto);
  }

  @Get('plan/:planId')
  findByPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Query() filterDto: FilterMilestoneDto,
  ) {
    return this.milestoneService.findByPlan(planId, filterDto);
  }

  @Get('trigger/:condition')
  findByTriggerCondition(
    @Param('condition') condition: MilestoneTrigger,
    @Query() filterDto: FilterMilestoneDto,
  ) {
    return this.milestoneService.findByTriggerCondition(condition, filterDto);
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: number) {
    return this.milestoneService.findUpcoming(days ? +days : 30);
  }

  @Get('plan/:planId/summary')
  getPlanSummary(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.milestoneService.getPlanSummary(planId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestoneService.findOne(id);
  }

  @Patch('/update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestoneService.update(id, updateMilestoneDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestoneService.remove(id);
  }

  @Delete('plan/:planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllByPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.milestoneService.removeAllByPlan(planId);
  }
}