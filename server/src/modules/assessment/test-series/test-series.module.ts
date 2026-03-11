import { Module } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';
import { PublicTestSeriesController } from './public-test-series.controller';

@Module({
  controllers: [TestSeriesController, PublicTestSeriesController],
  providers: [TestSeriesService],
})
export class TestSeriesModule {}
