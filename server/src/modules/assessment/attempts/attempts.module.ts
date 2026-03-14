import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { AdminAttemptsController } from './admin-attempts.controller';
import { SchedulerModule } from '../../../common/services/scheduler.module';
import { CacheModule } from '../../../cache/cache.module';

@Module({
  imports: [SchedulerModule, CacheModule],
  controllers: [AttemptsController, AdminAttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
