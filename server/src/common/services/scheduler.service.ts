import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Status } from '@prisma/client';

/**
 * Handles scheduled tasks for the application
 * Uses @nestjs/schedule for cron jobs
 * DRY: Centralized scheduler for all background tasks
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Expires old attempts every 5 minutes
   * Checks if attempt is past its end time based on test duration
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireAttempts() {
    try {
      const now = new Date();

      // Find all STARTED attempts that have exceeded their test duration
      const startedAttempts = await this.prisma.attempt.findMany({
        where: {
          status: Status.STARTED,
          startTime: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Older than 24 hours
          },
        },
        include: { test: true },
      });

      if (startedAttempts.length === 0) {
        return;
      }

      // Mark them as expired
      await this.prisma.attempt.updateMany({
        where: {
          id: { in: startedAttempts.map((a) => a.id) },
        },
        data: {
          status: Status.EXPIRED,
          endTime: now,
        },
      });

      this.logger.log(
        `Expired ${startedAttempts.length} attempts older than 24 hours`,
      );
    } catch (error) {
      this.logger.error('Failed to expire attempts:', error);
    }
  }

  /**
   * Expires old subscriptions every hour
   * Marks subscriptions as EXPIRED if expiresAt is in the past
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    try {
      const now = new Date();

      const result = await this.prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: now,
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (result.count > 0) {
        this.logger.log(`Expired ${result.count} subscriptions`);
      }
    } catch (error) {
      this.logger.error('Failed to expire subscriptions:', error);
    }
  }

  /**
   * Cleans up old audit logs every day at 2 AM
   * Keeps only last 90 days of logs
   */
  @Cron('0 2 * * *')
  async cleanupAuditLogs() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Deleted ${result.count} old audit logs`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs:', error);
    }
  }

  /**
   * Force-expire specific attempt (manual trigger)
   * Used when test time limit is reached
   */
  async forceExpireAttempt(attemptId: string): Promise<void> {
    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: Status.EXPIRED,
        endTime: new Date(),
      },
    });
    this.logger.warn(`Manually expired attempt: ${attemptId}`);
  }

  /**
   * Check if attempt is expired based on test duration
   */
  async isAttemptExpired(attemptId: string): Promise<boolean> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!attempt || attempt.status !== Status.STARTED) {
      return true; // Already submitted/expired
    }

    const now = new Date();
    const elapsedMinutes =
      (now.getTime() - attempt.startTime.getTime()) / (1000 * 60);

    return elapsedMinutes > attempt.test.durationMins;
  }
}
