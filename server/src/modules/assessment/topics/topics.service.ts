import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTopicDto) {
    // 🚨 DEBUGGING: Log the received data
    console.log('DEBUG: CreateTopicDto received:', dto);
    console.log('DEBUG: subjectId type:', typeof dto.subjectId);
    console.log('DEBUG: subjectId value:', dto.subjectId);
    console.log('DEBUG: subjectId length:', dto.subjectId?.length);

    // 🚨 CRITICAL: Subject is now required for topic creation
    if (!dto.subjectId) {
      throw new BadRequestException(
        'Subject ID is required. Every topic must belong to a subject.',
      );
    }

    // Validate subject exists and is active
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (!subject.isActive) {
      throw new Error('Cannot create topic under inactive subject');
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.topic.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.deletedAt) {
        throw new NotFoundException('Parent topic not found');
      }
    }

    const data: any = {
      name: dto.name.trim(),
      subjectId: dto.subjectId, // 🚨 CRITICAL: Always assign subject
    };

    if (dto.parentId) data.parentId = dto.parentId;

    return this.prisma.topic.create({ data });
  }

  findAll() {
    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        subjectId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            children: true,
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

  async remove(id: string) {
    // 🛡️ SAFE DELETE: Check if topic has questions or children
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            children: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic._count.questions > 0) {
      throw new Error(
        `Cannot delete topic "${topic.name}" because it has ${topic._count.questions} questions. Please reassign or delete the questions first.`,
      );
    }

    if (topic._count.children > 0) {
      throw new Error(
        `Cannot delete topic "${topic.name}" because it has ${topic._count.children} sub-topics. Please delete or reassign the sub-topics first.`,
      );
    }

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
