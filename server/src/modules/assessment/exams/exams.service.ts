import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Exam
  async create(dto: CreateExamDto) {
    // Optional: Check if Category exists first
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.exam.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // 2. Find All (With Category Name)
  findAll(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};

    return this.prisma.exam.findMany({
      where,
      include: {
        category: { select: { name: true } }, // Show "Civil Engineering" instead of just UUID
        _count: { select: { testSeries: true } }, // Count how many test series are inside
      },
    });
  }

  // 3. Find One
  findOne(id: string) {
    return this.prisma.exam.findUnique({
      where: { id },
      include: { category: true, testSeries: true },
    });
  }

  // 4. Update
  update(id: string, dto: UpdateExamDto) {
    return this.prisma.exam.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete with cascade handling
  async remove(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const testSeriesCount = await this.prisma.testSeries.count({
      where: { examId: id },
    });

    if (testSeriesCount > 0) {
      throw new BadRequestException(
        'Cannot delete exam: It contains test series. Please delete or move the test series first.',
      );
    }

    try {
      return await this.prisma.exam.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete exam: It is linked to test series. Please delete or move the test series first.',
        );
      }
      throw error;
    }
  }
}
