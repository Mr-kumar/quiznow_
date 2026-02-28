import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  // 🚀 NEW: Atomic Test + Section Creation (Fixes "Orphan Test" issue)
  async createTestWithSection(dto: CreateTestDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Series exists
      const series = await tx.testSeries.findUnique({
        where: { id: dto.testSeriesId },
      });
      if (!series) throw new NotFoundException('Test Series not found');

      // 2. Create Test
      const test = await tx.test.create({
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

      // 3. Create Default Section (Atomic - if this fails, test creation rolls back)
      const section = await tx.section.create({
        data: {
          testId: test.id,
          name: 'General Section',
          order: 1,
        },
      });

      return {
        test,
        section,
      };
    });
  }

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

  // 🚀 NEW: Publish Toggle (God Mode Feature)
  async togglePublish(id: string, isLive: boolean) {
    return this.prisma.test.update({
      where: { id },
      data: { isLive },
    });
  }

  // 📋 NEW: Duplicate Test (God Mode Feature)
  async duplicateTest(id: string) {
    const originalTest = await this.prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!originalTest) {
      throw new Error('Test not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create duplicate test
      const duplicatedTest = await tx.test.create({
        data: {
          title: `${originalTest.title} (Copy)`,
          durationMins: originalTest.durationMins,
          totalMarks: originalTest.totalMarks,
          passMarks: originalTest.passMarks,
          negativeMark: originalTest.negativeMark,
          seriesId: originalTest.seriesId,
          isLive: false, // Start as draft
          isPremium: originalTest.isPremium,
          isActive: true,
        },
      });

      // Duplicate sections and questions
      for (const section of originalTest.sections) {
        const duplicatedSection = await tx.section.create({
          data: {
            testId: duplicatedTest.id,
            name: section.name,
            order: section.order,
          },
        });

        // Link questions to new section
        if (section.questions.length > 0) {
          const sectionQuestions = section.questions.map((sq, index) => ({
            sectionId: duplicatedSection.id,
            questionId: sq.questionId,
            order: index + 1,
          }));

          await tx.sectionQuestion.createMany({
            data: sectionQuestions,
          });
        }
      }

      return duplicatedTest;
    });
  }

  // 📊 NEW: Export Test (God Mode Feature)
  async exportTest(id: string, res: any) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    translations: true,
                    topic: true,
                  },
                },
              },
            },
          },
        },
        series: true,
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    // Create Excel export
    const workbook = XLSX.utils.book_new();

    for (const section of test.sections) {
      const worksheetData = [
        [
          'Question',
          'Option A',
          'Option B',
          'Option C',
          'Option D',
          'Correct Answer',
          'Subject',
          'Topic',
        ],
      ];

      // Add questions
      for (const sq of section.questions) {
        const translation = sq.question.translations[0];
        worksheetData.push([
          translation?.content || '',
          translation?.options?.[0] || '',
          translation?.options?.[1] || '',
          translation?.options?.[2] || '',
          translation?.options?.[3] || '',
          ['A', 'B', 'C', 'D'][sq.question.correctAnswer] || '',
          sq.question.topic?.subject || '',
          sq.question.topic?.name || '',
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, section.name);
    }

    // Generate and send file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${test.title.replace(/\s+/g, '_')}_export.xlsx"`,
    );
    res.send(buffer);
  }

  // 5. Delete
  remove(id: string) {
    return this.prisma.test.delete({ where: { id } });
  }
}
