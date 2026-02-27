import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, search?: string, action?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' as const };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' as const } },
        { targetType: { contains: search, mode: 'insensitive' as const } },
        { targetId: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getByActor(actorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { actorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: { actorId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async log(
    action: string,
    targetType?: string,
    targetId?: string,
    actorId?: string,
    actorRole?: string,
    metadata?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        targetType,
        targetId,
        actorId,
        actorRole: actorRole as any,
        metadata,
      },
    });
  }

  async deleteOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
