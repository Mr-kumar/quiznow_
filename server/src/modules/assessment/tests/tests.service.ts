import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Test
  async create(dto: CreateTestDto) {
    // Validate Series exists
    const series = await this.prisma.testSeries.findUnique({
      where: { id: dto.testSeriesId },
    });
    if (!series) throw new NotFoundException('Test Series not found');

    return this.prisma.test.create({
      data: {
        title: dto.title,
        seriesId: dto.testSeriesId,
        durationMins: dto.duration,
        totalMarks: dto.totalMarks,
        passMarks: dto.passingMarks,
        negativeMark: dto.negativeMarking,
        isActive: true,
      },
    });
  }

  // 2. Find All (Include Series Title)
  findAll() {
    return this.prisma.test.findMany({
      include: {
        series: { select: { title: true } },
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  // 3. Find One
  findOne(id: string) {
    return this.prisma.test.findUnique({
      where: { id },
      include: { series: true, sections: { include: { questions: true } } },
    });
  }

  // 4. Update
  update(id: string, dto: UpdateTestDto) {
    return this.prisma.test.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete
  remove(id: string) {
    return this.prisma.test.delete({ where: { id } });
  }
}
