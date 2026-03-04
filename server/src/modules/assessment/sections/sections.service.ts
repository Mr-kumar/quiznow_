import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 🚨 LIVE EDIT SHIELD: Prevents editing sections of live tests
   */
  private async validateTestNotLive(sectionId: string, operation: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        test: { select: { id: true, isLive: true, title: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.test.isLive) {
      throw new BadRequestException(
        `Cannot ${operation} questions in a live test. Please turn off the test "${section.test.title}" before making changes. This protects active student sessions from crashing.`,
      );
    }
  }

  async create(dto: CreateSectionDto) {
    const test = await this.prisma.test.findUnique({
      where: { id: dto.testId },
    });
    if (!test) throw new NotFoundException('Test not found');

    return this.prisma.section.create({
      data: {
        name: dto.name,
        testId: dto.testId,
        durationMins: dto.durationMins,
        order: dto.order,
      },
    });
  }

  findAll() {
    return this.prisma.section.findMany({
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.section.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  update(id: string, dto: UpdateSectionDto) {
    return this.prisma.section.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.section.delete({ where: { id } });
  }

  // 🗝️ NEW: Vault Linking API (Fixes "Missing Linker" issue)
  async linkExistingQuestions(sectionId: string, questionIds: string[]) {
    // 🚨 LIVE EDIT SHIELD: Prevent linking questions to live tests
    await this.validateTestNotLive(sectionId, 'link questions to');

    // This creates lightweight links without duplicating questions!
    const links = questionIds.map((qId, index) => ({
      sectionId,
      questionId: qId,
      order: index + 1, // Keep them in order
    }));

    return this.prisma.sectionQuestion.createMany({
      data: links,
      skipDuplicates: true, // If already linked, ignore!
    });
  }

  // 🔄 NEW: Question Reordering (God Mode Feature)
  async reorderQuestions(
    sectionId: string,
    questionOrders: { questionId: string; order: number }[],
  ) {
    const updates = questionOrders.map(({ questionId, order }) =>
      this.prisma.sectionQuestion.updateMany({
        where: {
          sectionId,
          questionId,
        },
        data: {
          order,
        },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  // NEW: Unlink Question from Section (God Mode Feature)
  async unlinkQuestion(sectionId: string, questionId: string) {
    // 🚨 LIVE EDIT SHIELD: Prevent unlinking questions from live tests
    await this.validateTestNotLive(sectionId, 'unlink questions from');

    try {
      return await this.prisma.sectionQuestion.delete({
        where: {
          sectionId_questionId: {
            sectionId,
            questionId,
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(
        'Failed to unlink question. It might not exist in this section.',
      );
    }
  }

  // NEW: Reorder Questions in Section (God Mode Feature)
  async reorderQuestionsInSection(
    sectionId: string,
    orderedQuestionIds: string[],
  ) {
    // We use a massive transaction to update all orders instantly
    const updates = orderedQuestionIds.map((qId, index) =>
      this.prisma.sectionQuestion.update({
        where: {
          sectionId_questionId: { sectionId, questionId: qId },
        },
        data: {
          order: index + 1, // 1st item gets order 1, 2nd gets order 2, etc.
        },
      }),
    );

    return this.prisma.$transaction(updates);
  }
}
