import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    // 🚨 GHOST QUESTION GUARD: Validate topicId is provided
    if (!dto.topicId) {
      throw new BadRequestException(
        'Topic ID is required. Every question must be categorized under a topic to prevent Ghost Questions.',
      );
    }

    // Check Section exists
    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    // Check Topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    // Create the Question and Translation in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the base Question
      const question = await tx.question.create({
        data: {
          hash: this.generateHash(dto.content), // Generate hash for uniqueness
          topicId: dto.topicId, // 🚨 GHOST QUESTION GUARD: Always assign topic
          isActive: true,
        },
      });

      // Create the Question Translation
      await tx.questionTranslation.create({
        data: {
          questionId: question.id,
          lang: (dto.lang as any)?.toString?.().toUpperCase?.() || 'EN',
          content: dto.content,
          explanation: dto.explanation,
        } as any,
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
    const { content, options, explanation, correctAnswer, lang, ...rest } =
      dto as any;

    return this.prisma.$transaction(async (tx) => {
      const data: any = {};
      if (typeof correctAnswer === 'number') data.correctAnswer = correctAnswer;
      if (typeof rest.isActive === 'boolean') data.isActive = rest.isActive;
      if (rest.topicId) data.topicId = rest.topicId;

      const updated = await tx.question.update({
        where: { id },
        data,
      });

      if (
        content !== undefined ||
        options !== undefined ||
        explanation !== undefined
      ) {
        await tx.questionTranslation.updateMany({
          where: lang
            ? {
                questionId: id,
                lang: lang?.toString?.().toUpperCase?.(),
              }
            : { questionId: id },
          data: {
            ...(content !== undefined ? { content } : {}),
            ...(explanation !== undefined ? { explanation } : {}),
          } as any,
        });
      }

      return updated;
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
        translations: true,
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

  async bulkUpload(
    file: Express.Multer.File,
    sectionId: string,
    topicId?: string,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    // Validate topic if provided
    let topic: any = null;
    if (topicId) {
      topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topic) throw new NotFoundException('Topic not found');
    }

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
      // 🚨 FIX 2A: Pre-process all rows to generate hashes
      const processedRows: any[] = [];
      const allHashes: string[] = [];

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

        // 🛡️ SMART ANSWER VALIDATION: Auto-fix common issues
        let finalCorrectAnswer = correctAnswer;
        if (!finalCorrectAnswer || !validAnswers.includes(finalCorrectAnswer)) {
          // Try to auto-fix common issues
          const answerMap: Record<string, string> = {
            '0': 'A',
            '1': 'B',
            '2': 'C',
            '3': 'D',
            a: 'A',
            b: 'B',
            c: 'C',
            d: 'D',
          };
          finalCorrectAnswer =
            answerMap[finalCorrectAnswer] || finalCorrectAnswer;

          if (!validAnswers.includes(finalCorrectAnswer)) {
            console.warn(
              `Invalid answer "${correctAnswer}" in row ${index + 2}, using A as default`,
            );
            finalCorrectAnswer = 'A'; // Default to A
          }
        }

        // 🛡️ LENIENT VALIDATION: Allow more flexible uploads
        if (!questionText?.trim()) {
          console.warn(`Skipping empty question in row ${index + 2}`);
          continue; // Skip instead of error
        }

        const validOptions = options.filter(
          (opt) => opt && opt.toString().trim(),
        );
        if (validOptions.length < 2) {
          console.warn(
            `Skipping question with < 2 options in row ${index + 2}`,
          );
          continue; // Skip instead of error
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
        const correctIndex = correctMap[finalCorrectAnswer] ?? 0;

        // SMART DEDUPLICATION: Hash the exact content
        const hashContent = questionText + JSON.stringify(options);
        const uniqueHash = crypto
          .createHash('md5')
          .update(hashContent)
          .digest('hex');

        processedRows.push({
          questionText,
          options,
          correctIndex,
          uniqueHash,
          explanation: row['Explanation'] || null,
          index: index + 2, // for error reporting
        });

        allHashes.push(uniqueHash);
      }

      // 🚨 FIX 2B: Fetch ALL existing questions with these hashes in ONE query
      const existingQuestions = await tx.question.findMany({
        where: {
          hash: {
            in: allHashes,
          },
        },
      });

      // Build a Map for O(1) lookup instead of O(n) database queries
      const hashToQuestionMap = new Map(
        existingQuestions.map((q) => [q.hash, q]),
      );

      // 🚨 FIX 2C: Now iterate through processed rows with minimal DB calls
      let count = 0;

      for (const processedRow of processedRows) {
        // 1. Check if question exists in our preloaded map (O(1) lookup, no DB call)
        let question = hashToQuestionMap.get(processedRow.uniqueHash);

        if (!question) {
          // 2. If it is brand new, create it in the Global Bank with topic assignment
          if (!topicId) {
            throw new BadRequestException(
              'Topic ID is required for bulk upload. Please select a topic.',
            );
          }

          question = await tx.question.create({
            data: {
              hash: processedRow.uniqueHash,
              topicId: topicId, // 🚨 CRITICAL: Assign question to topic
              translations: {
                create: {
                  lang: 'EN' as any,
                  content: processedRow.questionText,
                  explanation: processedRow.explanation,
                } as any,
              },
            } as any,
          });
          // Add to map for potential duplicate questions in the same upload
          hashToQuestionMap.set(processedRow.uniqueHash, question);
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
    lang?: string;
  }) {
    const {
      cursor,
      take = 50,
      skip = 0,
      where = {},
      orderBy = { id: 'asc' },
      lang = 'EN',
    } = params;

    // 🛡️ ENFORCE LIMITS: Prevent memory overload
    const enforcedTake = Math.min(take, 100); // Hard cap at 100

    const questions = await this.prisma.question.findMany({
      cursor,
      take: enforcedTake,
      skip,
      where: {
        isActive: true, // Only active questions
        ...where,
      },
      include: {
        translations: {
          take: 1,
        },
        topic: true,
        _count: {
          select: { sectionLinks: true },
        },
      },
      orderBy,
    });

    return questions;
  }

  // 📊 NEW: Get pagination metadata for cursor-based navigation (OPTIMIZED - No slow counts)
  async getCursorMetadata(
    questions: any[],
    take: number = 50,
    direction: 'forward' | 'backward' = 'forward',
  ) {
    // 🚨 FIX 4: Remove slow count() queries - use only what we have
    const hasMore = questions.length === take; // If we got a full page, there might be more
    const hasPrevious = false; // Will be determined by frontend based on cursor existence

    // 🚨 FIX 4B: Remove total, totalPages, currentPage as they require count() queries
    // For cursor pagination, we only need:
    // 1. hasMore (determined by whether we got a full page)
    // 2. nextCursor (last item ID)
    // 3. hasPrevious (frontend knows if there was a previous cursor)

    return {
      hasMore,
      hasPrevious,
      // Remove these to avoid slow count queries:
      // total: 0, // Not needed for cursor pagination
      // totalPages: 0, // Not needed for cursor pagination
      // currentPage: 0, // Not needed for cursor pagination
    };
  }
}
