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
  Query
} from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Controller('developers')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDeveloperDto: CreateDeveloperDto) {
    return this.developerService.create(createDeveloperDto);
  }

  @Get('/get')
  findAll(@Query('includeProjects') includeProjects?: string) {
    return this.developerService.findAll(includeProjects === 'true');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string, // Use ParseUUIDPipe to validate UUID format
    @Query('includeProjects') includeProjects?: string
  ) {
    // Remove the +id conversion - IDs are strings (UUIDs), not numbers
    return this.developerService.findOne(id, includeProjects === 'true');
  }

  @Patch('/update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateDeveloperDto: UpdateDeveloperDto
  ) {
    // Remove the +id conversion
    return this.developerService.update(id, updateDeveloperDto);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) { 
    // Remove the +id conversion
    return this.developerService.remove(id);
  }

  @Get('search/:name')
  searchByName(@Param('name') name: string) {
    return this.developerService.searchByName(name);
  }

}