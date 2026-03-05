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
import { Language } from '@prisma/client';

// Type definitions for bulk upload
export interface ValidatedRow {
  rowNumber: number;
  topicId: string;
  subjectId: string;
  question_en: string;
  question_hi: string;
  options_en: string[];
  options_hi: string[];
  correctIndex: number;
  hash: string;
  explanation_en: string;
  explanation_hi: string;
}

export interface ValidationError {
  row: number;
  errors: string[];
  raw?: any;
}

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
    sectionId?: string,
    topicId?: string,
  ) {
    console.log('=== BULK UPLOAD START ===');
    console.log('sectionId:', sectionId);
    console.log('topicId:', topicId);

    // Validate section exists if provided
    if (sectionId) {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
      });
      if (!section) throw new BadRequestException('Section not found');
    }

    // Validate topic exists if provided
    if (topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topic) throw new BadRequestException('Topic not found');
    }

    // Use the same parsing logic as validation (with normalization)
    const parsedRows = this.parseFile(file.buffer);

    if (!parsedRows || parsedRows.length === 0)
      throw new BadRequestException('Excel sheet is empty');

    // 🚨 NEW: Excel Upload Limit (God Mode Feature)
    if (parsedRows.length > 500) {
      throw new BadRequestException(
        'For system stability, please upload a maximum of 500 questions per Excel file.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 🚨 FIX 2A: Pre-process all rows to generate hashes
      const processedRows: any[] = [];
      const allHashes: string[] = [];

      for (const [index, parsedRow] of parsedRows.entries()) {
        const row = parsedRow.data;
        // Support multiple column naming formats (same as validateBulkFile) with normalized keys
        const rawQuestion =
          row['question en'] ||
          row['question'] ||
          row['question_en'] ||
          row['question'];

        if (!rawQuestion) {
          console.warn(`⚠️ Skipping empty row ${parsedRow.rowNumber}:`, row);
          continue; // Skip empty rows
        }

        const questionText = rawQuestion.toString().trim();
        const options = [
          row['option a en'] ||
            row['option a'] ||
            row['option_a_en'] ||
            row['option_a'],
          row['option b en'] ||
            row['option b'] ||
            row['option_b_en'] ||
            row['option_b'],
          row['option c en'] ||
            row['option c'] ||
            row['option_c_en'] ||
            row['option_c'],
          row['option d en'] ||
            row['option d'] ||
            row['option_d_en'] ||
            row['option_d'],
        ].filter(Boolean);

        // Debug logging for options
        console.log(`Row ${parsedRow.rowNumber} options:`, options);

        // 🚀 NEW: Validation Layer (Fixes "Blind Trust" issue)
        const validAnswers = ['A', 'B', 'C', 'D', '1', '2', '3', '4'];
        const rawCorrectAnswer =
          row['correct answer'] || row['correct_answer'] || row['correct'];
        const correctAnswer = rawCorrectAnswer?.toString().trim().toUpperCase();

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
          explanation:
            row['explanation en'] ||
            row['explanation_en'] ||
            row['explanation'] ||
            null,
          index: parsedRow.rowNumber, // for error reporting
          rawRow: row, // <-- add this so we can resolve topic per-row later
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
          // Resolve topic for this row if not provided globally
          let rowTopicId = topicId; // selectedTopicId (global) if provided

          // if global topicId is not provided, and row provides Topic/Subject or topicId column,
          // use resolveTopicForRow (same as validate)
          if (!rowTopicId) {
            try {
              console.log(
                `🔍 Resolving topic for row ${processedRow.index}:`,
                processedRow.rawRow,
              );
              const resolvedTopic = await this.resolveTopicForRow(
                processedRow.rawRow,
                topicId,
              );
              console.log(
                `✅ Topic resolved for row ${processedRow.index}:`,
                resolvedTopic,
              );
              rowTopicId = resolvedTopic.id;
            } catch (err: any) {
              console.error(
                `❌ Topic resolution failed for row ${processedRow.index}:`,
                err,
              );
              // Provide a clear message which row and why it failed
              throw new BadRequestException(
                `Row ${processedRow.index}: Topic resolution failed - ${
                  err?.message || String(err)
                }`,
              );
            }
          }

          question = await tx.question.create({
            data: {
              hash: processedRow.uniqueHash,
              topicId: rowTopicId, // Use resolved topic ID
              translations: {
                create: [
                  {
                    lang: 'EN' as any,
                    content:
                      processedRow.rawRow['question en'] ||
                      processedRow.questionText,
                    explanation:
                      processedRow.rawRow['explanation en'] ||
                      processedRow.explanation,
                  },
                  // Add Hindi translation if present
                  ...(processedRow.rawRow['question hi']?.trim()
                    ? [
                        {
                          lang: 'HI' as any,
                          content: processedRow.rawRow['question hi'],
                          explanation:
                            processedRow.rawRow['explanation hi']?.trim() ||
                            null,
                        },
                      ]
                    : []),
                ],
              },
              options: {
                create: processedRow.options.map((optionText, idx) => ({
                  order: idx + 1,
                  isCorrect: idx === processedRow.correctIndex,
                  translations: {
                    create: [
                      {
                        lang: 'EN' as any,
                        text: optionText,
                      },
                      // Add Hindi option translation if present
                      ...(processedRow.rawRow[
                        `option ${String.fromCharCode(97 + idx)} hi`
                      ]?.trim()
                        ? [
                            {
                              lang: 'HI' as any,
                              text: processedRow.rawRow[
                                `option ${String.fromCharCode(97 + idx)} hi`
                              ],
                            },
                          ]
                        : []),
                    ],
                  },
                })),
              },
            } as any,
          });
          // Add to map for potential duplicate questions in the same upload
          hashToQuestionMap.set(processedRow.uniqueHash, question);
        }

        // 3. Connect the question (new or existing) to the specific Test Section safely
        if (sectionId) {
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
        }

        count++;
      }
      console.log('=== BULK UPLOAD END ===');
      console.log('Final count:', count);
      return { success: true, count };
    });
  }

  // Helper method to generate SHA-256 hash
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async injectQuestionsIntoSection(questionIds: string[], sectionId?: string) {
    if (!sectionId) {
      throw new BadRequestException(
        'Section ID is required for injecting questions',
      );
    }

    // Validate section exists
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new BadRequestException('Section not found');

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

  // ===== NEW: COMPREHENSIVE BULK VALIDATION & IMPORT =====

  // Helper: normalize text for hashing
  private normalize(str?: string) {
    return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  private makeHash(en?: string, hi?: string) {
    const norm = `${this.normalize(en)}|${this.normalize(hi)}`;
    return crypto.createHash('sha256').update(norm).digest('hex');
  }

  // Parse xlsx buffer and produce rows with rowNumber
  private normalizeRowKeys(raw: Record<string, any>) {
    const normalized: Record<string, any> = {};
    for (const k of Object.keys(raw)) {
      const nk = k.toString().trim().toLowerCase();
      normalized[nk] = raw[k];
    }
    return normalized;
  }

  private parseFile(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
    });

    return rawRows.map((r, i) => ({
      rowNumber: i + 2,
      data: this.normalizeRowKeys(r),
    }));
  }

  // Resolve topic per precedence
  private async resolveTopicForRow(
    row: Record<string, any>,
    selectedTopicId?: string,
  ) {
    // 1) topicId present
    if (row['topicId']) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: String(row['topicId']) },
        include: { subject: true },
      });
      if (!topic) throw new BadRequestException('topicId not found');
      return topic;
    }

    // 2) Topic + Subject present
    if (row['topic'] && row['subject']) {
      const topic = await this.prisma.topic.findFirst({
        where: {
          name: String(row['topic']).trim(),
          subject: { name: String(row['subject']).trim() },
        },
        include: { subject: true },
      });
      if (!topic)
        throw new BadRequestException('Topic not found for provided Subject');
      return topic;
    }

    // 3) Topic present alone and selectedTopicId is provided: verify it belongs to same subject (best-effort)
    if (row['topic'] && selectedTopicId) {
      const sel = await this.prisma.topic.findUnique({
        where: { id: selectedTopicId },
        include: { subject: true },
      });
      if (!sel) throw new BadRequestException('Selected topic not found');

      // if the row topic name equals the selected topic name, accept it; otherwise attempt to find topic with same name under selected subject
      if (String(row['topic']).trim() === sel.name) return sel;

      const topic = await this.prisma.topic.findFirst({
        where: {
          name: String(row['topic']).trim(),
          subjectId: sel.subjectId,
        },
        include: { subject: true },
      });
      if (topic) return topic;
      throw new BadRequestException(
        'Topic name mismatch with selected topic/subject',
      );
    }

    // 4) fallback: if selectedTopicId present, use it for all rows
    if (selectedTopicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: selectedTopicId },
        include: { subject: true },
      });
      if (!topic) throw new BadRequestException('Selected topic not found');
      return topic;
    }

    throw new BadRequestException('Topic not provided');
  }

  // Validate rows and build DTOs
  async validateBulkFile(buffer: Buffer, selectedTopicId?: string) {
    const rows = this.parseFile(buffer);
    const results: any[] = []; // Use any[] temporarily to avoid type issues
    const errors: ValidationError[] = [];

    for (const r of rows) {
      try {
        const raw = r.data;

        // Basic required columns (support multiple naming conventions)
        // Extract values using normalized keys (case-insensitive, trimmed)
        const qEn = (
          raw['question en'] ||
          raw['question'] ||
          raw['question_en'] ||
          ''
        )
          .toString()
          .trim();
        const qHi = (raw['question hi'] || raw['question_hi'] || '')
          .toString()
          .trim();

        // Debug logging for Hindi content
        console.log(
          `Row ${r.rowNumber} question_hi length: ${qHi ? qHi.length : 0}`,
        );

        const optAEn = (
          raw['option a en'] ||
          raw['option a'] ||
          raw['option_a_en'] ||
          raw['option_a'] ||
          ''
        )
          .toString()
          .trim();
        const optBEn = (
          raw['option b en'] ||
          raw['option b'] ||
          raw['option_b_en'] ||
          raw['option_b'] ||
          ''
        )
          .toString()
          .trim();
        const optCEn = (
          raw['option c en'] ||
          raw['option c'] ||
          raw['option_c_en'] ||
          raw['option_c'] ||
          ''
        )
          .toString()
          .trim();
        const optDEn = (
          raw['option d en'] ||
          raw['option d'] ||
          raw['option_d_en'] ||
          raw['option_d'] ||
          ''
        )
          .toString()
          .trim();
        const optAHI = (raw['option a hi'] || raw['option_a_hi'] || '')
          .toString()
          .trim();
        const optBHI = (raw['option b hi'] || raw['option_b_hi'] || '')
          .toString()
          .trim();
        const optCHI = (raw['option c hi'] || raw['option_c_hi'] || '')
          .toString()
          .trim();
        const optDHI = (raw['option d hi'] || raw['option_d_hi'] || '')
          .toString()
          .trim();
        const correct = (
          raw['correct answer'] ||
          raw['correct_answer'] ||
          raw['correct'] ||
          ''
        )
          .toString()
          .trim();
        const expEn = (
          raw['explanation en'] ||
          raw['explanation_en'] ||
          raw['explanation'] ||
          ''
        )
          .toString()
          .trim();
        const expHi = (raw['explanation hi'] || raw['explanation_hi'] || '')
          .toString()
          .trim();

        // Validation
        const validationErrors: string[] = [];
        if (!qEn && !qHi)
          validationErrors.push('Missing Question text (EN or HI)');
        if (!optAEn || !optBEn)
          validationErrors.push('At least Option A and Option B are required');
        if (!['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(correct)) {
          validationErrors.push(
            'Invalid Correct Answer (must be A/B/C/D or 1/2/3/4)',
          );
        }

        if (validationErrors.length > 0) {
          errors.push({ row: r.rowNumber, errors: validationErrors });
          continue;
        }

        // Resolve topic (could throw)
        let topic;
        try {
          topic = await this.resolveTopicForRow(raw, selectedTopicId);
        } catch (error) {
          errors.push({
            row: r.rowNumber,
            errors: [
              error instanceof Error
                ? error.message
                : 'Topic resolution failed',
            ],
          });
          continue;
        }

        // Build question DTO
        const optionsEn = [optAEn, optBEn, optCEn, optDEn];
        const optionsHi = [optAHI, optBHI, optCHI, optDHI];

        // Compute correct index normalized to order (1-based)
        let correctIndex = 0;
        if (['A', 'B', 'C', 'D'].includes(correct))
          correctIndex = ['A', 'B', 'C', 'D'].indexOf(correct) + 1;
        else correctIndex = parseInt(correct, 10);

        const hash = this.makeHash(qEn, qHi);

        results.push({
          rowNumber: r.rowNumber,
          topicId: topic.id,
          subjectId: topic.subjectId,
          question_en: qEn,
          question_hi: qHi,
          options_en: optionsEn,
          options_hi: optionsHi,
          correctIndex,
          hash,
          explanation_en: expEn,
          explanation_hi: expHi,
        });
      } catch (err: any) {
        errors.push({
          row: r.rowNumber,
          errors: [err.message || String(err)],
          raw: r.data,
        });
      }
    }

    // Detect duplicates within file based on hash
    const seen = new Map<string, number>(); // hash -> firstRow
    const validResults: any[] = []; // Use any[] to avoid type issues
    for (const res of results) {
      if (seen.has(res.hash)) {
        errors.push({
          row: res.rowNumber,
          errors: [
            `Duplicate in file (same question as row ${seen.get(res.hash)})`,
          ],
        });
      } else {
        seen.set(res.hash, res.rowNumber);
        validResults.push(res);
      }
    }

    // Check existing DB duplicates
    const hashes = validResults.map((r) => r.hash);
    if (hashes.length) {
      const existing = await this.prisma.question.findMany({
        where: { hash: { in: hashes } },
        select: { hash: true },
      });
      const existingSet = new Set(existing.map((e) => e.hash));
      for (const r of validResults) {
        if (existingSet.has(r.hash)) {
          errors.push({
            row: r.rowNumber,
            errors: ['Question already exists in DB (duplicate hash)'],
          });
        }
      }
    }

    // Filter out rows with errors from valid results
    const finalValidResults = validResults.filter(
      (r) => !errors.some((e) => e.row === r.rowNumber),
    );

    return {
      totalRows: rows.length,
      validCount: validResults.length,
      errors,
      preview: finalValidResults.slice(0, 5), // Show first 5 valid rows as preview
      allValidRows: finalValidResults as any[], // Cast to any[] to avoid type issues
    };
  }

  // Import only valid rows
  async importBulkFile(
    buffer: Buffer,
    selectedTopicId?: string,
    onlyValid = true,
  ) {
    const validation = await this.validateBulkFile(buffer, selectedTopicId);

    if (!onlyValid && validation.errors.length) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const toInsert = validation.allValidRows;

    if (toInsert.length === 0) {
      throw new BadRequestException('No valid rows to import');
    }

    // Insert in transactions using batched operations
    await this.prisma.$transaction(async (tx) => {
      for (const q of toInsert) {
        // Create Question
        const createdQ = await tx.question.create({
          data: {
            topicId: q.topicId,
            hash: q.hash,
          },
        });

        // Create translations
        await tx.questionTranslation.createMany({
          data: [
            {
              questionId: createdQ.id,
              lang: 'EN' as Language,
              content: q.question_en,
              explanation: q.explanation_en || null,
            },
            {
              questionId: createdQ.id,
              lang: 'HI' as Language,
              content: q.question_hi || null,
              explanation: q.explanation_hi || null,
            },
          ].filter((t) => t.content), // Only create if content exists
        });

        // Create options
        const optionCreateData = q.options_en.map((optText, idx) => ({
          questionId: createdQ.id,
          order: idx + 1,
          isCorrect: idx + 1 === q.correctIndex,
        }));
        const createdOptions: any[] = [];
        for (const oc of optionCreateData) {
          const op = await tx.questionOption.create({ data: oc });
          createdOptions.push(op);
        }

        // Option translations
        const optionTrans: any[] = [];
        for (let i = 0; i < createdOptions.length; i++) {
          const op = createdOptions[i];
          if (q.options_en[i])
            optionTrans.push({
              optionId: op.id,
              lang: 'EN' as Language,
              text: q.options_en[i],
            });
          if (q.options_hi[i])
            optionTrans.push({
              optionId: op.id,
              lang: 'HI' as Language,
              text: q.options_hi[i],
            });
        }
        if (optionTrans.length)
          await tx.optionTranslation.createMany({
            data: optionTrans,
          });
      }
    });

    return {
      imported: toInsert.length,
      total: validation.totalRows,
      errors: validation.errors.length,
    };
  }
}
