import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

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

  async bulkUpload(file: Express.Multer.File, sectionId: string) {
    // 1. Validate Section Exists
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    // 2. Read Excel File
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Take first sheet
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0)
      throw new BadRequestException('Excel sheet is empty');

    // 3. Transaction: Create all questions or fail completely
    return this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const row of rows) {
        // Expected Columns in Excel:
        // "Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Marks", "Explanation"

        // Prepare Options Array
        const options = [
          row['Option A'],
          row['Option B'],
          row['Option C'],
          row['Option D'],
        ].filter((o) => o !== undefined && o !== null && o !== '');

        // Determine Correct Answer Index (A=0, B=1, etc.)
        const correctMap: Record<string, number> = {
          A: 0,
          B: 1,
          C: 2,
          D: 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
          '1': 0,
          '2': 1,
          '3': 2,
          '4': 3,
        };
        const correctKey = row['Correct Answer']?.toString().trim();
        const correctIndex = correctMap[correctKey] ?? 0; // Default to A if invalid

        // Create Question
        await tx.question.create({
          data: {
            correctAnswer: correctIndex,
            hash: Buffer.from(
              `${row['Question']}_${Date.now()}_${Math.random()}_${count}_${randomUUID()}`,
            )
              .toString('base64')
              .substring(0, 32),
            // Link to Section
            sectionLinks: {
              create: {
                sectionId: sectionId,
                order: count + 1, // Simple ordering
              },
            },
            // Add Content (Translation)
            translations: {
              create: {
                lang: 'en',
                content: row['Question'],
                options: options,
                explanation: row['Explanation'] || null,
              },
            },
          },
        });
        count++;
      }
      return { success: true, count };
    });
  }

  // Helper method to generate hash
  private generateHash(content: string): string {
    // Simple hash generation - in production, use crypto
    return Buffer.from(content).toString('base64').substring(0, 32);
  }
}
