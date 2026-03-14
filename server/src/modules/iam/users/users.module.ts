import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { StudentUsersController } from './student-users.controller';
import { UsersService } from './users.service';
import { AuditLogsModule } from '../../admin/audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [UsersController, StudentUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
