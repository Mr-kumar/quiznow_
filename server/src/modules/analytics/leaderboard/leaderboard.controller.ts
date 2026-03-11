import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Analytics (Leaderboard)')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('test/:testId')
  @ApiOperation({ summary: 'Get leaderboard for a test' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTestLeaderboard(
    @Param('testId') testId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req?: any,
  ) {
    const result = await this.leaderboardService.getTestLeaderboard(
      testId,
      page,
      limit,
    );

    let currentUserEntry: any = null;
    if (req?.user?.userId) {
      const userRank = await this.leaderboardService.getUserRank(
        testId,
        req.user.userId,
      );
      if (userRank) {
        currentUserEntry = {
          rank: userRank.rank,
          userId: req.user.userId,
          score: userRank.score,
          accuracy: userRank.accuracy,
          timeTaken: userRank.timeTaken,
        };
      }
    }

    return {
      entries: result.entries.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        userName: entry.user?.name || 'Anonymous',
        score: entry.score,
        accuracy: entry.accuracy || 0,
        timeTaken: entry.timeTaken || 0,
        timestamp: entry.createdAt,
        isCurrentUser: req?.user?.userId === entry.userId,
      })),
      currentUserEntry,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    };
  }

  @Get('test/:testId/user/:userId')
  @ApiOperation({ summary: 'Get specific user rank and percentile' })
  async getUserRank(
    @Param('testId') testId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.leaderboardService.getUserRank(testId, userId);

    if (!result) {
      return {
        rank: null,
        percentile: null,
        totalParticipants: 0,
        score: 0,
        accuracy: 0,
      };
    }

    return {
      rank: result.rank,
      percentile: result.percentile,
      totalParticipants: result.totalParticipants,
      score: result.score,
      accuracy: result.accuracy,
    };
  }
}
