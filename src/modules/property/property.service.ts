import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreatePropertyDto) {
    const {
      featuredUntil,
      attributes = [],
      amenities,
      listingAgentId,
      developerId,
      ...propertyData
    } = dto;

    // Validate that the listing agent exists in AgentProfile
    const agentExists = await this.prisma.agentProfile.findUnique({
      where: { userId: listingAgentId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!agentExists) {
      // Check if the user exists but doesn't have an agent profile
      const userExists = await this.prisma.user.findUnique({
        where: { id: listingAgentId },
        select: { role: true }
      });

      if (userExists) {
        throw new BadRequestException(
          `User with ID ${listingAgentId} exists but is not an agent. User role: ${userExists.role}. ` +
          'Please create an agent profile first or use a valid agent ID.'
        );
      } else {
        throw new NotFoundException(`Agent with ID ${listingAgentId} not found. Please provide a valid agent ID.`);
      }
    }

    // Validate developer if provided
    if (developerId) {
      const developerExists = await this.prisma.developer.findUnique({
        where: { id: developerId }
      });

      if (!developerExists) {
        throw new NotFoundException(`Developer with ID ${developerId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      try {
        // 1. Create main property
        const property = await tx.property.create({
          data: {
            listingAgentId, // Use the validated ID
            developerId,
            ...propertyData,
            amenities: amenities ?? Prisma.JsonNull,
            featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
            currency: dto.currency ?? 'SAR',
            // Ensure arrays are properly handled
            images: propertyData.images || [],
            highlights: propertyData.highlights || [],
          },
        });

        // 2. Create attributes (if any)
        if (attributes.length > 0) {
          await tx.propertyAttribute.createMany({
            data: attributes.map(attr => ({
              propertyId: property.id,
              key: attr.key,
              value: attr.value,
              valueType: attr.valueType,
            })),
            skipDuplicates: true,
          });
        }

        // Return the created property with relations
        return tx.property.findUnique({
          where: { id: property.id },
          include: {
            agent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phoneNumber: true
                  }
                }
              }
            },
            developer: true,
            attributes: true
          }
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') {
            // This will help identify which foreign key failed
            const field = error.meta?.field_name || 'unknown';
            throw new BadRequestException(`Foreign key constraint failed on ${field}`);
          }
          if (error.code === 'P2002') {
            throw new BadRequestException('Unique constraint violation');
          }
        }
        throw error;
      }
    });
  }

  async findAll() {
    return this.prisma.property.findMany({
      include: {
        agent: { 
          include: {
            user: { 
              select: { 
                fullName: true, 
                email: true,
                phoneNumber: true,
                avatarUrl: true
              } 
            }
          }
        },
        developer: true,
        attributes: true,
        media: {
          take: 1,
          where: { isPrimary: true }
        },
        _count: {
          select: {
            units: true,
            savedBy: true,
            propertyViews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        agent: { 
          include: {
            user: { 
              select: { 
                fullName: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true
              } 
            }
          }
        },
        developer: true,
        attributes: true,
        media: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        units: {
          include: {
            media: true
          }
        },
        paymentPlans: { 
          include: { 
            milestones: {
              orderBy: {
                milestoneOrder: 'asc'
              }
            } 
          }
        },
        bankAccount: true,
        nearbyProjects: {
          where: { isActive: true }
        },
        _count: {
          select: {
            savedBy: true,
            propertyViews: true
          }
        }
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    // First check if property exists
    await this.findOne(id);

    const { attributes, featuredUntil, listingAgentId, developerId, ...restDto } = dto;

    // If updating listingAgentId, validate it
    if (listingAgentId) {
      const agentExists = await this.prisma.agentProfile.findUnique({
        where: { userId: listingAgentId }
      });

      if (!agentExists) {
        throw new NotFoundException(`Agent with ID ${listingAgentId} not found`);
      }
    }

    // If updating developerId, validate it
    if (developerId) {
      const developerExists = await this.prisma.developer.findUnique({
        where: { id: developerId }
      });

      if (!developerExists) {
        throw new NotFoundException(`Developer with ID ${developerId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update main property
      const updateData: any = {
        ...restDto,
        ...(listingAgentId && { listingAgentId }),
        ...(developerId && { developerId }),
        featuredUntil: featuredUntil ? new Date(featuredUntil) : undefined,
      };

      // Handle arrays properly
      if (restDto.images) {
        updateData.images = restDto.images;
      }
      if (restDto.highlights) {
        updateData.highlights = restDto.highlights;
      }

      await tx.property.update({
        where: { id },
        data: updateData,
      });

      // 2. Handle attributes replacement (if provided)
      if (attributes) {
        await tx.propertyAttribute.deleteMany({ 
          where: { propertyId: id } 
        });
        
        if (attributes.length > 0) {
          await tx.propertyAttribute.createMany({
            data: attributes.map(a => ({
              propertyId: id,
              key: a.key,
              value: a.value,
              valueType: a.valueType,
            })),
            skipDuplicates: true,
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.property.delete({
        where: { id },
      });
      return { success: true, message: 'Property deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Property with ID ${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Cannot delete property because it has related records');
        }
      }
      throw error;
    }
  }

  // Helper method to check if a user can be an agent
  async validateAgent(userId: string): Promise<boolean> {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { role: true }
        }
      }
    });
    
    return !!agentProfile;
  }

  // Method to get available agents for dropdown
  async getAvailableAgents() {
    return this.prisma.agentProfile.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      where: {
        user: {
          status: 'ACTIVE'
        }
      }
    });
  }
}