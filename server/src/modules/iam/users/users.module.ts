import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { StudentUsersController } from './student-users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, StudentUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
