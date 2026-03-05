import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { SchedulerService } from '../../../common/services/scheduler.service';
import { PrismaService } from '../../../services/prisma/prisma.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, SchedulerService, PrismaService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
