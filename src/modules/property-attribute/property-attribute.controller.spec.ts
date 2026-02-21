import { Test, TestingModule } from '@nestjs/testing';
import { PropertyAttributeController } from './property-attribute.controller';
import { PropertyAttributeService } from './property-attribute.service';

describe('PropertyAttributeController', () => {
  let controller: PropertyAttributeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyAttributeController],
      providers: [PropertyAttributeService],
    }).compile();

    controller = module.get<PropertyAttributeController>(PropertyAttributeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
