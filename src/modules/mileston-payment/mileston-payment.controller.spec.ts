import { Test, TestingModule } from '@nestjs/testing';
import { MilestonePaymentController } from './mileston-payment.controller';
import { MilestonePaymentService } from './mileston-payment.service';

describe('MilestonPaymentController', () => {
  let controller: MilestonePaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestonePaymentController],
      providers: [MilestonePaymentService],
    }).compile();

    controller = module.get<MilestonePaymentController>(MilestonePaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
