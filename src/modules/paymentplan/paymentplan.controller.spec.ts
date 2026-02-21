import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPlanController } from './paymentplan.controller';
import { PaymentPlanService } from './paymentplan.service';

describe('PaymentplanController', () => {
  let controller: PaymentPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentPlanController],
      providers: [PaymentPlanService],
    }).compile();

    controller = module.get<PaymentPlanController>(PaymentPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
