import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AuditLogsService } from '../../admin/audit-logs/audit-logs.service';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { Language } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateQuestionDto) {
    if (!dto.topicId) {
      throw new BadRequestException(
        'Topic ID is required. Every question must be categorized under a topic to prevent Ghost Questions.',
      );
    }

    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          hash: QuestionsService.computeQuestionHash(dto.content),
          topicId: dto.topicId,
          isActive: true,
        },
      });

      await tx.questionTranslation.create({
        data: {
          questionId: question.id,
          lang: ((dto.lang as any)?.toString?.().toUpperCase?.() ??
            'EN') as any,
          content: dto.content,
          explanation: dto.explanation,
        } as any,
      });

      const options: string[] = (dto as any).options ?? [];
      const correctAnswer: number = (dto as any).correctAnswer ?? 0;

      for (let i = 0; i < options.length; i++) {
        const opt = await tx.questionOption.create({
          data: {
            questionId: question.id,
            order: i + 1,
            isCorrect: i === correctAnswer,
          },
        });

        await tx.optionTranslation.create({
          data: {
            optionId: opt.id,
            lang: ((dto.lang as any)?.toString?.().toUpperCase?.() ??
              'EN') as any,
            text: options[i],
          },
        });
      }

      await tx.sectionQuestion.create({
        data: {
          sectionId: dto.sectionId,
          questionId: question.id,
          order: (dto as any).order ?? 1,
        },
      });

      return question;
    });
  }

  findAll() {
    return this.prisma.question.findMany({
      include: {
        translations: true,
        options: {
          orderBy: { order: 'asc' },
          include: { translations: true },
        },
        sectionLinks: {
          include: { section: true },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        translations: true,
        options: {
          orderBy: { order: 'asc' },
          include: { translations: true },
        },
        sectionLinks: {
          include: { section: true },
        },
      },
    });
  }

  update(id: string, dto: UpdateQuestionDto) {
    const { content, options, explanation, correctAnswer, lang, ...rest } =
      dto as any;

    return this.prisma.$transaction(async (tx) => {
      const data: any = {};

      // ✅ FIX: The `Question` model has NO `correctAnswer` field — the correct
      // answer is stored on `QuestionOption.isCorrect`. Writing correctAnswer
      // here causes: PrismaClientValidationError: Unknown field `correctAnswer`.
      // REMOVED: if (typeof correctAnswer === 'number') data.correctAnswer = correctAnswer;
      // The options loop below handles isCorrect correctly.

      if (typeof rest.isActive === 'boolean') data.isActive = rest.isActive;
      if (rest.topicId) data.topicId = rest.topicId;

      const updated = await tx.question.update({ where: { id }, data });

      if (content !== undefined || explanation !== undefined) {
        await tx.questionTranslation.updateMany({
          where: lang
            ? { questionId: id, lang: lang?.toString?.().toUpperCase?.() }
            : { questionId: id },
          data: {
            ...(content !== undefined ? { content } : {}),
            ...(explanation !== undefined ? { explanation } : {}),
          } as any,
        });
      }

      if (Array.isArray(options) && options.length > 0) {
        const existingOptions = await tx.questionOption.findMany({
          where: { questionId: id },
          orderBy: { order: 'asc' },
        });

        for (
          let i = 0;
          i < Math.min(options.length, existingOptions.length);
          i++
        ) {
          const optLang = lang?.toString?.().toUpperCase?.() ?? 'EN';
          await tx.optionTranslation.updateMany({
            where: { optionId: existingOptions[i].id, lang: optLang },
            data: { text: options[i] },
          });
        }

        if (typeof correctAnswer === 'number') {
          for (let i = 0; i < existingOptions.length; i++) {
            await tx.questionOption.update({
              where: { id: existingOptions[i].id },
              data: { isCorrect: i === correctAnswer },
            });
          }
        }
      }

      return updated;
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  async softDelete(id: string, actorId?: string, actorRole?: string) {
    const result = await this.prisma.question.update({
      where: { id },
      data: { isActive: false },
    });

    this.auditLogs
      .log({
        action: 'QUESTION_SOFT_DELETED',
        targetType: 'Question',
        targetId: id,
        actorId,
        actorRole: actorRole as any,
        metadata: { isActive: false },
      })
      .catch((err) =>
        this.logger.error('Audit log failed for QUESTION_SOFT_DELETED', err),
      );

    return result;
  }

  async updateTopic(id: string, topicId?: string) {
    return this.prisma.question.update({
      where: { id },
      data: { topicId },
    });
  }

  // ─── Bulk tagging ─────────────────────────────────────────────────────────

  async bulkTagQuestions(
    questionIds: string[],
    topicId: string,
    actorId?: string,
    actorRole?: string,
  ) {
    const result = await this.prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { topicId },
    });

    this.auditLogs
      .log({
        action: 'QUESTIONS_BULK_TAGGED',
        targetType: 'Question',
        targetId: topicId,
        actorId,
        actorRole: actorRole as any,
        metadata: { questionIds, topicId, updatedCount: result.count },
      })
      .catch((err) =>
        this.logger.error('Audit log failed for QUESTIONS_BULK_TAGGED', err),
      );

    return result;
  }

  // ─── Inject into section ──────────────────────────────────────────────────

  async injectQuestionsIntoSection(questionIds: string[], sectionId?: string) {
    if (!sectionId) {
      throw new BadRequestException(
        'Section ID is required for injecting questions',
      );
    }

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new BadRequestException('Section not found');

    return this.prisma.$transaction(async (tx) => {
      const questions = await tx.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true },
      });

      const existingLinks = await tx.sectionQuestion.findMany({
        where: { sectionId, questionId: { in: questionIds } },
        select: { questionId: true },
      });
      const alreadyLinked = new Set(existingLinks.map((l) => l.questionId));

      const maxResult = await tx.sectionQuestion.aggregate({
        where: { sectionId },
        _max: { order: true },
      });
      let nextOrder = (maxResult._max.order ?? 0) + 1;

      const newLinks = questions
        .filter((q) => !alreadyLinked.has(q.id))
        .map((q) => ({
          sectionId,
          questionId: q.id,
          order: nextOrder++,
        }));

      if (newLinks.length > 0) {
        await tx.sectionQuestion.createMany({ data: newLinks });
      }

      const skippedCount = questionIds.length - questions.length;
      this.logger.debug(
        `injectQuestionsIntoSection: ${newLinks.length} injected, ` +
          `${alreadyLinked.size} already linked, ${skippedCount} not found`,
      );

      return { success: true, injectedCount: newLinks.length };
    });
  }

  // ─── Cursor-based pagination ──────────────────────────────────────────────

  async findWithCursor(params: {
    cursor?: { id: string };
    take?: number;
    skip?: number;
    where?: any;
    orderBy?: any;
    lang?: string;
    search?: string;
    subject?: string;
    topicId?: string;
  }) {
    const {
      cursor,
      take = 50,
      skip = 0,
      orderBy = { id: 'asc' },
      search,
      subject,
      topicId,
    } = params;

    const enforcedTake = Math.min(take, 100);

    const where: any = {
      isActive: true,
      ...params.where,
    };

    if (search) {
      where.OR = [
        {
          translations: {
            some: {
              content: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          options: {
            some: {
              translations: {
                some: {
                  text: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        },
      ];
    }

    if (topicId) {
      where.topicId = topicId;
    } else if (subject) {
      where.topic = { subject: { name: subject } };
    }

    return this.prisma.question.findMany({
      cursor,
      take: enforcedTake,
      skip,
      where,
      include: {
        translations: true,
        options: {
          orderBy: { order: 'asc' },
          include: { translations: true },
        },
        topic: {
          include: { subject: true },
        },
        _count: {
          select: { sectionLinks: true },
        },
      },
      orderBy,
    });
  }

  async getCursorMetadata(questions: any[], take: number = 50) {
    const hasMore = questions.length === take;
    return { hasMore, hasPrevious: false };
  }

  // ─── Hash ─────────────────────────────────────────────────────────────────

  static computeQuestionHash(enText: string, hiText?: string): string {
    const normalise = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
    const combined = `${normalise(enText)}\x00${normalise(hiText ?? '')}`;
    return crypto.createHash('sha256').update(combined, 'utf8').digest('hex');
  }

  // ─── Bulk upload helpers ──────────────────────────────────────────────────

  private normalizeRowKeys(raw: Record<string, any>) {
    const normalized: Record<string, any> = {};
    for (const key in raw) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      normalized[cleanKey] = raw[key];
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

  // ✅ FIX: Pass optional prismaClient so this can be called inside a $transaction
  // using the transaction client (tx) instead of the outer prisma client.
  // Without this, reads inside a transaction see a different snapshot → stale reads
  // and possible FK constraint failures if a topic is deleted mid-transaction.
  private async resolveTopicForRow(
    row: Record<string, any>,
    prismaClient?: any,
  ) {
    // After normalizeRowKeys(), ALL keys are lowercase with no special chars.
    // 'Topic ID', 'topicId', 'topic_id', 'TOPICID' all become 'topicid'
    const prisma = prismaClient || this.prisma;

    if (row['topicid']) {
      const topic = await prisma.topic.findUnique({
        where: { id: String(row['topicid']) },
        include: { subject: true },
      });
      if (!topic) throw new BadRequestException('topicId not found');
      return topic;
    }

    if (row['topic'] && row['subject']) {
      const topic = await prisma.topic.findFirst({
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

    throw new BadRequestException(
      'Topic not found in row. Please include either "Topic ID" or both "Topic" and "Subject" columns.',
    );
  }

  // ─── Bulk upload ──────────────────────────────────────────────────────────

  async bulkUpload(file: Express.Multer.File, sectionId?: string) {
    this.logger.debug('Bulk upload started', { sectionId });

    if (sectionId) {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
      });
      if (!section) throw new BadRequestException('Section not found');
    }

    const parsedRows = this.parseFile(file.buffer);

    if (!parsedRows || parsedRows.length === 0) {
      throw new BadRequestException('Excel sheet is empty');
    }

    if (parsedRows.length > 500) {
      throw new BadRequestException(
        'For system stability, please upload a maximum of 500 questions per Excel file.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const processedRows: any[] = [];
      const allHashes: string[] = [];

      for (const parsedRow of parsedRows) {
        const row = parsedRow.data;
        const rawQuestion =
          row['questionen'] || row['question'] || row['question_en'];

        if (!rawQuestion) {
          this.logger.warn(`Skipping empty row ${parsedRow.rowNumber}`);
          continue;
        }

        const questionText = rawQuestion.toString().trim();

        // ✅ FIX: Keep original indices — do NOT filter before mapping.
        // If option C is blank and we filter first, option D shifts to index 2,
        // meaning isCorrect = (idx === correctIndex) maps D→C. Wrong answer stored.
        const options = [
          row['optionaen'] ||
            row['optiona'] ||
            row['option_a_en'] ||
            row['option_a'],
          row['optionben'] ||
            row['optionb'] ||
            row['option_b_en'] ||
            row['option_b'],
          row['optioncen'] ||
            row['optionc'] ||
            row['option_c_en'] ||
            row['option_c'],
          row['optionden'] ||
            row['optiond'] ||
            row['option_d_en'] ||
            row['option_d'],
        ];

        const validAnswers = ['A', 'B', 'C', 'D', '1', '2', '3', '4'];
        const rawCorrectAnswer =
          row['correctanswer'] || row['correct_answer'] || row['correct'];
        const correctAnswer = rawCorrectAnswer?.toString().trim().toUpperCase();

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
        const finalCorrectAnswer = validAnswers.includes(correctAnswer)
          ? correctAnswer
          : (answerMap[correctAnswer] ?? 'A');

        if (!questionText?.trim()) {
          this.logger.warn(
            `Skipping empty question in row ${parsedRow.rowNumber}`,
          );
          continue;
        }

        const validOptions = options.filter((opt) => opt?.toString().trim());
        if (validOptions.length < 2) {
          this.logger.warn(
            `Skipping question with < 2 options in row ${parsedRow.rowNumber}`,
          );
          continue;
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

        const hiQuestion = row['questionhi']?.trim() || '';
        const uniqueHash = QuestionsService.computeQuestionHash(
          questionText,
          hiQuestion,
        );

        processedRows.push({
          questionText,
          options,
          correctIndex,
          uniqueHash,
          explanation:
            row['explanationen'] ||
            row['explanation_en'] ||
            row['explanation'] ||
            null,
          index: parsedRow.rowNumber,
          rawRow: row,
        });

        allHashes.push(uniqueHash);
      }

      const existingQuestions = await tx.question.findMany({
        where: { hash: { in: allHashes } },
      });
      const hashToQuestionMap = new Map(
        existingQuestions.map((q) => [q.hash, q]),
      );

      let count = 0;

      for (const processedRow of processedRows) {
        let question: any;
        if (!hashToQuestionMap.has(processedRow.uniqueHash)) {
          let rowTopicId: string;

          try {
            const resolvedTopic = await this.resolveTopicForRow(
              processedRow.rawRow,
              tx, // ✅ Pass transaction client — keeps reads in the same snapshot
            );
            rowTopicId = resolvedTopic.id;
          } catch (err: any) {
            throw new BadRequestException(
              `Row ${processedRow.index}: Topic resolution failed — ${err?.message ?? String(err)}. ` +
                `Please ensure each row has a valid topicId or topic name.`,
            );
          }

          question = await tx.question.create({
            data: {
              hash: processedRow.uniqueHash,
              topicId: rowTopicId,
              isActive: true,
              translations: {
                create: [
                  {
                    lang: 'EN' as any,
                    content:
                      processedRow.rawRow['questionen'] ||
                      processedRow.rawRow['question_en'] ||
                      processedRow.rawRow['question'] ||
                      processedRow.questionText,
                    explanation:
                      processedRow.rawRow['explanationen'] ||
                      processedRow.rawRow['explanation_en'] ||
                      processedRow.rawRow['explanation'] ||
                      processedRow.explanation,
                  },
                  ...(processedRow.rawRow['questionhi']?.trim()
                    ? [
                        {
                          lang: 'HI' as any,
                          content: processedRow.rawRow['questionhi'],
                          explanation:
                            processedRow.rawRow['explanationhi']?.trim() ||
                            null,
                        },
                      ]
                    : []),
                ],
              },
              options: {
                // ✅ FIX: Map first (to preserve idx → correctIndex alignment),
                // filter nulls after. This ensures isCorrect is set on the right option
                // even when some options are blank (e.g. only A, B, D provided).
                create: processedRow.options
                  .map((optionText: string, idx: number) => {
                    if (!optionText || !String(optionText).trim()) return null;
                    return {
                      order: idx + 1,
                      isCorrect: idx === processedRow.correctIndex,
                      translations: {
                        create: [
                          { lang: 'EN' as any, text: String(optionText) },
                          ...(processedRow.rawRow[
                            `option${String.fromCharCode(97 + idx)}hi`
                          ]?.trim()
                            ? [
                                {
                                  lang: 'HI' as any,
                                  text: processedRow.rawRow[
                                    `option${String.fromCharCode(97 + idx)}hi`
                                  ],
                                },
                              ]
                            : []),
                        ],
                      },
                    };
                  })
                  .filter(Boolean),
              },
            } as any,
          });

          hashToQuestionMap.set(processedRow.uniqueHash, question);
        } else {
          question = hashToQuestionMap.get(processedRow.uniqueHash);
        }

        if (sectionId) {
          await tx.sectionQuestion.upsert({
            where: {
              sectionId_questionId: { sectionId, questionId: question.id },
            },
            update: {},
            create: {
              sectionId,
              questionId: question.id,
              order: count + 1,
            },
          });
        }

        count++;
      }

      this.logger.log(`Bulk upload complete — ${count} questions processed`);
      return { success: true, count };
    });
  }

  // ─── Validate bulk file ───────────────────────────────────────────────────

  async validateBulkFile(buffer: Buffer, selectedTopicId?: string) {
    const rows = this.parseFile(buffer);
    const results: any[] = [];
    const errors: ValidationError[] = [];

    for (const r of rows) {
      try {
        const raw = r.data;

        const qEn = (raw['questionen'] || raw['question'] || '')
          .toString()
          .trim();
        const qHi = (raw['questionhi'] || '').toString().trim();
        const optAEn = (raw['optionaen'] || raw['optiona'] || '')
          .toString()
          .trim();
        const optBEn = (raw['optionben'] || raw['optionb'] || '')
          .toString()
          .trim();
        const optCEn = (raw['optioncen'] || raw['optionc'] || '')
          .toString()
          .trim();
        const optDEn = (raw['optionden'] || raw['optiond'] || '')
          .toString()
          .trim();
        const optAHI = (raw['optionahi'] || '').toString().trim();
        const optBHI = (raw['optionbhi'] || '').toString().trim();
        const optCHI = (raw['optionchi'] || '').toString().trim();
        const optDHI = (raw['optiondhi'] || '').toString().trim();
        const correct = (raw['correctanswer'] || raw['correct'] || '')
          .toString()
          .trim();
        const expEn = (raw['explanationen'] || raw['explanation'] || '')
          .toString()
          .trim();
        const expHi = (raw['explanationhi'] || '').toString().trim();

        const validationErrors: string[] = [];
        if (!qEn && !qHi)
          validationErrors.push('Missing Question text (EN or HI)');
        if (!optAEn || !optBEn)
          validationErrors.push('At least Option A and Option B are required');
        if (!['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(correct))
          validationErrors.push(
            'Invalid Correct Answer (must be A/B/C/D or 1/2/3/4)',
          );

        if (validationErrors.length > 0) {
          errors.push({ row: r.rowNumber, errors: validationErrors });
          continue;
        }

        let topic;
        try {
          topic = await this.resolveTopicForRow(raw);
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

        const optionsEn = [optAEn, optBEn, optCEn, optDEn];
        const optionsHi = [optAHI, optBHI, optCHI, optDHI];

        let correctIndex = 0;
        if (['A', 'B', 'C', 'D'].includes(correct))
          correctIndex = ['A', 'B', 'C', 'D'].indexOf(correct);
        else correctIndex = parseInt(correct, 10) - 1;

        const hash = QuestionsService.computeQuestionHash(qEn, qHi);

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

    const seen = new Map<string, number>();
    const validResults: any[] = [];
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

    const finalValidResults = validResults.filter(
      (r) => !errors.some((e) => e.row === r.rowNumber),
    );

    return {
      totalRows: rows.length,
      validCount: finalValidResults.length,
      errors,
      preview: finalValidResults.slice(0, 5),
      allValidRows: finalValidResults as any[],
    };
  }

  // ─── Import bulk file ─────────────────────────────────────────────────────

  async importBulkFile(
    buffer: Buffer,
    selectedTopicId?: string,
    onlyValid = true,
  ) {
    const validation = await this.validateBulkFile(buffer, selectedTopicId);

    if (onlyValid && validation.errors.length) {
      throw new BadRequestException({
        message: 'Validation failed in strict mode',
        errors: validation.errors,
      });
    }

    const toInsert = validation.allValidRows;

    if (toInsert.length === 0) {
      throw new BadRequestException('No valid rows to import');
    }

    await this.prisma.$transaction(async (tx) => {
      const hashes = toInsert.map((q) => q.hash);
      const existingInTx = await tx.question.findMany({
        where: { hash: { in: hashes } },
        select: { hash: true },
      });
      const existingHashes = new Set(existingInTx.map((q) => q.hash));

      for (const q of toInsert) {
        if (existingHashes.has(q.hash)) {
          this.logger.warn(
            `Skipping duplicate hash ${q.hash} (race condition)`,
          );
          continue;
        }

        // ✅ FIX: Added isActive: true — without this, questions are inactive
        // by default and won't appear in queries that filter isActive: true.
        const createdQ = await tx.question.create({
          data: { topicId: q.topicId, hash: q.hash, isActive: true },
        });

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
              content: q.question_hi?.trim() || null,
              explanation: q.explanation_hi?.trim() || null,
            },
          ].filter((t) => t.content?.trim()),
        });

        const optionCreateData = q.options_en.map(
          (optText: string, idx: number) => ({
            questionId: createdQ.id,
            order: idx + 1,
            isCorrect: idx === q.correctIndex,
          }),
        );

        const createdOptions: any[] = [];
        for (const oc of optionCreateData) {
          const op = await tx.questionOption.create({ data: oc });
          createdOptions.push(op);
        }

        const optionTrans: any[] = [];
        for (let i = 0; i < createdOptions.length; i++) {
          const op = createdOptions[i];
          if (q.options_en[i]) {
            optionTrans.push({
              optionId: op.id,
              lang: 'EN' as Language,
              text: q.options_en[i],
            });
          }
          if (q.options_hi[i]?.trim()) {
            optionTrans.push({
              optionId: op.id,
              lang: 'HI' as Language,
              text: q.options_hi[i].trim(),
            });
          }
        }

        if (optionTrans.length) {
          await tx.optionTranslation.createMany({ data: optionTrans });
        }
      }
    });

    return {
      imported: toInsert.length,
      total: validation.totalRows,
      errors: validation.errors.length,
    };
  }
}
