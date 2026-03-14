import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  private calculateAccuracy(
    answers: Array<{
      optionId: string | null;
      option: { isCorrect: boolean } | null;
    }>,
  ): number {
    if (!answers || answers.length === 0) return 0;

    const validAnswers = answers.filter(
      (answer) => answer.option && answer.optionId,
    );
    if (validAnswers.length === 0) return 0;

    const correctCount = validAnswers.filter(
      (answer) => answer.option!.isCorrect,
    ).length;
    const accuracy = (correctCount / validAnswers.length) * 100;

    return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
  }

  async getTestLeaderboard(
    testId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const cacheKey = `leaderboard:${testId}:p${page}:l${limit}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    // S-9 fix: Query LeaderboardEntry instead of Attempt for fast O(1) reads
    const [entries, total] = await Promise.all([
      (this.prisma.leaderboardEntry as any).findMany({
        where: { testId },
        include: {
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
      (this.prisma.leaderboardEntry as any).count({ where: { testId } }),
    ]);

    // Calculate actual ranks based on scores
    const rankedAttempts: Array<{
      rank: number;
      userId: string;
      user: { id: string; name: string | null; email: string | null };
      score: number;
      timeTaken: number | null;
      createdAt: Date;
      accuracy: number;
    }> = [];
    let currentRank = skip + 1;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (i === 0) {
        // First item in page - need to check previous page for ties
        if (skip > 0) {
          const previousEntry = await (
            this.prisma.leaderboardEntry as any
          ).findFirst({
            where: { testId },
            orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
            skip: skip - 1,
            take: 1,
          });

          if (
            previousEntry &&
            previousEntry.score === entry.score &&
            previousEntry.timeTaken === entry.timeTaken
          ) {
            // Tie logic...
          }
        }
      } else {
        const prevEntry = entries[i - 1];
        if (
          prevEntry.score !== entry.score ||
          prevEntry.timeTaken !== entry.timeTaken
        ) {
          currentRank = skip + i + 1;
        }
      }

      rankedAttempts.push({
        rank: currentRank,
        userId: entry.userId,
        user: entry.user,
        score: entry.score,
        timeTaken: entry.timeTaken,
        createdAt: entry.createdAt,
        accuracy: entry.accuracy || 0,
      });
    }

    const result = {
      entries: rankedAttempts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // S-15 fix: Cache leaderboard per page with TTL: 120s
    await this.cacheService.set(cacheKey, result, 120);

    return result;
  }

  // M-7 fix: Use LeaderboardEntry for fast O(1) rank queries
  async getUserRank(testId: string, userId: string) {
    // Find the user's leaderboard entry
    const entry = await (this.prisma.leaderboardEntry as any).findUnique({
      where: {
        testId_userId: { testId, userId },
      },
    });

    if (!entry) {
      return null; // User hasn't attempted this test
    }

    // Count how many entries scored strictly higher
    const higherCount = await (this.prisma.leaderboardEntry as any).count({
      where: {
        testId,
        OR: [
          { score: { gt: entry.score } },
          {
            AND: [
              { score: entry.score },
              {
                timeTaken: entry.timeTaken
                  ? { lt: entry.timeTaken }
                  : undefined,
              },
            ],
          },
        ],
      },
    });

    const totalParticipants = await (this.prisma.leaderboardEntry as any).count(
      {
        where: { testId },
      },
    );

    const rank = higherCount + 1;

    return {
      rank,
      score: entry.score,
      timeTaken: entry.timeTaken,
      totalParticipants,
      percentile: Math.round(
        ((totalParticipants - rank + 1) / totalParticipants) * 100,
      ),
      accuracy: entry.accuracy || 0,
    };
  }
}
