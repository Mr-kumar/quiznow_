import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: {
        name: dto.name,
        subject: dto.subject,
      },
    });
  }

  findAll() {
    return this.prisma.topic.findMany({
      include: {
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

  findOne(id: string) {
    return this.prisma.topic.findUnique({
      where: { id },
      include: {
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

  remove(id: string) {
    return this.prisma.topic.delete({ where: { id } });
  }

  // Get unique subjects
  async getUniqueSubjects() {
    const topics = await this.prisma.topic.findMany({
      where: {
        subject: {
          not: null,
        },
      },
      select: {
        subject: true,
      },
      distinct: ['subject'],
    });

    return topics.map((topic) => topic.subject).filter(Boolean);
  }
}
