import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a Category
  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        parentId: dto.parentId || null, // If empty, it's a Root Category
        isActive: dto.isActive ?? true,
      },
    });
  }

  // 2. Get All (Grouped by Root)
  findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null }, // Fetch only top-level (e.g. Engineering)
      include: {
        children: {
          // Fetch their kids (e.g. Civil, CS)
          include: {
            _count: { select: { exams: true } },
            children: {
              include: { _count: { select: { exams: true } } },
            },
          },
        },
      },
    });
  }

  // NEW: Get Full Recursive Tree for Enterprise Hierarchy
  async getFullTree() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true }, // Start strictly at Root (e.g. Railways)
      include: {
        children: {
          // Fetches Level 2 (e.g. RRB JE Exam)
          include: {
            children: {
              // Fetches Level 3 (e.g. Math Subject)
              include: {
                children: true, // Fetches Level 4 (e.g. Algebra Topic)
              },
            },
            _count: { select: { exams: true } },
          },
        },
        _count: { select: { exams: true } },
      },
    });
  }

  // 3. Get One (Details)
  findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { children: true, exams: true },
    });
  }

  // 4. Update
  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  // 5. Delete with cascade handling
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [examCount, childCount] = await this.prisma.$transaction([
      this.prisma.exam.count({ where: { categoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ]);

    if (examCount > 0) {
      throw new BadRequestException(
        'Cannot delete category: It contains exams. Please delete or move the exams first.',
      );
    }

    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete category: It contains sub-categories. Please delete or move the sub-categories first.',
      );
    }

    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete category: It is linked to exams. Please delete or move the exams first.',
        );
      }
      throw error;
    }
  }
}
