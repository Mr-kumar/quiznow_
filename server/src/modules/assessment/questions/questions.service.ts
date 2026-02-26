import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

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

  // Helper method to generate hash
  private generateHash(content: string): string {
    // Simple hash generation - in production, use crypto
    return Buffer.from(content).toString('base64').substring(0, 32);
  }
}
