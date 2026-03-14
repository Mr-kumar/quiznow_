import { Module } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';
import { PublicTestSeriesController } from './public-test-series.controller';
import { CacheModule } from '../../../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [TestSeriesController, PublicTestSeriesController],
  providers: [TestSeriesService],
})
export class TestSeriesModule {}
