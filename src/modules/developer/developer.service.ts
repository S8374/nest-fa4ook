import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeveloperDto: CreateDeveloperDto) {
    try {
      const developer = await this.prisma.developer.create({
        data: createDeveloperDto,
      });
      
      return {
        success: true,
        message: 'Developer created successfully',
        data: developer,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 is unique constraint violation
        if (error.code === 'P2002') {
          throw new ConflictException('Developer with this name already exists');
        }
      }
      throw error;
    }
  }

  async findAll(includeProjects: boolean = false) {
    const developers = await this.prisma.developer.findMany({
      include: {
        property: includeProjects,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: developers,
      count: developers.length,
    };
  }

  async findOne(id: string, includeProjects: boolean = false) {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        property: includeProjects ? {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            listingPurpose: true,
            images: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        } : false,
      },
    });

    if (!developer) {
      throw new NotFoundException(`Developer with ID ${id} not found`);
    }

    return {
      success: true,
      data: developer,
    };
  }

  async update(id: string, updateDeveloperDto: UpdateDeveloperDto) {
    // First check if developer exists
    await this.findOne(id);

    try {
      const updatedDeveloper = await this.prisma.developer.update({
        where: { id },
        data: updateDeveloperDto,
      });

      return {
        success: true,
        message: 'Developer updated successfully',
        data: updatedDeveloper,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Developer with this name already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    // First check if developer exists
    await this.findOne(id);

    // Check if developer has any properties
    const propertiesCount = await this.prisma.property.count({
      where: { developerId: id },
    });

    if (propertiesCount > 0) {
      throw new ConflictException(
        `Cannot delete developer because they have ${propertiesCount} associated properties. Please reassign or delete those properties first.`
      );
    }

    await this.prisma.developer.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Developer deleted successfully',
    };
  }

  async searchByName(name: string) {
    const developers = await this.prisma.developer.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: developers,
      count: developers.length,
    };
  }

}