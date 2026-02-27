import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  controllers: [TopicsController],
  providers: [TopicsService, PrismaService],
  exports: [TopicsService],
})
export class TopicsModule {}
