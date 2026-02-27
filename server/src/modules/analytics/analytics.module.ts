import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService, CacheService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
