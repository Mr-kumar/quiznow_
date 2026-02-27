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

  // Update question topic (for testing)
  async updateTopic(id: string, topicId?: string) {
    return this.prisma.question.update({
      where: { id },
      data: { topicId },
    });
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

    return this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const row of rows) {
        if (!row['Question']) continue; // Skip empty rows

        const questionText = row['Question'].toString().trim();
        const options = [
          row['Option A'],
          row['Option B'],
          row['Option C'],
          row['Option D'],
        ].filter(Boolean);

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
        const correctIndex =
          correctMap[row['Correct Answer']?.toString().trim().toUpperCase()] ??
          0;

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
}
