import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    // 🛡️ CASE-INSENSITIVE: Check for existing subject
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        name: {
          equals: dto.name,
          mode: 'insensitive',
        },
        isActive: true,
      },
    });

    if (existingSubject) {
      throw new Error(`Subject "${dto.name}" already exists`);
    }

    return this.prisma.subject.create({
      data: {
        name: dto.name.trim(),
        isActive: true,
      },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            topics: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        topics: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  update(id: string, dto: UpdateSubjectDto) {
    // 🛡️ CASE-INSENSITIVE: Check if new name conflicts with existing subjects
    if (dto.name) {
      return this.prisma.$transaction(async (tx) => {
        const existingSubject = await tx.subject.findFirst({
          where: {
            name: {
              equals: dto.name,
              mode: 'insensitive',
            },
            isActive: true,
            id: {
              not: id, // Exclude current subject
            },
          },
        });

        if (existingSubject) {
          throw new Error(`Subject "${dto.name}" already exists`);
        }

        return tx.subject.update({
          where: { id },
          data: {
            ...dto,
            name: dto.name?.trim() || dto.name,
          },
        });
      });
    }

    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    // 🛡️ SAFE DELETE: Check if subject has topics or questions
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject._count.topics > 0) {
      throw new Error(
        `Cannot delete subject "${subject.name}" because it has ${subject._count.topics} topics. Please delete the topics first.`,
      );
    }

    return this.prisma.subject.delete({ where: { id } });
  }
}
