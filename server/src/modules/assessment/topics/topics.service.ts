import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTopicDto) {
    const data: any = { name: dto.name };
    if (dto.subjectId) data.subjectId = dto.subjectId;
    if (dto.parentId) data.parentId = dto.parentId;
    return this.prisma.topic.create({ data });
  }

  findAll() {
    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        subject: true,
        parent: true,
        questions: {
          select: {
            id: true,
          },
        },
        userStats: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findBySubject(subjectId: string) {
    return this.prisma.topic.findMany({
      where: {
        subjectId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.topic.findUnique({
      where: { id },
      include: {
        subject: true,
        parent: true,
        questions: true,
        userStats: true,
      },
    });
  }

  update(id: string, dto: UpdateTopicDto) {
    return this.prisma.topic.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    return this.prisma.topic.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  remove(id: string) {
    return this.prisma.topic.delete({ where: { id } });
  }

  // Get unique subjects (updated for new schema)
  async getUniqueSubjects() {
    const subjects = await this.prisma.subject.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return subjects;
  }
}
