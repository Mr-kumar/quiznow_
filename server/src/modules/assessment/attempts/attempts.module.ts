import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { SchedulerService } from 'src/common/services/scheduler.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, PrismaService, SchedulerService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
