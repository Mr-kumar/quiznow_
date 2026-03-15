import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { StudentUsersController } from './student-users.controller';
import { PublicUsersController } from './public-users.controller';
import { UsersService } from './users.service';
import { AuditLogsModule } from '../../admin/audit-logs/audit-logs.module';
import { CacheModule } from '../../../cache/cache.module';

@Module({
  imports: [AuditLogsModule, CacheModule],
  controllers: [UsersController, StudentUsersController, PublicUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
