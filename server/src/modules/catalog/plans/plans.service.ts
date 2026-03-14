import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuditLogsService } from '../../admin/audit-logs/audit-logs.service';
import { AuditAction } from '../../admin/audit-logs/dto/create-audit-log.dto';

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async create(
    createPlanDto: CreatePlanDto,
    actorId?: string,
    actorRole?: string,
  ) {
    const plan = await this.prisma.plan.create({
      data: createPlanDto,
      include: {
        accesses: true,
        subscriptions: true,
      },
    });
    this.auditLogs.logAsync({
      action: AuditAction.PLAN_CREATED,
      targetType: 'Plan',
      targetId: plan.id,
      actorId,
      actorRole,
      metadata: {
        name: plan.name,
        price: (plan as any).price,
        durationDays: (plan as any).durationDays,
      },
    });
    return plan;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' as const } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip,
        take: limit,
        include: {
          accesses: {
            include: {
              exam: true,
              series: true,
            },
          },
          subscriptions: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        accesses: {
          include: {
            exam: true,
            series: true,
          },
        },
        subscriptions: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updatePlanDto: UpdatePlanDto,
    actorId?: string,
    actorRole?: string,
  ) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
      include: {
        accesses: true,
        subscriptions: true,
      },
    });
    this.auditLogs.logAsync({
      action: AuditAction.PLAN_UPDATED,
      targetType: 'Plan',
      targetId: id,
      actorId,
      actorRole,
      metadata: updatePlanDto as any,
    });
    return plan;
  }

  async delete(id: string, actorId?: string, actorRole?: string) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.auditLogs.logAsync({
      action: AuditAction.PLAN_DELETED,
      targetType: 'Plan',
      targetId: id,
      actorId,
      actorRole,
      metadata: { deletedAt: plan.deletedAt },
    });
    return plan;
  }

  async findPublicPlans() {
    return this.prisma.plan.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        price: true,
        durationDays: true,
        description: true,
        features: true,
        isPopular: true,
        badge: true,
        accesses: {
          select: {
            id: true,
            examId: true,
            seriesId: true,
            exam: { select: { id: true, name: true } },
            series: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  async addAccess(
    planId: string,
    dto: { examId?: string; seriesId?: string },
    actorId?: string,
    actorRole?: string,
  ) {
    if (!dto.examId && !dto.seriesId) {
      throw new BadRequestException('Provide examId or seriesId');
    }
    if (dto.examId && dto.seriesId) {
      throw new BadRequestException('Provide only one: examId OR seriesId');
    }

    const access = await this.prisma.planAccess.create({
      data: { planId, examId: dto.examId, seriesId: dto.seriesId },
      include: { exam: true, series: true },
    });
    this.auditLogs.logAsync({
      action: AuditAction.SECTION_QUESTIONS_LINKED,
      targetType: 'PlanAccess',
      targetId: access.id,
      actorId,
      actorRole,
      metadata: {
        planId,
        examId: dto.examId,
        seriesId: dto.seriesId,
      },
    });
    return access;
  }

  async removeAccess(
    accessId: string,
    actorId?: string,
    actorRole?: string,
  ) {
    const access = await this.prisma.planAccess.delete({ where: { id: accessId } });
    this.auditLogs.logAsync({
      action: AuditAction.SECTION_QUESTION_UNLINKED,
      targetType: 'PlanAccess',
      targetId: accessId,
      actorId,
      actorRole,
      metadata: {
        planId: access.planId,
        examId: access.examId,
        seriesId: access.seriesId,
      },
    });
    return access;
  }

  async getPlanAccesses(planId: string) {
    return this.prisma.planAccess.findMany({
      where: { planId },
      include: { exam: true, series: true },
    });
  }
}
