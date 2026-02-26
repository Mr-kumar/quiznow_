import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics (Leaderboard)')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('test/:testId')
  @ApiOperation({ summary: 'Get Top 10 Rankers for a Test' })
  getTestLeaderboard(@Param('testId') testId: string) {
    return this.leaderboardService.getTestLeaderboard(testId);
  }

  @Get('test/:testId/user/:userId')
  @ApiOperation({ summary: 'Get specific user rank and percentile' })
  getUserRank(
    @Param('testId') testId: string,
    @Param('userId') userId: string,
  ) {
    return this.leaderboardService.getUserRank(testId, userId);
  }
}
