import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { PublicTestsController } from './public-tests.controller';
import { LeaderboardModule } from '../../analytics/leaderboard/leaderboard.module';
import { AttemptsModule } from '../attempts/attempts.module';

@Module({
  imports: [LeaderboardModule, AttemptsModule],
  controllers: [TestsController, PublicTestsController],
  providers: [TestsService],
})
export class TestsModule {}
