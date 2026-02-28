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
      const attemptCount = await this.prisma.attempt.count({
        where: {
          userId: dto.userId,
          testId: dto.testId,
        },
      });
      if (attemptCount >= test.maxAttempts) {
        throw new ValidationException(
          `Maximum attempts (${test.maxAttempts}) reached for this test`,
          'MAX_ATTEMPTS_EXCEEDED',
        );
      }
    }

    // Get the next attempt number for this user-test combination
    const lastAttempt = await this.prisma.attempt.findFirst({
      where: {
        userId: dto.userId,
        testId: dto.testId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    const nextAttemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    return this.prisma.attempt.create({
      data: {
        testId: dto.testId,
        userId: dto.userId,
        status: 'STARTED',
        startTime: new Date(),
        attemptNumber: nextAttemptNumber,
      },
    });
  }

  // 2. Submit & Save Answers with validation
  async submit(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!attempt) {
      throw new ResourceNotFoundException('Attempt', attemptId);
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
    const isExpired = await this.schedulerService.isAttemptExpired(attemptId);
    if (isExpired) {
      await this.schedulerService.forceExpireAttempt(attemptId);
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
        translations: {
          where: { lang: 'en' },
        },
      },
    });

    // Build question map with validation info
    const questionMap = new Map(
      questions.map((q) => [
        q.id,
        {
          correctAnswer: q.correctAnswer,
          totalOptions: (q.translations[0]?.options as any)?.length || 4,
        },
      ]),
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
          score += attempt.test.positiveMark || 1;
          correctCount++;
        } else if (
          answer.selectedOptionIndex !== null &&
          answer.selectedOptionIndex !== undefined
        ) {
          score -= attempt.test.negativeMark || 0;
          wrongCount++;
        }

        return {
          attemptId: attemptId,
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
          data: answerData,
          skipDuplicates: true, // Prevent duplicate insertion
        }),

        // B. Update Attempt Status & Score
        this.prisma.attempt.update({
          where: { id: attemptId },
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
  async getReview(attemptId: string) {
    // Fetch Attempt + User's Answers
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
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
        translations: {
          where: { lang: 'en' }, // Default to English
          select: { content: true, options: true, explanation: true },
        },
      },
    });

    // Combine Data for Frontend
    const detailedAnalysis = questions.map((q) => {
      const userAnswer = attempt.answers.find((a) => a.questionId === q.id);
      const translation = q.translations[0]; // Get first translation

      return {
        questionId: q.id,
        questionText: translation?.content || 'Content missing',
        options: translation?.options || [],
        explanation: translation?.explanation || 'No explanation provided', // 👈 Solution
        correctOptionIndex: q.correctAnswer,
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
  findOne(id: string) {
    return this.prisma.attempt.findUnique({
      where: { id },
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

  update(id: string, dto: any) {
    return this.prisma.attempt.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.attempt.delete({ where: { id } });
  }
}
