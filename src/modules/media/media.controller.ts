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
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FilterMediaDto } from './dto/filter-media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }
  @Get()
  findAll(@Query() filterDto: FilterMediaDto) {
    return this.mediaService.findAll(filterDto);
  }

  @Get('property/:propertyId')
  findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.mediaService.findByProperty(propertyId);
  }

  @Get('unit/:unitId')
  findByUnit(@Param('unitId', ParseUUIDPipe) unitId: string) {
    return this.mediaService.findByUnit(unitId);
  }

  @Get('primary/:entityType/:entityId')
  findPrimary(
    @Param('entityType') entityType: 'property' | 'unit',
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.mediaService.findPrimary(entityType, entityId);
  }

  @Get('types')
  getMediaTypes() {
    return this.mediaService.getMediaTypes();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch('/update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, updateMediaDto);
  }



  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.remove(id);
  }

  @Delete('property/:propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.mediaService.removeAllByProperty(propertyId);
  }

  @Delete('unit/:unitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAllByUnit(@Param('unitId', ParseUUIDPipe) unitId: string) {
    return this.mediaService.removeAllByUnit(unitId);
  }
}