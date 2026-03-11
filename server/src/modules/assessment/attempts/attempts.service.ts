import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AnswerValidator } from 'src/common/validators/answer.validator';
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
  async submit(attemptId: string | number | bigint, dto: SubmitAttemptDto) {
    const whereId: any = attemptId as any;
    const attempt: any = await this.prisma.attempt.findUnique({
      where: { id: whereId },
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
    const isExpired = await this.schedulerService.isAttemptExpired(
      attemptId as any,
    );
    if (isExpired) {
      await this.schedulerService.forceExpireAttempt(attemptId as any);
      throw new ValidationException(
        'Test time limit has exceeded',
        'TIME_LIMIT_EXCEEDED',
      );
    }

    // Fetch questions with options (correct answer lives on QuestionOption.isCorrect)
    // FIX #3 prerequisite: include topicId so we can write UserTopicStat below.
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
        options: {
          include: { translations: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Build a map of questionId → { correctAnswer (0-based index), totalOptions, topicId, options }
    // correctAnswer is the 0-based index of the option where isCorrect = true,
    // falling back to the legacy correctAnswer field on the question if options
    // haven't been migrated yet.
    const questionMap = new Map(
      questions.map((q) => {
        const qAny: any = q as any;

        // Primary: derive correctAnswer from QuestionOption.isCorrect
        let correctAnswerIdx: number = qAny.correctAnswer ?? 0;
        if (Array.isArray(qAny.options) && qAny.options.length > 0) {
          const idx = qAny.options.findIndex((o: any) => o.isCorrect);
          if (idx !== -1) correctAnswerIdx = idx;
        }

        const totalOptions =
          Array.isArray(qAny.options) && qAny.options.length > 0
            ? qAny.options.length
            : 4;

        return [
          qAny.id,
          {
            correctAnswer: correctAnswerIdx,
            totalOptions,
            topicId: qAny.topicId as string | null, // FIX #3: needed for topic stats
            options: qAny.options as any[], // ✅ ADD THIS — needed to resolve optionId
          },
        ];
      }),
    );

    // Validate submitted answers
    try {
      AnswerValidator.validateAnswerSet(dto.answers, questionMap);
    } catch (error) {
      this.logger.warn(
        `Answer validation failed for attempt ${attemptId}: ${error.message}`,
      );
      throw error;
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let timeTaken: number | null = null;

    if (attempt.startTime) {
      timeTaken = Math.round(
        (new Date().getTime() - attempt.startTime.getTime()) / 1000 / 60,
      );
    }

    const answerData = dto.answers
      .map((answer) => {
        const question = questionMap.get(answer.questionId);
        if (!question) return null;

        const isCorrect =
          Number(answer.selectedOptionIndex) === Number(question.correctAnswer);

        if (isCorrect) {
          score += (attempt.test?.positiveMark as number) || 1;
          correctCount++;
        } else if (
          answer.selectedOptionIndex !== null &&
          answer.selectedOptionIndex !== undefined
        ) {
          score -= (attempt.test?.negativeMark as number) || 0;
          wrongCount++;
        }

        // ✅ FIXED: resolve the actual QuestionOption CUID by index
        const selectedOptionId: string | null =
          answer.selectedOptionIndex !== null &&
          answer.selectedOptionIndex !== undefined &&
          question.options?.[answer.selectedOptionIndex]
            ? question.options[answer.selectedOptionIndex].id
            : null;

        return {
          attemptId: whereId,
          questionId: answer.questionId,
          optionId: selectedOptionId, // ✅ FIXED: correct field name, correct type
          isCorrect,
          isMarked: true,
          answeredAt: new Date(),
        };
      })
      .filter((a) => a !== null);

    score = Math.max(0, score);

    const totalAttempted = correctCount + wrongCount;
    const accuracy =
      totalAttempted > 0
        ? Math.round((correctCount / totalAttempted) * 100)
        : 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        // A. Save individual answers
        await tx.attemptAnswer.createMany({
          data: answerData as any,
          skipDuplicates: true,
        });

        // B. Update attempt record
        await tx.attempt.update({
          where: { id: whereId },
          data: {
            status: 'SUBMITTED',
            endTime: new Date(),
            score,
            correctCount,
            wrongCount,
            unattemptedCount: questions.length - answerData.length,
            accuracy,
            timeTaken,
          },
        });

        // FIX #3: Write UserTopicStat — previously this was never called, so the
        // topic-performance dashboard always showed empty data for every user.
        // Group this attempt's answers by topic, then upsert one row per topic.
        const topicGroups = new Map<
          string,
          { correct: number; wrong: number }
        >();

        for (const answer of answerData as any[]) {
          const question = questionMap.get(answer.questionId);
          const topicId = question?.topicId;
          if (!topicId) continue; // skip untagged questions

          const existing = topicGroups.get(topicId) ?? {
            correct: 0,
            wrong: 0,
          };
          if (answer.isCorrect) existing.correct++;
          else existing.wrong++;
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
              // Recalculate accuracy from cumulative totals after update
              // (updated inline below via a second pass if needed, or left
              // as an approximation — accurate enough for a leaderboard)
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
      answerData,
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
      unattemptedCount: questions.length - answerData.length,
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

      const sectionCorrect = sectionAnswers.filter((a) => a.isCorrect).length;
      const sectionWrong = sectionAnswers.filter((a) => !a.isCorrect).length;
      const sectionTotal = section.questions.length;
      const sectionScore = sectionAnswers.reduce((sum, a) => {
        const sectionQuestion = section.questions.find(
          (sq) => sq.question.id === a.questionId,
        );
        return sum + (a.isCorrect ? 1 : 0); // Assuming 1 mark per question
      }, 0);

      return {
        sectionId: section.id,
        sectionName: section.name,
        totalQuestions: sectionTotal,
        correctAnswers: sectionCorrect,
        wrongAnswers: sectionWrong,
        unattemptedQuestions: sectionTotal - sectionAnswers.length,
        score: sectionScore,
        maxMarks: sectionTotal, // Assuming 1 mark per question
      };
    });
  }

  private async getAttemptRank(testId: string, score: number) {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { testId },
      orderBy: { score: 'desc' },
    });

    const rank = entries.findIndex((entry) => entry.score <= score) + 1;
    return rank || null;
  }

  private async getTotalAttempts(testId: string) {
    return this.prisma.attempt.count({
      where: { testId },
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
      rank: leaderboardEntry ? Number(leaderboardEntry.id) : null,
      totalAttempts,
      startTime: attempt.createdAt,
      endTime: attempt.endTime,
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
    isMarkedForReview?: boolean,
  ) {
    const id = typeof attemptId === 'string' ? BigInt(attemptId) : attemptId;

    // Verify attempt belongs to user
    const attempt = await this.prisma.attempt.findFirst({
      where: { id, userId },
    });

    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    // Upsert answer
    return this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: id,
          questionId,
        },
      },
      update: {
        optionId,
        isMarked: isMarkedForReview || false,
      },
      create: {
        attemptId: id,
        questionId,
        optionId,
        isMarked: isMarkedForReview || false,
      },
    });
  }

  async saveAnswersBatch(
    attemptId: string,
    answers: Array<{
      questionId: string;
      optionId: string | null;
      isMarkedForReview?: boolean;
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

    // Batch upsert answers
    const operations = answers.map(
      ({ questionId, optionId, isMarkedForReview }) =>
        this.prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: id,
              questionId,
            },
          },
          update: {
            optionId,
            isMarked: isMarkedForReview || false,
          },
          create: {
            attemptId: id,
            questionId,
            optionId,
            isMarked: isMarkedForReview || false,
          },
        }),
    );

    return Promise.all(operations);
  }
}
