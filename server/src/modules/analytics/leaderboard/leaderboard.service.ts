import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTestLeaderboard(testId: string) {
    // 1. Fetch all COMPLETED attempts for this test
    const attempts = await this.prisma.attempt.findMany({
      where: {
        testId: testId,
        status: 'SUBMITTED', // Only count finished tests
      },
      select: {
        score: true,
        timeTaken: true, // We will use this for tie-breaking later
        user: {
          select: { id: true, name: true, email: true }, // Get student details
        },
      },
      orderBy: [
        { score: 'desc' }, // Highest Score First
        { timeTaken: 'asc' }, // If tie, fastest time wins
      ],
      take: 10, // Top 10 Only (Toppers List)
    });

    // 2. Add "Rank" number to each
    return attempts.map((attempt, index) => ({
      rank: index + 1,
      name: attempt.user.name || attempt.user.email, // Fallback if name is empty
      score: attempt.score,
      timeTaken: attempt.timeTaken,
    }));
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
    };
  }
}
