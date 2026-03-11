import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTestSeryDto } from './dto/create-test-sery.dto';
import { UpdateTestSeryDto } from './dto/update-test-sery.dto';

@Injectable()
export class TestSeriesService {
  constructor(private prisma: PrismaService) {}

  // 1. Create
  async create(dto: CreateTestSeryDto) {
    // Check if Exam exists first
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    return this.prisma.testSeries.create({
      data: {
        title: dto.title,
        examId: dto.examId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // 2. Find All
  findAll(examId?: string) {
    const where = examId ? { examId } : {};

    return this.prisma.testSeries.findMany({
      where,
      include: {
        exam: { select: { name: true } }, // Show "RRB JE 2026"
        _count: { select: { tests: true } }, // Count how many tests are inside
      },
    });
  }

  // 3. Find One
  findOne(id: string) {
    return this.prisma.testSeries.findUnique({
      where: { id },
      include: { exam: true, tests: true },
    });
  }

  // 4. Update
  update(id: string, dto: UpdateTestSeryDto) {
    return this.prisma.testSeries.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete
  async remove(id: string) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!series) {
      throw new NotFoundException('Test series not found');
    }

    const testsCount = await this.prisma.test.count({
      where: { seriesId: id },
    });

    if (testsCount > 0) {
      throw new BadRequestException(
        'Cannot delete test series: It contains tests. Please delete or move the tests first.',
      );
    }

    try {
      return await this.prisma.testSeries.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete test series: It is linked to tests. Please delete or move the tests first.',
        );
      }
      throw error;
    }
  }

  // 6. Public Find All (for public exams page)
  async findPublicSeries(
    examId?: string,
    category?: string,
    q?: string,
    limit?: number,
  ) {
    const where: any = {
      isActive: true, // Only show active series
    };

    if (examId) where.examId = examId;
    if (category)
      where.exam = { name: { contains: category, mode: 'insensitive' } };
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const series = await this.prisma.testSeries.findMany({
      where,
      include: {
        exam: { select: { name: true } },
        _count: { select: { tests: { where: { isActive: true } } } },
        tests: {
          where: { isActive: true },
          select: { id: true, isPremium: true },
          take: 1, // Just need to know if there are premium/free tests
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : undefined,
    });

    // Transform to match frontend expectations
    return series.map((s) => ({
      id: s.id,
      title: s.title,
      examName: s.exam?.name || '',
      description: '', // Add description if needed in schema
      category: s.exam?.name || '',
      testCount: s._count.tests,
      freeTestCount: s.tests.filter((t) => !t.isPremium).length,
      isPremium: s.tests.some((t) => t.isPremium),
      level: 'BEGINNER' as const, // Default level - you can make this dynamic based on test count or other criteria
      createdAt: s.createdAt,
    }));
  }

  // 7. Public Find One (for public series page)
  async findPublicOne(id: string) {
    const series = await this.prisma.testSeries.findUnique({
      where: { id, isActive: true },
      include: {
        exam: { select: { name: true } },
        tests: {
          where: { isActive: true },
          include: {
            _count: { select: { sections: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!series) {
      throw new NotFoundException('Test series not found');
    }

    return {
      id: series.id,
      title: series.title,
      examName: series.exam?.name || '',
      description: '', // Add description if needed in schema
      testCount: series.tests.length,
      freeTestCount: series.tests.filter((t) => !t.isPremium).length,
      tests: series.tests.map((test) => ({
        id: test.id,
        title: test.title,
        durationMins: test.durationMins,
        totalMarks: test.totalMarks,
        isPremium: test.isPremium,
        questionCount: test._count.sections,
        createdAt: test.createdAt,
      })),
    };
  }
}
