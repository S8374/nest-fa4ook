import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { CreatePropertyAttributeDto } from './dto/create-property-attribute.dto';
import { UpdatePropertyAttributeDto } from './dto/update-property-attribute.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PropertyAttributeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyAttributeDto: CreatePropertyAttributeDto) {
    const { propertyId, ...attributeData } = createPropertyAttributeDto;

    if (!propertyId) {
      throw new ConflictException('propertyId is required');
    }

    // Check if property exists
    await this.validateProperty(propertyId);

    try {
      // Use unchecked create input to set propertyId directly
      const attribute = await this.prisma.propertyAttribute.create({
        data: {
          propertyId: propertyId, // Use propertyId directly, not property.connect
          key: attributeData.key,
          value: attributeData.value,
          valueType: attributeData.valueType,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Property attribute created successfully',
        data: attribute
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Attribute with key '${attributeData.key}' already exists for this property`);
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(`Property with ID ${propertyId} not found`);
        }
      }
      throw error;
    }
  }



  async findAll() {
    const attributes = await this.prisma.propertyAttribute.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { propertyId: 'asc' },
        { key: 'asc' }
      ]
    });

    return {
      success: true,
      data: attributes,
      count: attributes.length
    };
  }

  async findOne(id: string) {
    const attribute = await this.prisma.propertyAttribute.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true
          }
        }
      }
    });

    if (!attribute) {
      throw new NotFoundException(`Property attribute with ID ${id} not found`);
    }

    return {
      success: true,
      data: attribute
    };
  }

  async findByProperty(propertyId: string) {
    // Check if property exists
    await this.validateProperty(propertyId);

    const attributes = await this.prisma.propertyAttribute.findMany({
      where: { propertyId },
      orderBy: { key: 'asc' }
    });

    return {
      success: true,
      data: attributes,
      count: attributes.length,
      propertyId
    };
  }



  async update(id: string, updatePropertyAttributeDto: UpdatePropertyAttributeDto) {
    // Check if attribute exists
    await this.findOne(id);

    const { propertyId, ...updateData } = updatePropertyAttributeDto;

    try {
      const updatePayload: any = { ...updateData };
      
      // If propertyId is provided, validate it and update
      if (propertyId) {
        await this.validateProperty(propertyId);
        updatePayload.propertyId = propertyId; // Use propertyId directly
      }

      const updatedAttribute = await this.prisma.propertyAttribute.update({
        where: { id },
        data: updatePayload,
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Property attribute updated successfully',
        data: updatedAttribute
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Attribute with this key already exists for this property`);
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(`Property with ID ${propertyId} not found`);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Check if attribute exists
    await this.findOne(id);

    await this.prisma.propertyAttribute.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Property attribute deleted successfully'
    };
  }




  async upsert(propertyId: string, key: string, value: string, valueType: string) {
    await this.validateProperty(propertyId);

    try {
      const attribute = await this.prisma.propertyAttribute.upsert({
        where: {
          propertyId_key: {
            propertyId,
            key
          }
        },
        update: {
          value,
          valueType
        },
        create: {
          propertyId,
          key,
          value,
          valueType
        }
      });

      return {
        success: true,
        message: 'Attribute upserted successfully',
        data: attribute
      };
    } catch (error) {
      throw error;
    }
  }





  private async validateProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    return property;
  }
}