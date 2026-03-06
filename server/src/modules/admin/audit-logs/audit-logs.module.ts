import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { PrismaModule } from '../../../services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  // Export so any feature module can inject AuditLogsService
  // by importing AuditLogsModule — no circular deps, no God modules
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
