import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { SchedulerService } from '../../../common/services/scheduler.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, SchedulerService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
