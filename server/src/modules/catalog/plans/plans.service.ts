import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: createPlanDto,
      include: {
        accesses: true,
        subscriptions: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' as const } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip,
        take: limit,
        include: {
          accesses: {
            include: {
              exam: true,
              series: true,
            },
          },
          subscriptions: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        accesses: {
          include: {
            exam: true,
            series: true,
          },
        },
        subscriptions: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    return this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
      include: {
        accesses: true,
        subscriptions: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.plan.delete({
      where: { id },
    });
  }
}
