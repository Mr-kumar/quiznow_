import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { Status } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getDashboardMetrics() {
    // Try to get from cache first
    const cached = await this.cacheService.get('dashboard:metrics');
    if (cached) {
      return cached;
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current metrics
    const [
      totalUsers,
      activeTests,
      completedAttempts,
      avgPerformance,
      lastMonthUsers,
      lastMonthTests,
      lastMonthAttempts,
      lastMonthPerformance,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.test.count({ where: { isActive: true, isLive: true } }),
      this.prisma.attempt.count({ where: { status: Status.SUBMITTED } }),
      this.getAveragePerformance(),
      this.prisma.user.count({
        where: { createdAt: { gte: lastMonth, lt: thisMonth } },
      }),
      this.prisma.test.count({
        where: {
          isActive: true,
          isLive: true,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      this.prisma.attempt.count({
        where: {
          status: Status.SUBMITTED,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      this.getAveragePerformance(lastMonth, thisMonth),
    ]);

    // Calculate growth percentages
    const userGrowth =
      lastMonthUsers > 0
        ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100)
        : 0;
    const testGrowth =
      lastMonthTests > 0
        ? Math.round(
            ((activeTests - lastMonthTests) / Math.max(lastMonthTests, 1)) *
              100,
          )
        : 0;
    const attemptGrowth =
      lastMonthAttempts > 0
        ? Math.round(
            ((completedAttempts - lastMonthAttempts) /
              Math.max(lastMonthAttempts, 1)) *
              100,
          )
        : 0;
    const performanceGrowth =
      lastMonthPerformance > 0
        ? Math.round(
            ((avgPerformance - lastMonthPerformance) /
              Math.max(lastMonthPerformance, 1)) *
              100,
          )
        : 0;

    const metrics = {
      totalUsers,
      activeTests,
      completedAttempts,
      avgPerformance,
      lastMonthUsers,
      lastMonthTests,
      lastMonthAttempts,
      lastMonthPerformance,
      userGrowth,
      testGrowth,
      attemptGrowth,
      performanceGrowth,
    };

    // Cache for 5 minutes
    await this.cacheService.set('dashboard:metrics', metrics, 300);
    return metrics;
  }

  async getUserStats() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      students,
      instructors,
      admins,
      newThisMonth,
      activeThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: thisMonth },
          attempts: {
            some: { createdAt: { gte: thisMonth } },
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
      activeThisMonth,
    };
  }

  async getTestStats() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, live, premium, createdThisMonth, completedThisMonth] =
      await Promise.all([
        this.prisma.test.count(),
        this.prisma.test.count({ where: { isActive: true } }),
        this.prisma.test.count({ where: { isActive: true, isLive: true } }),
        this.prisma.test.count({ where: { isPremium: true } }),
        this.prisma.test.count({ where: { createdAt: { gte: thisMonth } } }),
        this.prisma.attempt.count({
          where: {
            status: Status.SUBMITTED,
            createdAt: { gte: thisMonth },
          },
        }),
      ]);

    return {
      total,
      active,
      live,
      premium,
      createdThisMonth,
      completedThisMonth,
    };
  }

  async getRevenueStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalSubscriptions,
      activeSubscriptions,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: lastMonthStart, lt: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', expiresAt: { gt: now } },
      }),
      this.prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // amounts stored in paise — convert to rupees
    return {
      totalRevenue: (totalRevenue._sum.amount ?? 0) / 100,
      monthRevenue: (monthRevenue._sum.amount ?? 0) / 100,
      lastMonthRevenue: (lastMonthRevenue._sum.amount ?? 0) / 100,
      totalSubscriptions,
      activeSubscriptions,
      recentPayments,
    };
  }

  async getAttemptStats() {
    const [total, completed, started, expired, avgScore, avgDuration] =
      await Promise.all([
        this.prisma.attempt.count(),
        this.prisma.attempt.count({ where: { status: Status.SUBMITTED } }),
        this.prisma.attempt.count({ where: { status: Status.STARTED } }),
        this.prisma.attempt.count({ where: { status: Status.EXPIRED } }),
        this.getAverageScore(),
        this.getAverageDuration(),
      ]);

    return {
      total,
      completed,
      started,
      expired,
      avgScore,
      avgDuration,
    };
  }

  private async getAveragePerformance(startDate?: Date, endDate?: Date) {
    const where =
      startDate && endDate
        ? {
            status: Status.SUBMITTED,
            createdAt: { gte: startDate, lt: endDate },
          }
        : { status: Status.SUBMITTED };

    const result = await this.prisma.attempt.aggregate({
      where,
      _avg: {
        score: true,
      },
    });

    return Math.round(result._avg.score || 0);
  }

  private async getAverageScore() {
    const result = await this.prisma.attempt.aggregate({
      where: { status: Status.SUBMITTED },
      _avg: {
        score: true,
      },
    });

    return Math.round(result._avg.score || 0);
  }

  private async getAverageDuration() {
    const result = await this.prisma.attempt.aggregate({
      where: { status: Status.SUBMITTED },
      _avg: {
        timeTaken: true,
      },
    });

    return Math.round(result._avg.timeTaken || 0);
  }

  /**
   * Get user's topic-wise performance statistics
   * Safely handles null topicId with proper error handling
   */
  async getUserTopicStats(userId: string) {
    try {
      // Get all topics first
      const allTopics = await this.prisma.topic.findMany({
        include: {
          questions: true,
        },
      });

      // Get user stats for each topic
      const userStats = await this.prisma.userTopicStat.findMany({
        where: { userId },
        include: { topic: true },
      });

      return userStats
        .filter((stat) => stat.topicId) // Only include stats with valid topicId
        .map((stat) => ({
          topicId: stat.topicId,
          topicName: stat.topic?.name || 'Unknown',
          attempts: stat.attempts,
          correct: stat.correct,
          wrong: stat.wrong,
          accuracy: stat.accuracy || 0,
        }));
    } catch (error) {
      this.logger.error(`Failed to get user topic stats for ${userId}`, error);
      return [];
    }
  }

  /**
   * Get test-wise performance statistics with null topic handling
   */
  async getTestWiseStats(userId: string) {
    try {
      const attempts = await this.prisma.attempt.findMany({
        where: { userId, status: Status.SUBMITTED },
        include: {
          test: {
            include: {
              series: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return attempts.map((attempt) => ({
        testId: attempt.testId,
        testName: attempt.test.title,
        seriesName: attempt.test.series?.title,
        score: attempt.score,
        accuracy: attempt.accuracy,
        attemptNumber: attempt.attemptNumber,
        submittedAt: attempt.updatedAt,
        timeTaken: attempt.timeTaken,
      }));
    } catch (error) {
      this.logger.error(`Failed to get test stats for ${userId}`, error);
      return [];
    }
  }
}
