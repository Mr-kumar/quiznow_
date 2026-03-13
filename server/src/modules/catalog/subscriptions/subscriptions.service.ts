import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: createSubscriptionDto.planId },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const startAt = new Date();
    const expiresAt = new Date(startAt);
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    return this.prisma.subscription.create({
      data: {
        userId: createSubscriptionDto.userId,
        planId: createSubscriptionDto.planId,
        startAt,
        expiresAt,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
        user: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
        { user: { name: { contains: search, mode: 'insensitive' as const } } },
        { plan: { name: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
      },
    });
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
      include: {
        plan: true,
        user: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
      include: {
        plan: true,
        user: true,
      },
    });
  }
  async cancelWithRefundNote(id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!sub) throw new NotFoundException('Subscription not found');

    return this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id },
        data: { status: SubscriptionStatus.CANCELLED },
      }),
      // Mark linked payments as refunded (actual money refunded via Razorpay Dashboard)
      ...sub.payments.map((payment) =>
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        }),
      ),
    ]);
  }
  async getUserActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
  }
}
