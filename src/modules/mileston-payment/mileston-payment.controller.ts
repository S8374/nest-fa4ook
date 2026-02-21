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
import { AgentReviewDto } from './dto/agent-review.dto';
import { AdminVerifyDto } from './dto/admin-verify.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { MilestonePaymentService } from './mileston-payment.service';
import { CreateMilestonePaymentDto } from './dto/create-mileston-payment.dto';

@Controller('milestone-payments')
export class MilestonePaymentController {
  constructor(private readonly milestonePaymentService: MilestonePaymentService) {}

  // Buyer creates payment
  @Post('/create-milestone-payment')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMilestonePaymentDto: CreateMilestonePaymentDto) {
    return this.milestonePaymentService.create(createMilestonePaymentDto);
  }

  // Agent reviews payment
  @Patch(':id/agent-review')
  agentReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: AgentReviewDto,
  ) {
    return this.milestonePaymentService.agentReview(id, reviewDto);
  }

  // Admin verifies payment
  @Patch(':id/admin-verify')
  adminVerify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyDto: AdminVerifyDto,
  ) {
    return this.milestonePaymentService.adminVerify(id, verifyDto);
  }

  // Get payments pending agent review
  @Get('pending/agent/:agentId')
  getPendingAgentReviews(
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @Query() filterDto: FilterPaymentDto,
  ) {
    return this.milestonePaymentService.getPendingAgentReviews(agentId, filterDto);
  }

  // Get payments pending admin verification
  @Get('pending/admin/:adminId')
  getPendingAdminVerifications(
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @Query() filterDto: FilterPaymentDto,
  ) {
    return this.milestonePaymentService.getPendingAdminVerifications(adminId, filterDto);
  }

  // Get buyer's payments
  @Get('buyer/:buyerId')
  getBuyerPayments(
    @Param('buyerId', ParseUUIDPipe) buyerId: string,
    @Query() filterDto: FilterPaymentDto,
  ) {
    return this.milestonePaymentService.getBuyerPayments(buyerId, filterDto);
  }

  // Get payment with full details
  @Get(':id/with-details')
  findOneWithDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonePaymentService.findOneWithDetails(id);
  }

  // Get payment statistics
  @Get('stats/agent/:agentId')
  getAgentStats(@Param('agentId', ParseUUIDPipe) agentId: string) {
    return this.milestonePaymentService.getPaymentStats(agentId);
  }

  @Get('stats/admin/:adminId')
  getAdminStats(@Param('adminId', ParseUUIDPipe) adminId: string) {
    return this.milestonePaymentService.getPaymentStats(undefined, adminId);
  }

  // Get single payment
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonePaymentService.findOne(id);
  }
}