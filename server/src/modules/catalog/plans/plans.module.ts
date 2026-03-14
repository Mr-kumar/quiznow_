import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PublicPlansController } from './public-plans.controller';
import { AuditLogsModule } from '../../admin/audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [PlansController, PublicPlansController],
  providers: [PlansService],
})
export class PlansModule {}
