import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../services/prisma/prisma.service';
import {
  AuditLogQueryDto,
  CreateAuditLogDto,
  PaginatedAuditLogsResponse,
} from './dto';

// ─── Public interface for fire-and-forget callers ───────────────────────────
// Other services call this instead of log() to ensure they can't accidentally
// await and couple their happy path to audit-log DB latency.
export interface AuditLogEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Query: all logs (admin dashboard) ─────────────────────────────────────
  async findAll(query: AuditLogQueryDto): Promise<PaginatedAuditLogsResponse> {
    const { page = 1, limit = 20, search, action, targetType, actorId } = query;
    const skip = (page - 1) * limit;

    // Build where incrementally — avoids the overwrite bug in the original
    // where action filter was clobbered when both action + search were set.
    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (targetType) {
      where.targetType = { equals: targetType, mode: 'insensitive' };
    }

    if (actorId) {
      where.actorId = actorId;
    }

    // Full-text search across the most useful fields. Applied as an AND with
    // the above filters (not OR) so narrowing works as expected.
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { targetType: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { actorId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Avoid returning raw metadata blobs on list view — caller can fetch one.
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          actorId: true,
          actorRole: true,
          createdAt: true,
          // metadata intentionally excluded here for list performance
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Map bigint IDs to strings for AuditLogItem compatibility
    const mappedData = data.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Query: single log with metadata ───────────────────────────────────────
  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id: id as any } });
  }

  // ── Query: history for a specific entity (e.g. all events on Question X) ──
  async findByTarget(
    targetType: string,
    targetId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedAuditLogsResponse> {
    const skip = (page - 1) * limit;
    const where = { targetType, targetId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Map bigint IDs to strings for AuditLogItem compatibility
    const mappedData = data.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return {
      data: mappedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Query: all actions performed by one actor ─────────────────────────────
  async findByActor(
    actorId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedAuditLogsResponse> {
    const skip = (page - 1) * limit;
    const where = { actorId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Map bigint IDs to strings for AuditLogItem compatibility
    const mappedData = data.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return {
      data: mappedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Query: summary counts grouped by action (useful for admin dashboard) ──
  async getStats(): Promise<{ action: string; count: number }[]> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    });

    return groups.map((g) => ({ action: g.action, count: g._count.action }));
  }

  // ── Write: structured log entry — for awaited callers ─────────────────────
  // Use this when you need to know the log was written (e.g. inside a
  // transaction). For fire-and-forget, use logAsync() below.
  async log(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        actorId: entry.actorId,
        actorRole: entry.actorRole as any,
        metadata: (entry.metadata ?? {}) as any,
      },
    });
  }

  // ── Write: fire-and-forget wrapper ────────────────────────────────────────
  // Call this from other services so audit failures NEVER bubble up to the
  // caller's response. Errors are logged to console/APM but swallowed.
  //
  // Usage:
  //   this.auditLogs.logAsync({ action: 'QUESTION_DELETED', ... });
  //
  logAsync(entry: AuditLogEntry): void {
    this.log(entry).catch((err) => {
      this.logger.error(
        `Audit log write failed — action=${entry.action} target=${entry.targetType}:${entry.targetId}`,
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  // ── Maintenance: prune old logs (cron-safe) ───────────────────────────────
  async deleteOldLogs(daysOld = 90): Promise<{ deleted: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    this.logger.log(
      `Pruned ${result.count} audit logs older than ${daysOld} days`,
    );
    return { deleted: result.count };
  }
}
