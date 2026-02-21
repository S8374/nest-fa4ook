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

import { FilterPaymentPlanDto } from './dto/filter-payment-plan.dto';
import { CreatePaymentPlanDto } from './dto/create-paymentplan.dto';
import { UpdatePaymentPlanDto } from './dto/update-paymentplan.dto';
import { PaymentPlanService } from './paymentplan.service';

@Controller('payment-plans')
export class PaymentPlanController {
  constructor(private readonly paymentPlanService: PaymentPlanService) {}

  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentPlanDto: CreatePaymentPlanDto) {
    return this.paymentPlanService.create(createPaymentPlanDto);
  }

  @Get('/all')
  findAll(@Query() filterDto: FilterPaymentPlanDto) {
    return this.paymentPlanService.findAll(filterDto);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Query() filterDto: FilterPaymentPlanDto,
  ) {
    return this.paymentPlanService.findByProperty(propertyId, filterDto);
  }

  @Get('summary')
  getSummary() {
    return this.paymentPlanService.getSummary();
  }

  @Get('property/:propertyId/summary')
  getPropertySummary(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.paymentPlanService.getPropertySummary(propertyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentPlanService.findOne(id);
  }

  @Patch('/update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentPlanDto: UpdatePaymentPlanDto,
  ) {
    return this.paymentPlanService.update(id, updatePaymentPlanDto);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentPlanService.remove(id);
  }

}