import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

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
          answers: {
            select: {
              optionId: true,
              option: {
                select: {
                  isCorrect: true,
                },
              },
            },
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

    // 2. Calculate actual ranks based on scores
    const rankedAttempts: Array<{
      rank: number;
      userId: string;
      user: { id: string; name: string | null; email: string | null };
      score: number;
      timeTaken: number | null;
      createdAt: Date;
      accuracy: number;
    }> = [];
    let currentRank = skip + 1; // Starting rank for this page

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];

      if (i === 0) {
        // First item in page - need to check previous page for ties
        if (skip > 0) {
          const previousAttempt = await this.prisma.attempt.findFirst({
            where: {
              testId: testId,
              status: 'SUBMITTED',
            },
            orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
            skip: skip - 1,
            select: { score: true, timeTaken: true },
          });

          // If previous attempt has same score and time, they share the same rank
          if (
            previousAttempt &&
            previousAttempt.score === attempt.score &&
            previousAttempt.timeTaken === attempt.timeTaken
          ) {
            // Need to find the actual rank of this score
            const higherOrEqualCount = await this.prisma.attempt.count({
              where: {
                testId: testId,
                status: 'SUBMITTED',
                OR: [
                  { score: { gt: attempt.score } },
                  {
                    AND: [
                      { score: attempt.score },
                      {
                        timeTaken: attempt.timeTaken
                          ? { lt: attempt.timeTaken }
                          : undefined,
                      },
                    ],
                  },
                ],
              },
            });
            currentRank = higherOrEqualCount + 1;
          }
        }
      } else {
        // Check for ties with previous attempt in current page
        const prevAttempt = attempts[i - 1];
        if (
          prevAttempt.score !== attempt.score ||
          prevAttempt.timeTaken !== attempt.timeTaken
        ) {
          currentRank = skip + i + 1; // New score/time, update rank
        }
        // If tie, keep the same rank as previous
      }

      rankedAttempts.push({
        rank: currentRank,
        userId: attempt.userId,
        user: attempt.user,
        score: attempt.score,
        timeTaken: attempt.timeTaken,
        createdAt: attempt.createdAt,
        accuracy: this.calculateAccuracy(attempt.answers),
      });
    }

    return {
      entries: rankedAttempts,
      total,
    };
  }

  // M-7 fix: Use COUNT queries instead of loading all attempts into memory
  async getUserRank(testId: string, userId: string) {
    // Find the user's best attempt
    const userAttempt = await this.prisma.attempt.findFirst({
      where: {
        testId,
        userId,
        status: 'SUBMITTED',
      },
      orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
      select: {
        score: true,
        timeTaken: true,
        answers: {
          select: {
            optionId: true,
            option: {
              select: {
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!userAttempt) {
      return null; // User hasn't attempted this test
    }

    // Count how many attempts scored strictly higher
    const higherCount = await this.prisma.attempt.count({
      where: {
        testId,
        status: 'SUBMITTED',
        OR: [
          { score: { gt: userAttempt.score } },
          {
            AND: [
              { score: userAttempt.score },
              {
                timeTaken: userAttempt.timeTaken
                  ? { lt: userAttempt.timeTaken }
                  : undefined,
              },
            ],
          },
        ],
      },
    });

    const totalParticipants = await this.prisma.attempt.count({
      where: { testId, status: 'SUBMITTED' },
    });

    const rank = higherCount + 1;

    return {
      rank,
      score: userAttempt.score,
      timeTaken: userAttempt.timeTaken,
      totalParticipants,
      percentile: Math.round(
        ((totalParticipants - rank + 1) / totalParticipants) * 100,
      ),
      accuracy: this.calculateAccuracy(userAttempt.answers),
    };
  }
}
