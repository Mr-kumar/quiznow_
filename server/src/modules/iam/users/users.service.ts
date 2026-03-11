import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // If updating email, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, students, instructors, admins, newThisMonth] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return {
      total,
      students,
      instructors,
      admins,
      newThisMonth,
    };
  }

  // ─── User-specific methods ─────────────────────────────────────────────────────

  async getMyAttempts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId },
        include: {
          test: {
            include: {
              series: {
                include: {
                  exam: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attempt.count({ where: { userId } }),
    ]);

    // Map to AttemptSummary shape expected by the client
    const data = attempts.map((a: any) => ({
      attemptId: String(a.id),
      testId: a.testId,
      testTitle: a.test?.title ?? 'Unknown Test',
      seriesTitle: a.test?.series?.title ?? '',
      examName: a.test?.series?.exam?.name ?? '',
      attemptNumber: a.attemptNumber,
      status: a.status,
      score: a.score ?? 0,
      totalMarks: a.test?.totalMarks ?? 0,
      accuracy: a.accuracy,
      timeTaken: a.timeTaken,
      startTime: a.startTime?.toISOString() ?? a.createdAt?.toISOString(),
      endTime: a.endTime?.toISOString() ?? null,
    }));

    return { data, total, page, limit };
  }

  async getMyTopicStats(userId: string) {
    return this.prisma.userTopicStat.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { correct: 'desc' },
    });
  }

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: { expiresAt: 'desc' },
    });
  }
}
