import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { FilterPaymentPlanDto } from './dto/filter-payment-plan.dto';
import { Prisma } from 'src/generated/prisma/client';
import { UpdatePaymentPlanDto } from './dto/update-paymentplan.dto';
import { CreatePaymentPlanDto } from './dto/create-paymentplan.dto';

@Injectable()
export class PaymentPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentPlanDto: CreatePaymentPlanDto) {
    const { propertyId, ...planData } = createPaymentPlanDto;

    // Validate property exists
    await this.validateProperty(propertyId);

    // Check if a payment plan with same name already exists for this property
    const existingPlan = await this.prisma.paymentPlan.findFirst({
      where: {
        propertyId,
        name: planData.name,
      },
    });

    if (existingPlan) {
      throw new BadRequestException(
        `Payment plan with name "${planData.name}" already exists for this property`,
      );
    }

    try {
      const paymentPlan = await this.prisma.paymentPlan.create({
        data: {
          propertyId,
          ...planData,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Payment plan created successfully',
        data: paymentPlan,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid property ID');
        }
      }
      throw error;
    }
  }


  async findAll(filterDto: FilterPaymentPlanDto) {
    const { propertyId, page = 1, limit = 20 } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.PaymentPlanWhereInput = {};

    if (propertyId) where.propertyId = propertyId;

    const [paymentPlans, total] = await Promise.all([
      this.prisma.paymentPlan.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
          _count: {
            select: {
              milestones: true,
            },
          },
        },
        orderBy: [{ propertyId: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.paymentPlan.count({ where }),
    ]);

    return {
      success: true,
      data: paymentPlans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const paymentPlan = await this.prisma.paymentPlan.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            developer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${id} not found`);
    }

    return {
      success: true,
      data: paymentPlan,
    };
  }


  async findByProperty(propertyId: string, filterDto: FilterPaymentPlanDto) {
    await this.validateProperty(propertyId);
    return this.findAll({ ...filterDto, propertyId });
  }

  async update(id: string, updatePaymentPlanDto: UpdatePaymentPlanDto) {
    await this.findOne(id);

    const { propertyId, ...updateData } = updatePaymentPlanDto;

    if (propertyId) {
      await this.validateProperty(propertyId);
    }

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const existingPlan = await this.prisma.paymentPlan.findFirst({
        where: {
          propertyId: propertyId || (await this.getPropertyId(id)),
          name: updateData.name,
          id: { not: id },
        },
      });

      if (existingPlan) {
        throw new BadRequestException(
          `Payment plan with name "${updateData.name}" already exists for this property`,
        );
      }
    }

    const updatedPaymentPlan = await this.prisma.paymentPlan.update({
      where: { id },
      data: {
        ...updateData,
        ...(propertyId && { propertyId }),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Payment plan updated successfully',
      data: updatedPaymentPlan,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if plan has milestones
    const milestonesCount = await this.prisma.milestone.count({
      where: { planId: id },
    });

    if (milestonesCount > 0) {
      throw new BadRequestException(
        `Cannot delete payment plan with ${milestonesCount} milestones. Delete milestones first or use force delete.`,
      );
    }

    await this.prisma.paymentPlan.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Payment plan deleted successfully',
    };
  }



  async getSummary() {
    const [
      totalPlans,
      plansWithMilestones,
      avgInstallments,
      avgDownPayment,
      propertyStats,
    ] = await Promise.all([
      this.prisma.paymentPlan.count(),
      this.prisma.paymentPlan.count({
        where: {
          milestones: {
            some: {},
          },
        },
      }),
      this.prisma.paymentPlan.aggregate({
        _avg: { totalInstallments: true },
      }),
      this.prisma.paymentPlan.aggregate({
        _avg: { downPaymentPercent: true },
      }),
      this.prisma.paymentPlan.groupBy({
        by: ['propertyId'],
        _count: true,
        orderBy: {
          _count: {
            propertyId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get property details for top properties
    const topProperties = await Promise.all(
      propertyStats.map(async stat => {
        const property = await this.prisma.property.findUnique({
          where: { id: stat.propertyId },
          select: { id: true, title: true },
        });
        return {
          ...property,
          planCount: stat._count,
        };
      }),
    );

    return {
      success: true,
      data: {
        totalPlans,
        plansWithMilestones,
        plansWithoutMilestones: totalPlans - plansWithMilestones,
        averageInstallments: avgInstallments._avg.totalInstallments || 0,
        averageDownPayment: avgDownPayment._avg.downPaymentPercent || 0,
        topPropertiesByPlans: topProperties,
      },
    };
  }

  async getPropertySummary(propertyId: string) {
    await this.validateProperty(propertyId);

    const [totalPlans, plansWithMilestones, milestoneStats] =
      await Promise.all([
        this.prisma.paymentPlan.count({
          where: { propertyId },
        }),
        this.prisma.paymentPlan.count({
          where: {
            propertyId,
            milestones: {
              some: {},
            },
          },
        }),
        this.prisma.milestone.aggregate({
          where: {
            plan: {
              propertyId,
            },
          },
          _count: true,
          _avg: {
            percentageDue: true,
          },
        }),
      ]);

    const plans = await this.prisma.paymentPlan.findMany({
      where: { propertyId },
      include: {
        _count: {
          select: { milestones: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: {
        propertyId,
        totalPlans,
        plansWithMilestones,
        plansWithoutMilestones: totalPlans - plansWithMilestones,
        totalMilestones: milestoneStats._count,
        averageMilestonePercentage: milestoneStats._avg.percentageDue || 0,
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          downPaymentPercent: plan.downPaymentPercent,
          totalInstallments: plan.totalInstallments,
          milestoneCount: plan._count.milestones,
        })),
      },
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

  private async getPropertyId(planId: string): Promise<string> {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id: planId },
      select: { propertyId: true },
    });

    if (!plan) {
      throw new NotFoundException(`Payment plan with ID ${planId} not found`);
    }

    return plan.propertyId;
  }
}