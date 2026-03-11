import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTestLeaderboard(
    testId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // 1. Fetch all COMPLETED attempts for this test with pagination
    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where: {
          testId: testId,
          status: 'SUBMITTED', // Only count finished tests
        },
        select: {
          id: true,
          score: true,
          timeTaken: true,
          userId: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { score: 'desc' }, // Highest Score First
          { timeTaken: 'asc' }, // If tie, fastest time wins
        ],
        skip,
        take: limit,
      }),
      this.prisma.attempt.count({
        where: {
          testId: testId,
          status: 'SUBMITTED',
        },
      }),
    ]);

    // Calculate ranks for the current page
    const rankedAttempts = attempts.map((attempt, index) => ({
      rank: skip + index + 1,
      userId: attempt.userId,
      user: attempt.user,
      score: attempt.score,
      timeTaken: attempt.timeTaken,
      createdAt: attempt.createdAt,
      accuracy: 0, // Would need to calculate from answers
    }));

    return {
      entries: rankedAttempts,
      total,
    };
  }

  // Additional method to get user's specific rank
  async getUserRank(testId: string, userId: string) {
    const allAttempts = await this.prisma.attempt.findMany({
      where: {
        testId: testId,
        status: 'SUBMITTED',
      },
      select: {
        id: true,
        score: true,
        timeTaken: true,
        userId: true,
      },
      orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
    });

    // Find user's rank
    const userIndex = allAttempts.findIndex((a) => a.userId === userId);

    if (userIndex === -1) {
      return null; // User hasn't attempted this test
    }

    const userAttempt = allAttempts[userIndex];
    const totalParticipants = allAttempts.length;

    return {
      rank: userIndex + 1,
      score: userAttempt.score,
      timeTaken: userAttempt.timeTaken,
      totalParticipants,
      percentile: Math.round(
        ((totalParticipants - userIndex) / totalParticipants) * 100,
      ),
      accuracy: 0, // Would need to calculate from answers
    };
  }
}
