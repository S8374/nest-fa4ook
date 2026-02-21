import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPlanService } from './paymentplan.service';

describe('PaymentplanService', () => {
  let service: PaymentPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentPlanService],
    }).compile();

    service = module.get<PaymentPlanService>(PaymentPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
