import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestValidator } from 'src/common/validators/answer.validator';
import {
  ResourceNotFoundException,
  ValidationException,
} from 'src/common/exceptions/app.exception';
import * as XLSX from 'xlsx';

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 🚨 LIVE EDIT SHIELD: Prevents editing live tests to protect student sessions
   */
  private async validateTestNotLive(testId: string, operation: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, isLive: true, title: true },
    });

    if (!test) {
      throw new ResourceNotFoundException('Test', testId);
    }

    if (test.isLive) {
      throw new BadRequestException(
        `Cannot ${operation} a live test. Please turn off the test "${test.title}" before making changes. This protects active student sessions from crashing.`,
      );
    }
  }

  // 🚀 Atomic Test + Section Creation with validation
  async createTestWithSection(dto: CreateTestDto) {
    // Validate test configuration
    TestValidator.validateDuration(dto.duration);
    TestValidator.validateMarks(
      dto.totalMarks,
      dto.passingMarks,
      dto.positiveMark || 1.0, // ← CHANGED
      dto.negativeMarking || 0.33, // ← FIXED: Use correct DTO field name
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Series exists
      const series = await tx.testSeries.findUnique({
        where: { id: dto.testSeriesId },
      });
      if (!series)
        throw new ResourceNotFoundException('Test Series', dto.testSeriesId);

      // 2. Create Test
      const test = await tx.test.create({
        data: {
          title: dto.title,
          seriesId: dto.testSeriesId,
          durationMins: dto.duration,
          totalMarks: dto.totalMarks,
          passMarks: dto.passingMarks,
          positiveMark: dto.positiveMark || 1.0, // ← ADD THIS
          negativeMark: dto.negativeMarking || 0.33, // ← UPDATE THIS: Map to schema field
          startAt: dto.startAt,
          endAt: dto.endAt,
          isActive: true,
        },
      });

      // 3. Create Default Section
      const section = await tx.section.create({
        data: {
          testId: test.id,
          name: 'General Section',
          order: 1,
        },
      });

      this.logger.log(`Test created: ${test.id} with section ${section.id}`);

      return {
        test,
        section,
      };
    });
  }

  // 1. Create Test
  async create(dto: CreateTestDto) {
    // Validate test configuration
    TestValidator.validateDuration(dto.duration);
    TestValidator.validateMarks(
      dto.totalMarks,
      dto.passingMarks,
      dto.positiveMark || 1.0, // ← FIXED
      dto.negativeMarking || 0.33, // ← FIXED: Use correct DTO field name
    );

    // Validate Series exists
    const series = await this.prisma.testSeries.findUnique({
      where: { id: dto.testSeriesId },
    });
    if (!series)
      throw new ResourceNotFoundException('Test Series', dto.testSeriesId);

    const test = await this.prisma.test.create({
      data: {
        title: dto.title,
        seriesId: dto.testSeriesId,
        durationMins: dto.duration,
        totalMarks: dto.totalMarks,
        passMarks: dto.passingMarks,
        positiveMark: dto.positiveMark || 1.0, // ← FIXED: Use correct DTO field
        negativeMark: dto.negativeMarking || 0.33, // ← FIXED: Map to schema field
        startAt: dto.startAt,
        endAt: dto.endAt,
        isActive: true,
      },
    });

    this.logger.log(`Test created: ${test.id}`);
    return test;
  }

  // 2. Find All (Include Series Title)
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    seriesId?: string;
  }) {
    const { page, limit, search, seriesId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (seriesId) where.seriesId = seriesId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { series: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.test.findMany({
      where,
      include: {
        series: { select: { title: true } },
        sections: {
          include: {
            questions: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Find One with proper error handling
  async findOne(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        series: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    translations: true,
                    topic: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new ResourceNotFoundException('Test', id);
    }

    return test;
  }
  // 4. Update with validation
  async update(id: string, dto: UpdateTestDto) {
    // 🚨 LIVE EDIT SHIELD: Prevent editing live tests
    await this.validateTestNotLive(id, 'edit');

    try {
      return this.prisma.test.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throw new ResourceNotFoundException('Test', id);
    }
  }

  // 🚀 Publish Toggle with validation
  async togglePublish(id: string, isLive: boolean) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });
    if (!test) throw new ResourceNotFoundException('Test', id);

    // 🚨 FIX 1: Prevent publishing empty tests
    if (isLive === true) {
      const totalQuestions = test.sections.reduce(
        (acc, sec) => acc + sec._count.questions,
        0,
      );
      if (totalQuestions === 0) {
        throw new ValidationException(
          'Cannot publish a test with 0 questions! Please add at least one question before publishing.',
          'EMPTY_TEST_PUBLICATION_BLOCKED',
        );
      }
    }

    const updated = await this.prisma.test.update({
      where: { id },
      data: { isLive },
    });

    this.logger.log(`Test ${id} publish status: ${isLive}`);
    return updated;
  }

  // 📋 Duplicate Test (God Mode Feature)
  async duplicateTest(id: string) {
    const originalTest = await this.prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!originalTest) {
      throw new ResourceNotFoundException('Test', id);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create duplicate test
        const duplicatedTest = await tx.test.create({
          data: {
            title: `${originalTest.title} (Copy)`,
            durationMins: originalTest.durationMins,
            totalMarks: originalTest.totalMarks,
            passMarks: originalTest.passMarks,
            negativeMark: originalTest.negativeMark,
            seriesId: originalTest.seriesId,
            isLive: false, // Start as draft
            isPremium: originalTest.isPremium,
            isActive: true,
          },
        });

        // Duplicate sections and questions
        for (const section of originalTest.sections) {
          const duplicatedSection = await tx.section.create({
            data: {
              testId: duplicatedTest.id,
              name: section.name,
              order: section.order,
            },
          });

          // Link questions to new section
          if (section.questions.length > 0) {
            const sectionQuestions = section.questions.map((sq, index) => ({
              sectionId: duplicatedSection.id,
              questionId: sq.questionId,
              order: index + 1,
            }));

            await tx.sectionQuestion.createMany({
              data: sectionQuestions,
            });
          }
        }

        return duplicatedTest;
      });
    } catch (error) {
      this.logger.error(`Failed to duplicate test ${id}`, error);
      throw new ValidationException(
        'Failed to duplicate test. Please try again.',
        'DUPLICATION_FAILED',
      );
    }
  }

  // 📊 NEW: Export Test (God Mode Feature)
  async exportTest(id: string, res: any) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    translations: true,
                    topic: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new ResourceNotFoundException('Test', id);
    }

    const workbook = XLSX.utils.book_new();

    for (const section of test.sections) {
      const worksheetData = [
        [
          'Question',
          'Option A',
          'Option B',
          'Option C',
          'Option D',
          'Correct Answer',
          'Explanation',
        ],
      ];

      for (const sectionQuestion of section.questions) {
        const question = sectionQuestion.question;
        const translation = question.translations[0];

        if (translation) {
          const tAny: any = translation as any;
          const options = (tAny.options as string[]) || [];
          const correctMap = ['A', 'B', 'C', 'D'];
          worksheetData.push([
            translation.content,
            options[0] || '',
            options[1] || '',
            options[2] || '',
            options[3] || '',
            correctMap[(question as any).correctAnswer] || 'A',
            translation.explanation || '',
          ]);
        }
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, section.name);
    }

    // Generate and send file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${test.title.replace(/\s+/g, '_')}_export.xlsx"`,
    );
    res.send(buffer);
  }

  // 5. Delete
  async remove(id: string) {
    // 🚨 LIVE EDIT SHIELD: Prevent deleting live tests
    await this.validateTestNotLive(id, 'delete');

    return this.prisma.test.delete({ where: { id } });
  }

  // 6. Get Test Sections
  async getSections(testId: string) {
    const sections = await this.prisma.section.findMany({
      where: { testId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                translations: true,
                options: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Transform the data to match expected structure
    const transformed = sections.map((section) => ({
      ...section,
      questions: section.questions.map((sq) => sq.question),
    }));

    return transformed;
  }

  // Public/Student methods
  async findAvailableForStudents(
    page: number = 1,
    limit: number = 10,
    search?: string,
    seriesId?: string,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      isLive: true,
      sections: {
        some: {
          questions: {
            some: {},
          },
        },
      },
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (seriesId) {
      where.seriesId = seriesId;
    }

    const [tests, total] = await Promise.all([
      this.prisma.test.findMany({
        where,
        include: {
          series: {
            select: { id: true, title: true, exam: { select: { name: true } } },
          },
          _count: { select: { sections: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.test.count({ where }),
    ]);

    let hasActiveSubscription = false;
    if (userId) {
      const activeSub = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      });
      hasActiveSubscription = !!activeSub;
    }

    return {
      data: tests,
      total,
      page,
      limit,
      hasActiveSubscription,
    };
  }

  async findOneForStudents(testId: string, userId?: string) {
    const test = await this.prisma.test.findFirst({
      where: {
        id: testId,
        isActive: true,
        isLive: true,
        sections: { some: { questions: { some: {} } } },
      },
      include: {
        series: {
          select: { id: true, title: true, exam: { select: { name: true } } },
        },
        _count: { select: { sections: true } },
      },
    });

    if (!test) {
      return null;
    }

    // Check if user has access (based on subscription, attempts, etc.)
    if (userId) {
      const userAttempts = await this.prisma.attempt.count({
        where: { testId, userId },
      });

      // Check max attempts limit
      if (test.maxAttempts && userAttempts >= test.maxAttempts) {
        return null;
      }
    }

    return test;
  }

  async getSectionsForStudents(testId: string, userId?: string) {
    const test = await this.findOneForStudents(testId, userId);

    if (!test) {
      return [];
    }

    return this.getSections(testId);
  }
}
