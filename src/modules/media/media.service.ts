import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FilterMediaDto } from './dto/filter-media.dto';
import { MediaType, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediaDto: CreateMediaDto) {
    const { propertyId, unitId, ...mediaData } = createMediaDto;

    // Validate that either propertyId or unitId is provided
    if (!propertyId && !unitId) {
      throw new BadRequestException('Either propertyId or unitId must be provided');
    }

    // Validate that both are not provided
    if (propertyId && unitId) {
      throw new BadRequestException('Cannot provide both propertyId and unitId');
    }

    // Validate the parent entity exists
    if (propertyId) {
      await this.validateProperty(propertyId);
    }
    if (unitId) {
      await this.validateUnit(unitId);
    }

    try {
      const media = await this.prisma.media.create({
        data: {
          ...mediaData,
          propertyId,
          unitId,
        },
        include: {
          property: {
            select: { id: true, title: true },
          },
          unit: {
            select: { id: true, unitNumber: true },
          },
        },
      });

      return {
        success: true,
        message: 'Media created successfully',
        data: media,
      };
    } catch (error) {
      throw error;
    }
  }



  async findAll(filterDto: FilterMediaDto) {
    const {
      propertyId,
      unitId,
      type,
      isPrimary,
      page = 1,
      limit = 50,
    } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.MediaWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (type) where.type = type;
    if (isPrimary !== undefined) where.isPrimary = isPrimary;

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true },
          },
          unit: {
            select: { id: true, unitNumber: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      success: true,
      data: media,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, title: true },
        },
        unit: {
          select: { id: true, unitNumber: true, title: true },
        },
      },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return {
      success: true,
      data: media,
    };
  }

  async findByProperty(propertyId: string) {
    await this.validateProperty(propertyId);

    const media = await this.prisma.media.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
    });

    return {
      success: true,
      data: media,
      count: media.length,
      propertyId,
    };
  }

  async findByUnit(unitId: string) {
    await this.validateUnit(unitId);

    const media = await this.prisma.media.findMany({
      where: { unitId },
      orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
    });

    return {
      success: true,
      data: media,
      count: media.length,
      unitId,
    };
  }

  async findPrimary(entityType: 'property' | 'unit', entityId: string) {
    const where = entityType === 'property' 
      ? { propertyId: entityId, isPrimary: true }
      : { unitId: entityId, isPrimary: true };

    const media = await this.prisma.media.findFirst({
      where,
    });

    return {
      success: true,
      data: media,
    };
  }

  async update(id: string, updateMediaDto: UpdateMediaDto) {
    await this.findOne(id);

    const { propertyId, unitId, ...updateData } = updateMediaDto;

    // Validate entity IDs if provided
    if (propertyId) {
      await this.validateProperty(propertyId);
    }
    if (unitId) {
      await this.validateUnit(unitId);
    }

    const updatedMedia = await this.prisma.media.update({
      where: { id },
      data: {
        ...updateData,
        ...(propertyId && { propertyId }),
        ...(unitId && { unitId }),
      },
      include: {
        property: {
          select: { id: true, title: true },
        },
        unit: {
          select: { id: true, unitNumber: true },
        },
      },
    });

    return {
      success: true,
      message: 'Media updated successfully',
      data: updatedMedia,
    };
  }





  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.media.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Media deleted successfully',
    };
  }

  async removeAllByProperty(propertyId: string) {
    await this.validateProperty(propertyId);

    const result = await this.prisma.media.deleteMany({
      where: { propertyId },
    });

    return {
      success: true,
      message: `Successfully deleted ${result.count} media items`,
      count: result.count,
    };
  }

  async removeAllByUnit(unitId: string) {
    await this.validateUnit(unitId);

    const result = await this.prisma.media.deleteMany({
      where: { unitId },
    });

    return {
      success: true,
      message: `Successfully deleted ${result.count} media items`,
      count: result.count,
    };
  }

  async getMediaTypes() {
    return {
      success: true,
      data: Object.values(MediaType),
    };
  }

  private async validateProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    return property;
  }

  private async validateUnit(unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found`);
    }

    return unit;
  }
}