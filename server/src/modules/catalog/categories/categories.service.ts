import { Injectable } from '@nestjs/common';
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
          include: { _count: { select: { exams: true } } },
        },
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

  // 5. Delete
  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
