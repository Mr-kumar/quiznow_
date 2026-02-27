import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

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
}
