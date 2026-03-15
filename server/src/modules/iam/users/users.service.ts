import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CacheService } from 'src/cache/cache.service';
import { User, Role, UserStatus, SubscriptionStatus } from '@prisma/client';
import { AuditLogsService } from '../../admin/audit-logs/audit-logs.service';
import { AuditAction } from '../../admin/audit-logs/dto/create-audit-log.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ data: (User & { subscriptions: any[] })[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: {
              status: SubscriptionStatus.ACTIVE,
              expiresAt: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
              expiresAt: true,
              status: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  durationDays: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(
    createUserDto: CreateUserDto,
    actorId?: string,
    actorRole?: string,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
      },
    });
    this.auditLogs.logAsync({
      action: AuditAction.USER_CREATED,
      targetType: 'User',
      targetId: user.id,
      actorId,
      actorRole,
      metadata: { email: user.email, role: user.role },
    });
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId?: string,
    actorRole?: string,
  ): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If updating email, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    this.auditLogs.logAsync({
      action: AuditAction.USER_UPDATED,
      targetType: 'User',
      targetId: id,
      actorId,
      actorRole,
      metadata: updateUserDto as any,
    });
    return updated;
  }

  async remove(
    id: string,
    actorId?: string,
    actorRole?: string,
  ): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Soft-delete: set deletedAt instead of removing the row
    const deleted = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.auditLogs.logAsync({
      action: AuditAction.USER_DELETED,
      targetType: 'User',
      targetId: id,
      actorId,
      actorRole,
      metadata: { email: existingUser.email, role: existingUser.role },
    });
    return deleted;
  }

  async getStats() {
    const [total, students, instructors, admins, newThisMonth] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: { role: 'STUDENT', deletedAt: null },
        }),
        this.prisma.user.count({
          where: { role: 'INSTRUCTOR', deletedAt: null },
        }),
        this.prisma.user.count({
          where: { role: 'ADMIN', deletedAt: null },
        }),
        this.prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return {
      total,
      students,
      instructors,
      admins,
      newThisMonth,
    };
  }

  // ─── User-specific methods ─────────────────────────────────────────────────────

  async getMyAttempts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId },
        include: {
          test: {
            include: {
              series: {
                include: {
                  exam: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attempt.count({ where: { userId } }),
    ]);

    // Map to AttemptSummary shape expected by the client
    const data = attempts.map((a: any) => ({
      attemptId: String(a.id),
      testId: a.testId,
      testTitle: a.test?.title ?? 'Unknown Test',
      seriesTitle: a.test?.series?.title ?? '',
      examName: a.test?.series?.exam?.name ?? '',
      attemptNumber: a.attemptNumber,
      status: a.status,
      score: a.score ?? 0,
      totalMarks: a.test?.totalMarks ?? 0,
      accuracy: a.accuracy,
      timeTaken: a.timeTaken,
      startTime: a.startTime?.toISOString() ?? a.createdAt?.toISOString(),
      endTime: a.endTime?.toISOString() ?? null,
    }));

    return { data, total, page, limit };
  }

  async getMyTopicStats(userId: string) {
    return this.prisma.userTopicStat.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { correct: 'desc' },
    });
  }

  async getMySubscription(userId: string) {
    const cacheKey = `user:${userId}:subscription`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: { expiresAt: 'desc' },
    });

    // S-15 fix: Cache per userId with TTL: 60s
    await this.cacheService.set(cacheKey, subscription, 60);

    return subscription;
  }
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Fetch stats
    const [attempts, leaderboardEntries, totalTests] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          test: {
            select: { title: true, totalMarks: true },
          },
        },
      }),
      this.prisma.leaderboardEntry.findMany({
        where: { userId },
        include: {
          test: { select: { title: true } },
        },
        orderBy: { score: 'desc' },
        take: 5,
      }),
      this.prisma.attempt.count({
        where: { userId, status: 'SUBMITTED' },
      }),
    ]);

    const avgAccuracy = attempts.length
      ? attempts.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) /
        attempts.length
      : 0;

    return {
      user,
      stats: {
        totalTests,
        avgAccuracy: Math.round(avgAccuracy),
        topPerformances: leaderboardEntries.map((e) => ({
          testTitle: e.test.title,
          score: e.score,
          accuracy: e.accuracy,
        })),
      },
      recentActivity: attempts.map((a) => ({
        id: a.id,
        testTitle: a.test.title,
        score: a.score,
        accuracy: a.accuracy,
        date: a.createdAt,
      })),
    };
  }

  // ─── Admin Deep-Dive methods ───────────────────────────────────────────────────

  async updateStatus(
    id: string,
    status: UserStatus,
    actorId?: string,
    actorRole?: string,
  ): Promise<User> {
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    const action =
      status === 'BANNED'
        ? AuditAction.USER_BANNED
        : AuditAction.USER_ROLE_CHANGED;
    this.auditLogs.logAsync({
      action,
      targetType: 'User',
      targetId: id,
      actorId,
      actorRole,
      metadata: { status },
    });
    return updated;
  }

  async getDeepProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        topicStats: {
          include: {
            topic: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Get aggregated attempt stats
    const attemptsSummary = await this.prisma.attempt.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: { score: true, accuracy: true, timeTaken: true },
    });

    // Recent attempts log
    const recentAttempts = await this.prisma.attempt.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        test: { select: { title: true } },
      },
    });

    return {
      user,
      stats: {
        totalAttempts: attemptsSummary._count.id,
        avgScore: attemptsSummary._avg.score || 0,
        avgAccuracy: attemptsSummary._avg.accuracy || 0,
        avgTimeTaken: attemptsSummary._avg.timeTaken || 0,
      },
      recentAttempts,
    };
  }
}
