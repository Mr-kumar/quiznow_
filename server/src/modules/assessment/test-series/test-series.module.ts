import { Module } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';
import { PrismaService } from '../../../services/prisma/prisma.service';

@Module({
  controllers: [TestSeriesController],
  providers: [TestSeriesService, PrismaService],
})
export class TestSeriesModule {}
