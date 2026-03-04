import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        isActive: true,
      },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      where: {
        isActive: true,
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
    return this.prisma.subject.delete({ where: { id } });
  }
}
