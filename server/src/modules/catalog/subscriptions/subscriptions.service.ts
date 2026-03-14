import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionStatus, Role } from '@prisma/client';
import { AuditLogsService } from '../../admin/audit-logs/audit-logs.service';
import { AuditAction } from '../../admin/audit-logs/dto/create-audit-log.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
    actorId?: string,
    actorRole?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: createSubscriptionDto.userId },
    });

    if (!user || (user as any).deletedAt) {
      throw new BadRequestException('User not found');
    }

    if (user.role !== Role.STUDENT) {
      throw new BadRequestException(
        'Subscriptions can only be created for student accounts',
      );
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: createSubscriptionDto.planId },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const startAt = new Date();
    const expiresAt = new Date(startAt);
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    const subscription = await this.prisma.subscription.create({
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
    this.auditLogs.logAsync({
      action: AuditAction.SUBSCRIPTION_CREATED,
      targetType: 'Subscription',
      targetId: subscription.id,
      actorId,
      actorRole,
      metadata: {
        userId: subscription.userId,
        planId: subscription.planId,
        startAt,
        expiresAt,
      },
    });
    return subscription;
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

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    actorId?: string,
    actorRole?: string,
  ) {
    const sub = await this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
      include: {
        plan: true,
        user: true,
      },
    });
    this.auditLogs.logAsync({
      action: AuditAction.SUBSCRIPTION_CREATED,
      targetType: 'Subscription',
      targetId: id,
      actorId,
      actorRole,
      metadata: updateSubscriptionDto as any,
    });
    return sub;
  }

  async delete(id: string, actorId?: string, actorRole?: string) {
    const sub = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
      include: {
        plan: true,
        user: true,
      },
    });
    this.auditLogs.logAsync({
      action: AuditAction.SUBSCRIPTION_CANCELLED,
      targetType: 'Subscription',
      targetId: id,
      actorId,
      actorRole,
      metadata: {
        userId: sub.userId,
        planId: sub.planId,
        status: sub.status,
      },
    });
    return sub;
  }
  async cancelWithRefundNote(
    id: string,
    actorId?: string,
    actorRole?: string,
  ) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!sub) throw new NotFoundException('Subscription not found');

    const result = await this.prisma.$transaction([
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
    this.auditLogs.logAsync({
      action: AuditAction.SUBSCRIPTION_CANCELLED,
      targetType: 'Subscription',
      targetId: id,
      actorId,
      actorRole,
      metadata: {
        userId: sub.userId,
        planId: sub.planId,
        cancelledWithRefundNote: true,
      },
    });
    return result;
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
