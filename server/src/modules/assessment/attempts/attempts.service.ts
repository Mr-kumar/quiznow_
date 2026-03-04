import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AnswerValidator } from 'src/common/validators/answer.validator';
import { SchedulerService } from 'src/common/services/scheduler.service';
import {
  ResourceNotFoundException,
  ValidationException,
} from 'src/common/exceptions/app.exception';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private prisma: PrismaService,
    private schedulerService: SchedulerService,
  ) {}

  // 1. Start a Test
  async start(dto: CreateAttemptDto) {
    const test = await this.prisma.test.findUnique({
      where: { id: dto.testId },
    });
    if (!test) {
      throw new ResourceNotFoundException('Test', dto.testId);
    }

    // Check if user exists
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

    // Check max attempts
    if (test.maxAttempts) {
      const previous = await this.prisma.attempt.count({
        where: { testId: dto.testId, userId: dto.userId },
      });
      if (previous >= test.maxAttempts) {
        throw new ValidationException(
          `Maximum attempts reached (${test.maxAttempts})`,
          'MAX_ATTEMPTS_REACHED',
        );
      }
    }

    const nextAttemptNumber =
      (await this.prisma.attempt.count({
        where: { testId: dto.testId, userId: dto.userId },
      })) + 1;

    return this.prisma.attempt.create({
      data: {
        userId: dto.userId,
        testId: dto.testId,
        attemptNumber: nextAttemptNumber,
        status: 'STARTED',
        startTime: new Date(),
      },
    });
  }

  // 2. Submit & Save Answers with validation
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

    // Check if attempt is expired based on duration
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

    // Fetch questions with translations to get total options
    const questions = await this.prisma.question.findMany({
      where: {
        sectionLinks: {
          some: {
            section: {
              testId: attempt.testId,
            },
          },
        },
      },
      include: {
        translations: true,
      },
    });

    // Build question map with validation info
    const questionMap = new Map(
      questions.map((q) => {
        const qAny: any = q as any;
        const optionsLength = Array.isArray(qAny?.translations?.[0]?.options)
          ? qAny.translations[0].options.length
          : 4;
        return [
          qAny.id,
          {
            correctAnswer: qAny.correctAnswer,
            totalOptions: optionsLength,
          },
        ];
      }),
    );

    // Validate answers before processing
    try {
      AnswerValidator.validateAnswerSet(dto.answers, questionMap);
    } catch (error) {
      this.logger.warn(
        `Answer validation failed for attempt ${attemptId}`,
        error.message,
      );
      throw error;
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let timeTaken: number | null = null;

    // Calculate time taken
    if (attempt.startTime) {
      timeTaken = Math.round(
        (new Date().getTime() - attempt.startTime.getTime()) / 1000 / 60,
      ); // in minutes
    }

    // Prepare Answer Data with validated bounds
    const answerData = dto.answers
      .map((answer) => {
        const question = questionMap.get(answer.questionId);

        // Skip if question doesn't exist in this test
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

        return {
          attemptId: whereId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOptionIndex,
          isCorrect: isCorrect,
          isMarked: true,
          answeredAt: new Date(),
        };
      })
      .filter((a) => a !== null); // Filter out nulls

    // Ensure score is never negative
    score = Math.max(0, score);

    // Calculate accuracy
    const totalAttempted = correctCount + wrongCount;
    const accuracy =
      totalAttempted > 0
        ? Math.round((correctCount / totalAttempted) * 100)
        : 0;

    // TRANSACTION: Save everything at once
    try {
      await this.prisma.$transaction([
        // A. Save individual answers
        this.prisma.attemptAnswer.createMany({
          data: answerData as any,
          skipDuplicates: true, // Prevent duplicate insertion
        }),

        // B. Update Attempt Status & Score
        this.prisma.attempt.update({
          where: { id: whereId },
          data: {
            status: 'SUBMITTED',
            endTime: new Date(),
            score: score,
            correctCount: correctCount,
            wrongCount: wrongCount,
            unattemptedCount: questions.length - answerData.length,
            accuracy: accuracy,
            timeTaken: timeTaken,
          },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Failed to submit attempt ${attemptId}`, error);
      throw new ValidationException(
        'Failed to submit test. Please try again.',
        'SUBMISSION_FAILED',
      );
    }

    this.logger.log(
      `Attempt ${attemptId} submitted: Score=${score}, Correct=${correctCount}, Wrong=${wrongCount}`,
    );

    return {
      status: 'SUBMITTED',
      score,
      correctCount,
      wrongCount,
      accuracy,
      timeTaken,
    };
  }

  // 3. Get Review / Solutions (THE NEW FEATURE 🚀)
  async getReview(attemptId: string | number | bigint) {
    const whereId: any = attemptId as any;
    // Fetch Attempt + User's Answers
    const attempt: any = await this.prisma.attempt.findUnique({
      where: { id: whereId },
      include: {
        test: true,
        answers: true, // Fetch the rows we just saved
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'SUBMITTED')
      throw new BadRequestException('Test is still in progress');

    // Fetch Questions + Translations (for Explanation)
    const questions = await this.prisma.question.findMany({
      where: {
        sectionLinks: {
          some: {
            section: {
              testId: attempt.testId,
            },
          },
        },
      },
      include: {
        translations: true,
      },
    });

    // Combine Data for Frontend
    const detailedAnalysis = questions.map((q) => {
      const qAny: any = q as any;
      const userAnswer = attempt.answers.find((a) => a.questionId === qAny.id);
      const translation: any = qAny.translations?.[0];

      return {
        questionId: qAny.id,
        questionText: translation?.content || 'Content missing',
        options: translation?.options || [],
        explanation: translation?.explanation || 'No explanation provided', // 👈 Solution
        correctOptionIndex: qAny.correctAnswer,
        userSelectedOption: userAnswer?.selectedOption ?? null,
        status: userAnswer
          ? userAnswer.isCorrect
            ? 'CORRECT'
            : 'WRONG'
          : 'SKIPPED',
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

  // 4. Get Result (Basic)
  findOne(id: string | number | bigint) {
    return this.prisma.attempt.findUnique({
      where: { id: id as any },
      include: {
        test: true,
        user: true,
      },
    });
  }

  // Additional CRUD methods
  findAll() {
    return this.prisma.attempt.findMany({
      include: { test: true, user: true },
    });
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
}
