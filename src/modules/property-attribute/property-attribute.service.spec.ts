import { Test, TestingModule } from '@nestjs/testing';
import { PropertyAttributeService } from './property-attribute.service';

describe('PropertyAttributeService', () => {
  let service: PropertyAttributeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyAttributeService],
    }).compile();

    service = module.get<PropertyAttributeService>(PropertyAttributeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
