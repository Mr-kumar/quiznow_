import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTestSeryDto } from './dto/create-test-sery.dto';
import { UpdateTestSeryDto } from './dto/update-test-sery.dto';

@Injectable()
export class TestSeriesService {
  constructor(private prisma: PrismaService) {}

  // 1. Create
  async create(dto: CreateTestSeryDto) {
    // Check if Exam exists first
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    return this.prisma.testSeries.create({
      data: {
        title: dto.title,
        examId: dto.examId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // 2. Find All
  findAll() {
    return this.prisma.testSeries.findMany({
      include: {
        exam: { select: { name: true } }, // Show "RRB JE 2026"
        _count: { select: { tests: true } }, // Count how many tests are inside
      },
    });
  }

  // 3. Find One
  findOne(id: string) {
    return this.prisma.testSeries.findUnique({
      where: { id },
      include: { exam: true, tests: true },
    });
  }

  // 4. Update
  update(id: string, dto: UpdateTestSeryDto) {
    return this.prisma.testSeries.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete
  remove(id: string) {
    return this.prisma.testSeries.delete({ where: { id } });
  }
}
