import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { PublicAnalyticsController } from './public-analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CacheService } from '../../cache/cache.service';

@Module({
  controllers: [AnalyticsController, PublicAnalyticsController],
  providers: [AnalyticsService, CacheService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
