import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { FilterMilestoneDto } from './dto/filter-milestone.dto';
import { MilestoneTrigger, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class MilestoneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMilestoneDto: CreateMilestoneDto) {
    const { planId, dueDate, ...milestoneData } = createMilestoneDto;

    // Validate payment plan exists
    await this.validatePaymentPlan(planId);

    // Check if milestone order already exists
    const existingMilestone = await this.prisma.milestone.findUnique({
      where: {
        planId_milestoneOrder: {
          planId,
          milestoneOrder: milestoneData.milestoneOrder,
        },
      },
    });

    if (existingMilestone) {
      throw new BadRequestException(
        `Milestone with order ${milestoneData.milestoneOrder} already exists for this payment plan`,
      );
    }

    // Validate percentage total doesn't exceed 100
    await this.validatePercentageTotal(planId, milestoneData.percentageDue);

    try {
      const milestone = await this.prisma.milestone.create({
        data: {
          planId,
          ...milestoneData,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        message: 'Milestone created successfully',
        data: milestone,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid payment plan ID');
        }
      }
      throw error;
    }
  }


  async findAll(filterDto: FilterMilestoneDto) {
    const {
      planId,
      triggerCondition,
      hasDueDate,
      page = 1,
      limit = 50,
    } = filterDto;

    const skip = (page - 1) * limit;
    const where: Prisma.MilestoneWhereInput = {};

    if (planId) where.planId = planId;
    if (triggerCondition) where.triggerCondition = triggerCondition;
    if (hasDueDate !== undefined) {
      where.dueDate = hasDueDate ? { not: null } : null;
    }

    const [milestones, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy: [
          { planId: 'asc' },
          { milestoneOrder: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.milestone.count({ where }),
    ]);

    return {
      success: true,
      data: milestones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return {
      success: true,
      data: milestone,
    };
  }

 
  async findByPlan(planId: string, filterDto: FilterMilestoneDto) {
    await this.validatePaymentPlan(planId);
    return this.findAll({ ...filterDto, planId });
  }

  async findByTriggerCondition(condition: MilestoneTrigger, filterDto: FilterMilestoneDto) {
    return this.findAll({ ...filterDto, triggerCondition: condition });
  }

  async findUpcoming(days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const milestones = await this.prisma.milestone.findMany({
      where: {
        dueDate: {
          not: null,
          gte: now,
          lte: futureDate,
        },
        triggerCondition: MilestoneTrigger.DATE_BASED,
      },
      include: {
        plan: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return {
      success: true,
      data: milestones,
      count: milestones.length,
      timeframe: `${days} days`,
    };
  }

async update(id: string, updateMilestoneDto: UpdateMilestoneDto) {
  // First check if milestone exists - this will throw if not found
  await this.findOne(id);

  const { planId, dueDate, ...updateData } = updateMilestoneDto;

  if (planId) {
    await this.validatePaymentPlan(planId);
  }

  // If updating order, check for conflicts
  if (updateData.milestoneOrder) {
    const currentMilestone = await this.prisma.milestone.findUnique({
      where: { id },
      select: { planId: true },
    });

    // Since we already checked existence with findOne, we can assert it's not null
    if (!currentMilestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    const targetPlanId = planId || currentMilestone.planId;

    const existingMilestone = await this.prisma.milestone.findUnique({
      where: {
        planId_milestoneOrder: {
          planId: targetPlanId,
          milestoneOrder: updateData.milestoneOrder,
        },
      },
    });

    if (existingMilestone && existingMilestone.id !== id) {
      throw new BadRequestException(
        `Milestone with order ${updateData.milestoneOrder} already exists for this payment plan`,
      );
    }
  }

  // If updating percentage, validate total
  if (updateData.percentageDue) {
    const currentMilestone = await this.prisma.milestone.findUnique({
      where: { id },
      select: { planId: true, percentageDue: true },
    });

    // Since we already checked existence with findOne, we can assert it's not null
    if (!currentMilestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    const percentageDiff = updateData.percentageDue - currentMilestone.percentageDue;
    await this.validatePercentageTotal(
      currentMilestone.planId,
      percentageDiff,
      true,
    );
  }

  const updatedMilestone = await this.prisma.milestone.update({
    where: { id },
    data: {
      ...updateData,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(planId && { planId }),
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    success: true,
    message: 'Milestone updated successfully',
    data: updatedMilestone,
  };
}

  async reorder(planId: string, items: { id: string; milestoneOrder: number }[]) {
    await this.validatePaymentPlan(planId);

    // Validate all items belong to this plan
    const milestoneIds = items.map(item => item.id);
    const milestones = await this.prisma.milestone.findMany({
      where: {
        id: { in: milestoneIds },
        planId,
      },
    });

    if (milestones.length !== items.length) {
      throw new BadRequestException('Some milestones do not belong to this plan');
    }

    // Check for duplicate order numbers
    const orders = items.map(item => item.milestoneOrder);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new BadRequestException('Duplicate milestone orders');
    }

    // Update in transaction
    const updates = items.map(item =>
      this.prisma.milestone.update({
        where: { id: item.id },
        data: { milestoneOrder: item.milestoneOrder },
      })
    );

    await this.prisma.$transaction(updates);

    return {
      success: true,
      message: 'Milestones reordered successfully',
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if milestone has payments
    const paymentsCount = await this.prisma.milestonePayment.count({
      where: { milestoneId: id },
    });

    if (paymentsCount > 0) {
      throw new BadRequestException(
        `Cannot delete milestone with ${paymentsCount} payments`,
      );
    }

    await this.prisma.milestone.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Milestone deleted successfully',
    };
  }

  async removeAllByPlan(planId: string) {
    await this.validatePaymentPlan(planId);

    // Check if any milestones have payments
    const milestonesWithPayments = await this.prisma.milestone.findMany({
      where: {
        planId,
        payments: {
          some: {},
        },
      },
      select: {
        id: true,
        milestoneOrder: true,
        _count: {
          select: { payments: true },
        },
      },
    });

    if (milestonesWithPayments.length > 0) {
      const milestoneInfo = milestonesWithPayments
        .map(m => `Order ${m.milestoneOrder} (${m._count.payments} payments)`)
        .join(', ');
      
      throw new BadRequestException(
        `Cannot delete milestones with payments: ${milestoneInfo}`,
      );
    }

    const result = await this.prisma.milestone.deleteMany({
      where: { planId },
    });

    return {
      success: true,
      message: `Successfully deleted ${result.count} milestones`,
      count: result.count,
    };
  }

  async getPlanSummary(planId: string) {
    await this.validatePaymentPlan(planId);

    const milestones = await this.prisma.milestone.findMany({
      where: { planId },
      include: {
        _count: {
          select: { payments: true },
        },
      },
      orderBy: {
        milestoneOrder: 'asc',
      },
    });

    const totalPercentage = milestones.reduce(
      (sum, m) => sum + m.percentageDue,
      0,
    );

    const byTriggerCondition = milestones.reduce(
      (acc, m) => {
        acc[m.triggerCondition] = (acc[m.triggerCondition] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const withDueDate = milestones.filter(m => m.dueDate).length;
    const withConstructionStage = milestones.filter(m => m.constructionStage).length;

    return {
      success: true,
      data: {
        planId,
        totalMilestones: milestones.length,
        totalPercentage,
        remainingPercentage: 100 - totalPercentage,
        byTriggerCondition,
        withDueDate,
        withConstructionStage,
        milestones: milestones.map(m => ({
          id: m.id,
          order: m.milestoneOrder,
          description: m.description,
          percentageDue: m.percentageDue,
          triggerCondition: m.triggerCondition,
          dueDate: m.dueDate,
          constructionStage: m.constructionStage,
          paymentCount: m._count.payments,
        })),
      },
    };
  }

  private async validatePaymentPlan(planId: string) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Payment plan with ID ${planId} not found`);
    }

    return plan;
  }

  private async validatePercentageTotal(
    planId: string,
    newPercentage: number,
    isUpdate: boolean = false,
  ) {
    const milestones = await this.prisma.milestone.findMany({
      where: { planId },
      select: { percentageDue: true },
    });

    const currentTotal = milestones.reduce((sum, m) => sum + m.percentageDue, 0);
    const newTotal = isUpdate ? currentTotal + newPercentage : currentTotal + newPercentage;

    if (newTotal > 100) {
      throw new BadRequestException(
        `Total milestone percentage would exceed 100% (${newTotal}%)`,
      );
    }

    return newTotal;
  }
}