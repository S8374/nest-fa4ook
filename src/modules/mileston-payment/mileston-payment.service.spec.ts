import { Test, TestingModule } from '@nestjs/testing';
import { MilestonePaymentService } from './mileston-payment.service';

describe('MilestonPaymentService', () => {
  let service: MilestonePaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MilestonePaymentService],
    }).compile();

    service = module.get<MilestonePaymentService>(MilestonePaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
