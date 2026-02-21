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
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { FilterUnitDto } from './dto/filter-unit.dto';

@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) { }

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitService.create(createUnitDto);
  }

  @Get('/all')
  findAll(@Query() filterDto: FilterUnitDto) {
    return this.unitService.findAll(filterDto);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Query() filterDto: FilterUnitDto,
  ) {
    return this.unitService.findByProperty(propertyId, filterDto);
  }


  @Get('featured')
  findFeatured(@Query('limit') limit?: string) {
    return this.unitService.findFeatured(limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.unitService.findOne(id);
  }


  @Patch('/update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitService.update(id, updateUnitDto);
  }

  @Patch('/update-status/:id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.unitService.updateStatus(id, status);
  }


  @Delete('/delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.unitService.remove(id);
  }

  @Delete('property/:propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.unitService.removeAllByProperty(propertyId);
  }
}