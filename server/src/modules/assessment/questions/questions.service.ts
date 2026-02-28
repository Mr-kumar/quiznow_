import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    // Check Section exists
    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    // Create the Question and Translation in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the base Question
      const question = await tx.question.create({
        data: {
          correctAnswer: dto.correctAnswer,
          hash: this.generateHash(dto.content), // Generate hash for uniqueness
          isActive: true,
        },
      });

      // Create the Question Translation
      await tx.questionTranslation.create({
        data: {
          questionId: question.id,
          lang: dto.lang || 'en',
          content: dto.content,
          options: dto.options,
          explanation: dto.explanation,
        },
      });

      // Link Question to Section
      await tx.sectionQuestion.create({
        data: {
          sectionId: dto.sectionId,
          questionId: question.id,
          order: dto.order,
        },
      });

      return question;
    });
  }

  findAll() {
    return this.prisma.question.findMany({
      include: {
        translations: true,
        sectionLinks: {
          include: {
            section: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        translations: true,
        sectionLinks: {
          include: {
            section: true,
          },
        },
      },
    });
  }

  update(id: string, dto: UpdateQuestionDto) {
    return this.prisma.question.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  // NEW: Soft Delete (Fixes "Data Corruption" issue)
  async softDelete(id: string) {
    return this.prisma.question.update({
      where: { id },
      data: { isActive: false }, // Hides it, but keeps student history intact!
    });
  }

  // Update question topic (for testing)
  async updateTopic(id: string, topicId?: string) {
    return this.prisma.question.update({
      where: { id },
      data: { topicId },
    });
  }

  // Cursor-based pagination using Prisma's B-Tree index (O(1) time complexity)
  async getPaginatedQuestions(params: {
    cursor?: string;
    limit: number;
    search?: string;
    subject?: string;
    topic?: string;
  }) {
    const { cursor, limit, search, subject, topic } = params;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        {
          translations: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    if (topic) {
      where.topicId = topic;
    } else if (subject) {
      where.topic = {
        subject: subject,
      };
    }

    // Fetch limit+1 items to check if there are more pages
    // This allows us to know if hasMore without double-counting queries
    const questions = await this.prisma.question.findMany({
      where,
      include: {
        topic: true,
        translations: {
          where: { lang: 'en' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Cursor-based pagination: O(1) lookup via B-Tree index
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      take: limit + 1, // Fetch one extra to determine hasMore
    });

    // Check if there are more items
    const hasMore = questions.length > limit;

    // Return only the requested limit
    const paginatedQuestions = questions.slice(0, limit);

    // Last question ID becomes the cursor for next page
    const nextCursor = hasMore
      ? paginatedQuestions[paginatedQuestions.length - 1]?.id
      : null;

    return {
      questions: paginatedQuestions,
      nextCursor,
      hasMore,
      limit,
      count: paginatedQuestions.length,
    };
  }

  async bulkUpload(file: Express.Multer.File, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0)
      throw new BadRequestException('Excel sheet is empty');

    // 🚨 NEW: Excel Upload Limit (God Mode Feature)
    if (rows.length > 500) {
      throw new BadRequestException(
        'For system stability, please upload a maximum of 500 questions per Excel file.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const [index, row] of rows.entries()) {
        if (!row['Question']) continue; // Skip empty rows

        const questionText = row['Question'].toString().trim();
        const options = [
          row['Option A'],
          row['Option B'],
          row['Option C'],
          row['Option D'],
        ].filter(Boolean);

        // 🚀 NEW: Validation Layer (Fixes "Blind Trust" issue)
        const validAnswers = ['A', 'B', 'C', 'D', '1', '2', '3', '4'];
        const correctAnswer = row['Correct Answer']
          ?.toString()
          .trim()
          .toUpperCase();

        if (!correctAnswer || !validAnswers.includes(correctAnswer)) {
          throw new BadRequestException(
            `Invalid answer "${correctAnswer}" in row ${index + 2}. Valid answers: A, B, C, D, 1, 2, 3, 4`,
          );
        }

        // Validate required fields
        if (!questionText?.trim()) {
          throw new BadRequestException(
            `Empty question text in row ${index + 2}`,
          );
        }

        if (!options || options.length < 2) {
          throw new BadRequestException(
            `At least 2 options required in row ${index + 2}`,
          );
        }

        const correctMap: Record<string, number> = {
          A: 0,
          B: 1,
          C: 2,
          D: 3,
          '1': 0,
          '2': 1,
          '3': 2,
          '4': 3,
        };
        const correctIndex = correctMap[correctAnswer] ?? 0;

        // SMART DEDUPLICATION: Hash the exact content
        const hashContent = questionText + JSON.stringify(options);
        const uniqueHash = crypto
          .createHash('md5')
          .update(hashContent)
          .digest('hex');

        // 1. Check if this exact question already exists globally in the Question Bank
        let question = await tx.question.findUnique({
          where: { hash: uniqueHash },
        });

        if (!question) {
          // 2. If it is brand new, create it in the Global Bank
          question = await tx.question.create({
            data: {
              correctAnswer: correctIndex,
              hash: uniqueHash,
              translations: {
                create: {
                  lang: 'en',
                  content: questionText,
                  options: options,
                  explanation: row['Explanation'] || null,
                },
              },
            },
          });
        }

        // 3. Connect the question (new or existing) to the specific Test Section safely
        await tx.sectionQuestion.upsert({
          where: {
            sectionId_questionId: {
              sectionId: sectionId,
              questionId: question.id,
            },
          },
          update: {}, // Do nothing if it's already linked to this section
          create: {
            sectionId: sectionId,
            questionId: question.id,
            order: count + 1,
          },
        });

        count++;
      }
      return { success: true, count };
    });
  }

  // Helper method to generate MD5 hash
  private generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Inject questions from Question Bank into a section
  async injectQuestionsIntoSection(sectionId: string, questionIds: string[]) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { questions: true },
    });

    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.$transaction(async (tx) => {
      let injectedCount = 0;

      for (const questionId of questionIds) {
        // Verify question exists
        const question = await tx.question.findUnique({
          where: { id: questionId },
        });

        if (!question) {
          console.warn(`Question ${questionId} not found, skipping`);
          continue;
        }

        // Check if already linked to this section
        const existingLink = await tx.sectionQuestion.findUnique({
          where: {
            sectionId_questionId: {
              sectionId,
              questionId,
            },
          },
        });

        if (!existingLink) {
          // Get current max order for this section
          const maxOrder = await tx.sectionQuestion.findMany({
            where: { sectionId },
            orderBy: { order: 'desc' },
            take: 1,
          });

          const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 1;

          // Create the link
          await tx.sectionQuestion.create({
            data: {
              sectionId,
              questionId,
              order: nextOrder,
            },
          });

          injectedCount++;
        }
      }

      return { success: true, injectedCount };
    });
  }

  // 🏷️ NEW: Bulk Tagging (God Mode Feature)
  async bulkTagQuestions(questionIds: string[], topicId: string) {
    return this.prisma.question.updateMany({
      where: {
        id: { in: questionIds },
      },
      data: {
        topicId: topicId,
      },
    });
  }

  // 🚀 NEW: Cursor-Based Pagination (Enterprise Scale Feature)
  async findWithCursor(params: {
    cursor?: { id: string };
    take?: number;
    skip?: number;
    where?: any;
    orderBy?: any;
  }) {
    const {
      cursor,
      take = 50,
      skip = 0,
      where = {},
      orderBy = { id: 'asc' },
    } = params;

    const questions = await this.prisma.question.findMany({
      cursor,
      take,
      skip,
      where: {
        isActive: true, // Only active questions
        ...where,
      },
      include: {
        translations: {
          where: { lang: 'en' }, // Only English translations
          take: 1,
        },
        topic: true, // Include topic with subject string field
      },
      orderBy,
    });

    return questions;
  }

  // 📊 NEW: Get pagination metadata for cursor-based navigation
  async getCursorMetadata(cursor?: string, take: number = 50) {
    const where = { isActive: true };

    // Count total questions
    const total = await this.prisma.question.count({ where });

    // Get current position if cursor exists
    let currentPosition = 0;
    if (cursor) {
      currentPosition = await this.prisma.question.count({
        where: {
          ...where,
          id: { lt: cursor },
        },
      });
    }

    const hasMore = currentPosition + take < total;
    const hasPrevious = currentPosition > 0;

    return {
      total,
      currentPosition,
      hasMore,
      hasPrevious,
      totalPages: Math.ceil(total / take),
      currentPage: Math.floor(currentPosition / take) + 1,
    };
  }
}
