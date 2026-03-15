import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Public } from '../../iam/auth/decorators/public.decorator';

@ApiTags('Public Categories')
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List root categories (paginated) with counts' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 24,
    @Query('q') q?: string,
  ) {
    const p = Number(page) || 1;
    const l = Math.min(Number(limit) || 24, 48);

    const where: any = {
      parentId: null,
      isActive: true,
    };
    if (q && q.trim()) {
      where.name = { contains: q.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          _count: {
            select: { exams: true, children: true },
          },
          children: {
            select: {
              id: true,
              name: true,
              _count: { select: { exams: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.category.count({ where }),
    ]);

    // Summarize counts (root exams + direct children exams)
    const data = items.map((c) => {
      const childExamSum = (c.children ?? []).reduce(
        (sum, ch) => sum + (ch._count?.exams ?? 0),
        0,
      );
      return {
        id: c.id,
        name: c.name,
        counts: {
          exams: (c._count?.exams ?? 0) + childExamSum,
          children: c._count?.children ?? (c.children?.length ?? 0),
        },
        children: (c.children ?? []).map((ch) => ({
          id: ch.id,
          name: ch.name,
          exams: ch._count?.exams ?? 0,
        })),
      };
    });

    return {
      success: true,
      data,
      pagination: { page: p, limit: l, total },
    };
  }
}
