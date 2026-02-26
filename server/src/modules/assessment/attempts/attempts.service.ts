import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  // 1. Start a Test
  async start(dto: CreateAttemptDto) {
    const test = await this.prisma.test.findUnique({
      where: { id: dto.testId },
    });
    if (!test) throw new NotFoundException('Test not found');

    // Check if user exists (Optional safety check)
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new BadRequestException('Invalid User ID');

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

  // 2. Submit & Save Answers (THE FIX ✅)
  async submit(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'SUBMITTED')
      throw new BadRequestException('Test already submitted!');

    // Fetch questions to check correctness
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
      select: { id: true, correctAnswer: true },
    });

    // Create a Map for fast lookup
    const questionMap = new Map(questions.map((q) => [q.id, q.correctAnswer]));

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    // Prepare Answer Data
    const answerData = dto.answers
      .map((answer) => {
        const correctOption = questionMap.get(answer.questionId);

        // Safety: If question doesn't exist in map, skip it
        if (correctOption === undefined) return null;

        const isCorrect =
          Number(answer.selectedOptionIndex) === Number(correctOption);

        if (isCorrect) {
          score += attempt.test.positiveMark || 1;
          correctCount++;
        } else {
          score -= attempt.test.negativeMark || 0;
          wrongCount++;
        }

        return {
          attemptId: attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOptionIndex,
          isCorrect: isCorrect,
          isMarked: true,
        };
      })
      .filter((a) => a !== null); // Filter out nulls

    // TRANSACTION: Save everything at once
    await this.prisma.$transaction([
      // A. Save individual answers
      this.prisma.attemptAnswer.createMany({
        data: answerData,
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
        },
      }),
    ]);

    return { status: 'SUBMITTED', score, correctCount, wrongCount };
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
      include: { test: true },
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
