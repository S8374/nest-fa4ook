import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/context/prisma.service';
import { AgentReviewDto } from './dto/agent-review.dto';
import { AdminVerifyDto } from './dto/admin-verify.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { MilestonePaymentStatus, Prisma } from 'src/generated/prisma/client';
import { CreateMilestonePaymentDto } from './dto/create-mileston-payment.dto';

@Injectable()
export class MilestonePaymentService {
  [x: string]: any;
  constructor(private readonly prisma: PrismaService) {}

  // Step 1: Buyer creates payment (PENDING)
  async create(createMilestonePaymentDto: CreateMilestonePaymentDto) {
    const { milestoneId, buyerId, propertyId, paidAt, ...paymentData } = createMilestonePaymentDto;

    // Validate milestone exists and get its plan
    const milestone = await this.validateMilestone(milestoneId);
    
    // Validate buyer exists
    await this.validateBuyer(buyerId);
    
    // Validate property exists and get its agent
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        agent: {
          include: {
            user: true
          }
        }
      }
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    // Get the agent ID from property
    const agentId = property.listingAgentId;

    // Check if payment plan was accepted
    if (!milestone.plan) {
      throw new BadRequestException('Milestone does not have an associated payment plan');
    }

    const acceptance = await this.prisma.paymentPlanAcceptance.findUnique({
      where: {
        buyerId_propertyId_paymentPlanId: {
          buyerId,
          propertyId,
          paymentPlanId: milestone.plan.id,
        },
      },
    });

    if (!acceptance) {
      throw new BadRequestException(
        'Payment plan must be accepted before making payments'
      );
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.milestonePayment.findFirst({
      where: {
        milestoneId,
        buyerId,
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this milestone and buyer');
    }

    // Calculate expected amount
    const expectedAmount = (milestone.percentageDue / 100) * property.price;
    
    if (paymentData.amountPaid > expectedAmount) {
      throw new BadRequestException(
        `Payment amount exceeds expected amount (${expectedAmount})`
      );
    }

    try {
      const payment = await this.prisma.milestonePayment.create({
        data: {
          milestoneId,
          buyerId,
          agentId, // Auto-assign to property's agent
          ...paymentData,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          status: MilestonePaymentStatus.PENDING,
          isReadByAgent: false,
          isReadByAdmin: false,
        },
        include: {
          milestone: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
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
          },
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Milestone payment created successfully',
        data: {
          ...payment,
          nextStep: 'Waiting for agent review',
          currentStatus: 'PENDING_AGENT_REVIEW',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Step 2: Agent reviews payment (AGENT_REVIEWED)
  async agentReview(paymentId: string, reviewDto: AgentReviewDto) {
    const { agentId, isRead, approved, notes } = reviewDto;

    // Get payment
    const payment = await this.prisma.milestonePayment.findUnique({
      where: { id: paymentId },
      include: {
        milestone: {
          include: {
            plan: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Verify agent is assigned to this payment
    if (payment.agentId !== agentId) {
      throw new BadRequestException('You are not authorized to review this payment');
    }

    // Verify payment is in correct state
    if (payment.status !== MilestonePaymentStatus.PENDING) {
      throw new BadRequestException(`Payment cannot be reviewed. Current status: ${payment.status}`);
    }

    // Update payment based on agent's decision
    let updateData: any = {
      isReadByAgent: isRead,
      agentReviewedAt: new Date(),
    };

    if (approved === false) {
      // Agent rejects directly
      updateData.status = MilestonePaymentStatus.REJECTED;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = notes || 'Rejected by agent';
      updateData.notes = notes;
    } else {
      // Agent approves, send to admin
      updateData.status = MilestonePaymentStatus.AGENT_REVIEWED;
      updateData.notes = notes;
    }

    const updatedPayment = await this.prisma.milestonePayment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        milestone: true,
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: approved === false 
        ? 'Payment rejected by agent' 
        : 'Payment reviewed and forwarded to admin',
      data: {
        ...updatedPayment,
        nextStep: approved === false 
          ? 'Payment rejected' 
          : 'Waiting for admin verification',
      },
    };
  }

  // Step 3: Admin verifies payment (VERIFIED/REJECTED)
  async adminVerify(paymentId: string, verifyDto: AdminVerifyDto) {
    const { adminId, verified, rejectionReason, notes } = verifyDto;

    // Get payment
    const payment = await this.prisma.milestonePayment.findUnique({
      where: { id: paymentId },
      include: {
        milestone: true,
        buyer: true,
      }
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Verify payment is in correct state
    if (payment.status !== MilestonePaymentStatus.AGENT_REVIEWED) {
      throw new BadRequestException(
        `Payment must be reviewed by agent first. Current status: ${payment.status}`
      );
    }

    const updateData: any = {
      adminId,
      isReadByAdmin: true,
      verifiedAt: verified ? new Date() : null,
      rejectedAt: verified ? null : new Date(),
      rejectionReason: verified ? null : (rejectionReason || 'Rejected by admin'),
      notes: notes || payment.notes,
    };

    if (verified) {
      updateData.status = MilestonePaymentStatus.VERIFIED;
    } else {
      updateData.status = MilestonePaymentStatus.REJECTED;
    }

    const updatedPayment = await this.prisma.milestonePayment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        milestone: true,
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment rejected',
      data: updatedPayment,
    };
  }

  // Get payments pending agent review
  async getPendingAgentReviews(agentId: string, filterDto: FilterPaymentDto) {
    const { page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.milestonePayment.findMany({
        where: {
          agentId,
          status: MilestonePaymentStatus.PENDING,
          isReadByAgent: false,
        },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          milestone: {
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
          },
        },
        orderBy: { paidAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.milestonePayment.count({
        where: {
          agentId,
          status: MilestonePaymentStatus.PENDING,
        },
      }),
    ]);

    return {
      success: true,
      data: payments.map(p => ({
        ...p,
        action: 'Review Payment',
        daysPending: Math.floor((Date.now() - new Date(p.paidAt).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get payments pending admin verification
  async getPendingAdminVerifications(adminId: string, filterDto: FilterPaymentDto) {
    const { page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.milestonePayment.findMany({
        where: {
          status: MilestonePaymentStatus.AGENT_REVIEWED,
        },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          agent: {
            select: {
              id: true,
              fullName: true,
            },
          },
          milestone: {
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
          },
        },
        orderBy: { agentReviewedAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.milestonePayment.count({
        where: { status: MilestonePaymentStatus.AGENT_REVIEWED },
      }),
    ]);

    return {
      success: true,
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get buyer's payment history
  async getBuyerPayments(buyerId: string, filterDto: FilterPaymentDto) {
    const { page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.milestonePayment.findMany({
        where: { buyerId },
        include: {
          milestone: {
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
          },
          agent: {
            select: {
              id: true,
              fullName: true,
            },
          },
          admin: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.milestonePayment.count({ where: { buyerId } }),
    ]);

    return {
      success: true,
      data: payments.map(p => ({
        ...p,
        statusDisplay: this.getStatusDisplay(p.status),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get single payment with full details
  async findOneWithDetails(id: string) {
    const payment = await this.prisma.milestonePayment.findUnique({
      where: { id },
      include: {
        milestone: {
          include: {
            plan: {
              include: {
                property: {
                  include: {
                    agent: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        ...payment,
        statusDisplay: this.getStatusDisplay(payment.status),
      },
    };
  }

  // Helper methods
  private getStatusDisplay(status: MilestonePaymentStatus): {
    label: string;
    color: string;
    step: string;
  } {
    switch (status) {
      case MilestonePaymentStatus.PENDING:
        return {
          label: 'Pending Agent Review',
          color: 'yellow',
          step: 'Step 1 of 3',
        };
      case MilestonePaymentStatus.AGENT_REVIEWED:
        return {
          label: 'Pending Admin Verification',
          color: 'blue',
          step: 'Step 2 of 3',
        };
      case MilestonePaymentStatus.VERIFIED:
        return {
          label: 'Verified',
          color: 'green',
          step: 'Completed',
        };
      case MilestonePaymentStatus.REJECTED:
        return {
          label: 'Rejected',
          color: 'red',
          step: 'Failed',
        };
      default:
        return {
          label: status,
          color: 'gray',
          step: 'Unknown',
        };
    }
  }

 

  async getPaymentStats(agentId?: string, adminId?: string) {
    const where: any = {};
    
    if (agentId) where.agentId = agentId;
    
    const [total, pending, agentReviewed, verified, rejected, totalAmount] = 
      await Promise.all([
        this.prisma.milestonePayment.count({ where }),
        this.prisma.milestonePayment.count({ 
          where: { ...where, status: MilestonePaymentStatus.PENDING } 
        }),
        this.prisma.milestonePayment.count({ 
          where: { ...where, status: MilestonePaymentStatus.AGENT_REVIEWED } 
        }),
        this.prisma.milestonePayment.count({ 
          where: { ...where, status: MilestonePaymentStatus.VERIFIED } 
        }),
        this.prisma.milestonePayment.count({ 
          where: { ...where, status: MilestonePaymentStatus.REJECTED } 
        }),
        this.prisma.milestonePayment.aggregate({
          where: { ...where, status: MilestonePaymentStatus.VERIFIED },
          _sum: { amountPaid: true },
        }),
      ]);

    return {
      success: true,
      data: {
        total,
        pending: {
          count: pending,
          action: 'Review by Agent',
        },
        agentReviewed: {
          count: agentReviewed,
          action: 'Verify by Admin',
        },
        verified,
        rejected,
        totalAmountVerified: totalAmount._sum.amountPaid || 0,
      },
    };
  }

  private async validateMilestone(milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        plan: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found`);
    }

    return milestone;
  }

  private async validateBuyer(buyerId: string) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      include: {
        buyerProfile: true,
      },
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer with ID ${buyerId} not found`);
    }

    // if (!buyer.buyerProfile) {
    //   throw new BadRequestException(`User ${buyerId} does not have a buyer profile`);
    // }

    return buyer;
  }

  // ... other existing methods (findAll, findOne, etc.)
}