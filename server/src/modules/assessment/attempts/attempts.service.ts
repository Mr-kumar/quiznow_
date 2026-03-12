import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SchedulerService } from 'src/common/services/scheduler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from 'src/common/exceptions/app.exception';

interface StartAttemptRequest {
  testId: string;
  userId: string;
}

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private prisma: PrismaService,
    private schedulerService: SchedulerService,
  ) {}

  // ─── 1. Start a Test ──────────────────────────────────────────────────────
  async start(dto: StartAttemptRequest) {
    const test = await this.prisma.test.findUnique({
      where: { id: dto.testId },
    });
    if (!test) {
      throw new ResourceNotFoundException('Test', dto.testId);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new ResourceNotFoundException('User', dto.userId);
    }

    // Check test schedule
    const now = new Date();
    if (test.startAt && now < test.startAt) {
      throw new ValidationException(
        `Test is not yet available. It will start at ${test.startAt.toISOString()}`,
        'TEST_NOT_AVAILABLE',
      );
    }
    if (test.endAt && now > test.endAt) {
      throw new ValidationException('Test has ended', 'TEST_ENDED');
    }

    // FIX #1: Single count() — reuse the result for both the max-attempts
    // check AND the attemptNumber calculation. Previously there were two
    // identical prisma.attempt.count() calls with the same where clause.
    const previousCount = await this.prisma.attempt.count({
      where: { testId: dto.testId, userId: dto.userId },
    });

    if (test.maxAttempts && previousCount >= test.maxAttempts) {
      throw new ValidationException(
        `Maximum attempts reached (${test.maxAttempts})`,
        'MAX_ATTEMPTS_REACHED',
      );
    }

    return this.prisma.attempt.create({
      data: {
        userId: dto.userId,
        testId: dto.testId,
        attemptNumber: previousCount + 1,
        status: 'STARTED',
        startTime: new Date(),
      },
    });
  }

  // ─── 2. Submit & Score ────────────────────────────────────────────────────
  // Client saves answers individually via PATCH /attempts/:id/answers during the exam.
  // On submit, we read the already-saved AttemptAnswer records and score them.
  async submit(attemptId: string | number | bigint) {
    const whereId =
      typeof attemptId === 'string' ? BigInt(attemptId) : attemptId;
    const attempt: any = await this.prisma.attempt.findUnique({
      where: { id: whereId as any },
      include: { test: true },
    });

    if (!attempt) {
      throw new ResourceNotFoundException('Attempt', String(attemptId));
    }

    if (attempt.status === 'SUBMITTED') {
      throw new ValidationException(
        'Test already submitted!',
        'TEST_ALREADY_SUBMITTED',
      );
    }

    if (attempt.status === 'EXPIRED') {
      throw new ValidationException(
        'Test time limit has expired',
        'TEST_EXPIRED',
      );
    }

    // Check expiry via scheduler
    const isExpired = await this.schedulerService.isAttemptExpired(whereId);
    if (isExpired) {
      await this.schedulerService.forceExpireAttempt(whereId);
      throw new ValidationException(
        'Test time limit has exceeded',
        'TIME_LIMIT_EXCEEDED',
      );
    }

    // ── Read already-saved answers from AttemptAnswer table ──────────────
    const savedAnswers = await this.prisma.attemptAnswer.findMany({
      where: { attemptId: whereId as any },
      include: {
        option: true, // includes QuestionOption with isCorrect
        question: true, // includes topicId
      },
    });

    // Fetch all questions linked to this test (for total count + topic stats)
    const questions = await this.prisma.question.findMany({
      where: {
        sectionLinks: {
          some: {
            section: { testId: attempt.testId },
          },
        },
      },
      select: { id: true, topicId: true },
    });

    const totalQuestions = questions.length;

    // ── Score each saved answer ─────────────────────────────────────────
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const scoredAnswers: Array<{
      questionId: string;
      isCorrect: boolean;
      marksAwarded: number;
    }> = [];

    for (const ans of savedAnswers) {
      if (!ans.optionId) {
        // Unanswered (cleared) — no marks
        scoredAnswers.push({
          questionId: ans.questionId,
          isCorrect: false,
          marksAwarded: 0,
        });
        continue;
      }

      const isCorrect = ans.option?.isCorrect ?? false;
      let marksAwarded = 0;

      if (isCorrect) {
        marksAwarded = attempt.test?.positiveMark ?? 1;
        score += marksAwarded;
        correctCount++;
      } else {
        marksAwarded = -(attempt.test?.negativeMark ?? 0);
        score += marksAwarded; // subtracts
        wrongCount++;
      }

      scoredAnswers.push({
        questionId: ans.questionId,
        isCorrect,
        marksAwarded,
      });
    }

    score = Math.max(0, score);

    const answeredCount = savedAnswers.filter((a) => a.optionId !== null).length;
    const unattemptedCount = totalQuestions - answeredCount;

    const totalAttempted = correctCount + wrongCount;
    const accuracy =
      totalAttempted > 0
        ? Math.round((correctCount / totalAttempted) * 100)
        : 0;

    // Time taken in seconds (consistent with findOne)
    let timeTaken: number | null = null;
    if (attempt.startTime) {
      timeTaken = Math.round(
        (new Date().getTime() - attempt.startTime.getTime()) / 1000,
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // A. Update each AttemptAnswer with scoring results
        for (const scored of scoredAnswers) {
          await tx.attemptAnswer.update({
            where: {
              attemptId_questionId: {
                attemptId: whereId as any,
                questionId: scored.questionId,
              },
            },
            data: {
              isCorrect: scored.isCorrect,
              marksAwarded: scored.marksAwarded,
            },
          });
        }

        // B. Update attempt record
        await tx.attempt.update({
          where: { id: whereId as any },
          data: {
            status: 'SUBMITTED',
            endTime: new Date(),
            score,
            correctCount,
            wrongCount,
            unattemptedCount,
            accuracy,
            timeTaken,
          },
        });

        // C. Write UserTopicStat per topic
        const topicGroups = new Map<
          string,
          { correct: number; wrong: number }
        >();

        for (const scored of scoredAnswers) {
          const q = questions.find((q) => q.id === scored.questionId);
          const topicId = q?.topicId;
          if (!topicId) continue;

          const existing = topicGroups.get(topicId) ?? {
            correct: 0,
            wrong: 0,
          };
          if (scored.isCorrect) existing.correct++;
          else if (scored.marksAwarded < 0) existing.wrong++;
          topicGroups.set(topicId, existing);
        }

        for (const [topicId, { correct, wrong }] of topicGroups) {
          const total = correct + wrong;
          const topicAccuracy =
            total > 0 ? Math.round((correct / total) * 100) : 0;

          await tx.userTopicStat.upsert({
            where: {
              userId_topicId: {
                userId: attempt.userId,
                topicId,
              },
            },
            create: {
              userId: attempt.userId,
              topicId,
              attempts: 1,
              correct,
              wrong,
              accuracy: topicAccuracy,
            },
            update: {
              attempts: { increment: 1 },
              correct: { increment: correct },
              wrong: { increment: wrong },
            },
          });
        }
      });
    } catch (error) {
      this.logger.error(`Failed to submit attempt ${attemptId}`, error);
      throw new ValidationException(
        'Failed to submit test. Please try again.',
        'SUBMISSION_FAILED',
      );
    }

    this.logger.log(
      `Attempt ${attemptId} submitted — Score=${score}, Correct=${correctCount}, Wrong=${wrongCount}`,
    );

    // Calculate section results
    const sectionResults = await this.calculateSectionResults(
      attempt.testId,
      scoredAnswers,
    );

    // Get rank from leaderboard
    const rank = await this.getAttemptRank(attempt.testId, score);
    const totalAttempts = await this.getTotalAttempts(attempt.testId);

    return {
      attemptId: String(attemptId),
      testId: attempt.testId,
      testTitle: attempt.test.title,
      status: 'SUBMITTED',
      score,
      totalMarks: attempt.test.totalMarks,
      passMarks: attempt.test.passMarks,
      passed: score >= (attempt.test.passMarks || 0),
      correctCount,
      wrongCount,
      unattemptedCount,
      accuracy,
      timeTaken,
      sectionResults,
      rank,
      totalAttempts,
      startTime: attempt.createdAt,
      endTime: new Date(),
    };
  }

  // Helper methods for AttemptResult calculation
  // Field names match client's SectionResult type: attempted, correct, wrong, score, totalMarks
  private async calculateSectionResults(testId: string, answerData: any[]) {
    const sections = await this.prisma.section.findMany({
      where: { testId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    return sections.map((section) => {
      const sectionAnswers = answerData.filter((a) =>
        section.questions.some((sq) => sq.question.id === a.questionId),
      );

      const correct = sectionAnswers.filter((a) => a.isCorrect).length;
      const wrong = sectionAnswers.filter(
        (a) => !a.isCorrect && a.marksAwarded < 0,
      ).length;
      const totalQuestions = section.questions.length;
      const sectionScore = sectionAnswers.reduce(
        (sum, a) => sum + (a.marksAwarded ?? 0),
        0,
      );

      return {
        sectionId: section.id,
        sectionName: section.name,
        totalQuestions,
        attempted: sectionAnswers.filter((a) => a.marksAwarded !== 0).length,
        correct,
        wrong,
        score: Math.max(0, sectionScore),
        totalMarks: totalQuestions, // per-section max
      };
    });
  }

  private async getAttemptRank(testId: string, score: number) {
    // Count how many entries scored strictly higher → rank = that count + 1
    const higherCount = await this.prisma.leaderboardEntry.count({
      where: { testId, score: { gt: score } },
    });
    return higherCount + 1;
  }

  private async getTotalAttempts(testId: string) {
    return this.prisma.attempt.count({
      where: { testId, status: 'SUBMITTED' },
    });
  }

  // ─── 3. Get Review / Solutions ────────────────────────────────────────────
  async getReview(attemptId: string | number | bigint) {
    const whereId: any = attemptId as any;

    const attempt: any = await this.prisma.attempt.findUnique({
      where: { id: whereId },
      include: {
        test: true,
        answers: true,
      },
    });

    // FIX: use consistent custom exceptions instead of NestJS built-ins
    if (!attempt) {
      throw new ResourceNotFoundException('Attempt', String(attemptId));
    }
    if (attempt.status !== 'SUBMITTED') {
      throw new ValidationException(
        'Test is still in progress',
        'ATTEMPT_NOT_SUBMITTED',
      );
    }

    // Fetch questions with their QuestionOption rows and topic/subject info
    const questions = await this.prisma.question.findMany({
      where: {
        sectionLinks: {
          some: {
            section: { testId: attempt.testId },
          },
        },
      },
      include: {
        translations: true,
        topic: {
          include: {
            subject: true,
          },
        },
        sectionLinks: {
          include: {
            section: true,
          },
        },
        options: {
          orderBy: { order: 'asc' },
          include: {
            translations: true,
          },
        },
      },
    });

    const detailedAnalysis = questions.map((q) => {
      const qAny: any = q as any;
      const userAnswer = attempt.answers.find(
        (a: any) => a.questionId === qAny.id,
      );
      const translation: any = qAny.translations?.[0];

      // Derive correct option index from QuestionOption.isCorrect
      const correctOptionIndex = (qAny.options ?? []).findIndex(
        (o: any) => o.isCorrect,
      );

      // Build option list using OptionTranslation text (EN fallback)
      const reviewOptions = (qAny.options ?? []).map((opt: any) => {
        const tr =
          opt.translations?.find((t: any) => t.lang === 'EN') ??
          opt.translations?.[0];
        return {
          optionId: opt.id,
          text: tr?.text ?? '',
          isCorrect: opt.isCorrect,
          order: opt.order,
        };
      });

      // Get section info from sectionLinks
      const sectionLink = qAny.sectionLinks?.[0];
      const sectionName = sectionLink?.section?.name || '';

      return {
        questionId: qAny.id,
        sectionId: sectionLink?.sectionId || '',
        sectionName: sectionName, // Now properly fetched
        order: sectionLink?.order || 0,
        selectedOptionId: userAnswer?.optionId || null,
        isCorrect: userAnswer?.isCorrect || false,
        isMarked: userAnswer?.isMarked || false,
        marksAwarded: userAnswer?.marksAwarded || 0,
        content: translation?.content ?? 'Content missing',
        imageUrl: translation?.imageUrl || null,
        explanation: translation?.explanation ?? 'No explanation provided',
        options: reviewOptions,
        topicId: qAny.topicId,
        topicName: qAny.topic?.name || null,
        subjectName: qAny.topic?.subject?.name || null,
      };
    });

    return {
      summary: {
        score: attempt.score,
        totalMarks: attempt.test.totalMarks,
        correct: attempt.correctCount,
        wrong: attempt.wrongCount,
        accuracy:
          attempt.correctCount > 0
            ? Math.round(
                (attempt.correctCount /
                  (attempt.correctCount + attempt.wrongCount)) *
                  100,
              )
            : 0,
      },
      questions: detailedAnalysis,
    };
  }

  // ─── 4. Basic result / CRUD ───────────────────────────────────────────────

  async findOne(id: string | number | bigint) {
    // Convert string id to BigInt
    if (!id || id === 'null' || id === 'undefined') {
      throw new Error('Invalid attempt ID');
    }

    const attemptId = typeof id === 'string' ? BigInt(id) : id;

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
        user: true,
        answers: {
          include: {
            question: {
              include: {
                sectionLinks: true,
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            option: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    // Calculate total questions in test
    const totalQuestions = attempt.test.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    );

    // Calculate section results
    const sectionResults = attempt.test.sections.map((section) => {
      const sectionAnswers = attempt.answers.filter(
        (a) =>
          a.question.sectionLinks &&
          a.question.sectionLinks.some((sl) => sl.sectionId === section.id),
      );

      return {
        sectionId: section.id,
        sectionName: section.name, // Changed from sectionTitle
        totalQuestions: section.questions.length,
        attempted: sectionAnswers.length, // Changed from attemptedQuestions
        correct: sectionAnswers.filter((a) => a.isCorrect).length, // Changed from correctAnswers
        wrong: sectionAnswers.filter((a) => !a.isCorrect && a.optionId).length, // Changed from wrongAnswers
        score: sectionAnswers.reduce(
          (sum, a) => sum + (a.marksAwarded || 0),
          0,
        ),
        totalMarks: section.questions.reduce((sum, q) => sum + 1, 0), // Assuming 1 mark per question
      };
    });

    // Get leaderboard rank
    const leaderboardEntry = await this.prisma.leaderboardEntry.findFirst({
      where: {
        testId: attempt.testId,
        userId: attempt.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count total attempts for this test
    const totalAttempts = await this.prisma.attempt.count({
      where: {
        testId: attempt.testId,
        status: 'SUBMITTED',
      },
    });

    // Calculate time taken in seconds
    const timeTaken = attempt.endTime
      ? Math.floor(
          (attempt.endTime.getTime() - attempt.startTime.getTime()) / 1000,
        )
      : 0;

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const wrongCount = attempt.answers.filter(
      (a) => !a.isCorrect && a.optionId,
    ).length;
    const unattemptedCount = totalQuestions - attempt.answers.length;

    return {
      attemptId: String(attempt.id),
      testId: attempt.testId,
      testTitle: attempt.test.title,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber || 1,
      score: attempt.score || 0,
      totalMarks: attempt.test.totalMarks,
      passMarks: attempt.test.passMarks,
      passed: (attempt.score || 0) >= (attempt.test.passMarks || 0),
      correctCount,
      wrongCount,
      unattemptedCount,
      accuracy: attempt.accuracy || 0,
      timeTaken,
      sectionResults,
      rank: await this.getAttemptRank(attempt.testId, attempt.score || 0),
      totalAttempts,
      startTime: attempt.createdAt,
      endTime: attempt.endTime,
      // Student information
      studentId: attempt.userId,
      studentName: attempt.user?.name || 'Anonymous',
      studentEmail: attempt.user?.email || null,
      // Test configuration for analysis
      testDuration: attempt.test.durationMins,
      positiveMark: attempt.test.positiveMark,
      negativeMark: attempt.test.negativeMark,
    };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.attempt.findMany({
        include: { test: true, user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attempt.count(),
    ]);
    return { data, total, page, limit };
  }

  update(id: string | number | bigint, dto: any) {
    return this.prisma.attempt.update({
      where: { id: id as any },
      data: dto,
    });
  }

  remove(id: string | number | bigint) {
    return this.prisma.attempt.delete({ where: { id: id as any } });
  }

  // ─── 5. Anti-cheating ───────────────────────────────────────────────────────

  async incrementSuspicious(attemptId: string | number | bigint) {
    const id = typeof attemptId === 'string' ? BigInt(attemptId) : attemptId;

    return this.prisma.attempt.update({
      where: { id },
      data: {
        suspiciousScore: {
          increment: 1,
        },
      },
    });
  }

  // ─── 6. Answer Management ─────────────────────────────────────────────────────

  async saveAnswer(
    attemptId: string,
    questionId: string,
    optionId: string | null,
    userId: string,
    isMarked?: boolean,
  ) {
    const id = typeof attemptId === 'string' ? BigInt(attemptId) : attemptId;

    // Verify attempt belongs to user
    const attempt = await this.prisma.attempt.findFirst({
      where: { id, userId },
    });

    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    this.logger.debug(
      `Saving answer: attemptId=${attemptId}, questionId=${questionId}, optionId=${optionId}, isMarked=${isMarked}`,
    );

    // Upsert answer - Prisma handles null optionId correctly (sets to NULL in database)
    const result = await this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: id,
          questionId,
        },
      },
      update: {
        optionId,
        isMarked: isMarked || false,
      },
      create: {
        attemptId: id,
        questionId,
        optionId,
        isMarked: isMarked || false,
      },
    });

    this.logger.debug(
      `Answer saved successfully: ${result.attemptId}-${result.questionId} optionId=${result.optionId}`,
    );

    return result;
  }

  async saveAnswersBatch(
    attemptId: string,
    answers: Array<{
      questionId: string;
      optionId: string | null;
      isMarked?: boolean;
    }>,
    userId: string,
  ) {
    const id = typeof attemptId === 'string' ? BigInt(attemptId) : attemptId;

    // Verify attempt belongs to user
    const attempt = await this.prisma.attempt.findFirst({
      where: { id, userId },
    });

    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    // ✅ ENHANCED: Log batch operation details
    this.logger.debug(
      `Saving batch answers: attemptId=${attemptId}, count=${answers.length}`,
    );

    // Log null answers for debugging
    const nullAnswers = answers.filter((a) => a.optionId === null);
    if (nullAnswers.length > 0) {
      this.logger.debug(
        `Clearing ${nullAnswers.length} answers: ${nullAnswers.map((a) => a.questionId).join(', ')}`,
      );
    }

    const operations = answers.map(({ questionId, optionId, isMarked }) =>
      this.prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: id,
            questionId,
          },
        },
        update: {
          optionId,
          isMarked: isMarked || false,
        },
        create: {
          attemptId: id,
          questionId,
          optionId,
          isMarked: isMarked || false,
        },
        }),
    );

    const results = await Promise.all(operations);
    this.logger.debug(
      `Batch save completed: ${results.length} answers processed`,
    );

    return results;
  }

  // ─── ADMIN: Find All Attempts for a Specific Test ──────────────────────
  async findAllByTest(testId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { testId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attempt.count({ where: { testId } }),
    ]);

    // Format IDs for BigInt safety
    const safeAttempts = attempts.map((v) => ({
      ...v,
      id: v.id.toString(),
    }));

    return {
      data: safeAttempts,
      total,
      page,
      limit,
    };
  }

  // ─── ADMIN: Delete an Attempt ──────────────────────
  async deleteAttempt(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: BigInt(id) },
    });

    if (!attempt) {
      throw new ResourceNotFoundException('Attempt', id);
    }

    try {
      await this.prisma.attempt.delete({
        where: { id: BigInt(id) },
      });
      return { success: true, message: 'Attempt deleted successfully' };
    } catch (error) {
       throw new ValidationException('Failed to delete attempt', 'DELETE_FAILED');
    }
  }
}
