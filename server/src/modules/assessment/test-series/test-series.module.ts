import { Module } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';

@Module({
  controllers: [TestSeriesController],
  providers: [TestSeriesService],
})
export class TestSeriesModule {}
