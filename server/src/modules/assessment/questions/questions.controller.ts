import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
  UseGuards,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { UploadedFile } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Questions)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('paginated')
  @ApiOperation({
    summary:
      'Get paginated questions using cursor-based pagination (O(1) time complexity)',
  })
  async getPaginatedQuestions(
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 50,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('topic') topic?: string,
  ) {
    return this.questionsService.getPaginatedQuestions({
      cursor,
      limit,
      search,
      subject,
      topic,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all Questions' })
  findAll() {
    return this.questionsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a Question within a Section' })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  // Public endpoint for testing
  @Get('public')
  @ApiOperation({ summary: 'Public list of Questions (for testing)' })
  publicFindAll() {
    return this.questionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Question Details' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete question (hides but preserves history)',
  })
  softDelete(@Param('id') id: string) {
    return this.questionsService.softDelete(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk upload questions via Excel' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sectionId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Body('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.questionsService.bulkUpload(file, sectionId);
  }

  @Post('inject-questions/:sectionId')
  @ApiOperation({
    summary: 'Inject questions from Question Bank into a section',
  })
  async injectQuestions(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() body: any,
  ) {
    const questionIds = Array.isArray(body?.questionIds)
      ? body.questionIds
      : [];
    return this.questionsService.injectQuestionsIntoSection(
      sectionId,
      questionIds,
    );
  }

  @Patch('bulk-tag')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk tag questions with topic (God Mode feature)' })
  async bulkTag(
    @Body('questionIds') questionIds: string[],
    @Body('topicId') topicId: string,
  ): Promise<{ success: boolean; updatedCount?: number }> {
    if (!questionIds || !topicId) {
      throw new BadRequestException(
        'Must provide questionIds array and a topicId',
      );
    }
    const result = await this.questionsService.bulkTagQuestions(
      questionIds,
      topicId,
    );
    return { success: true, updatedCount: result.count };
  }

  @Get('cursor-paginated')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get questions with cursor-based pagination (Enterprise Scale)',
  })
  async getCursorPaginated(
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 50,
    @Query('direction') direction: 'forward' | 'backward' = 'forward',
    @Query('search') search?: string,
    @Query('topicId') topicId?: string,
    @Query('subject') subject?: string,
  ) {
    // Validate limit
    if (limit > 100) {
      throw new BadRequestException('Maximum limit is 100 questions per page');
    }

    // Build where conditions
    const where: any = {};
    if (search) {
      where.translations = {
        some: {
          lang: 'en',
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      };
    }
    if (topicId) {
      where.topicId = topicId;
    }
    if (subject) {
      where.topic = {
        subject: {
          name: {
            contains: subject,
            mode: 'insensitive',
          },
        },
      };
    }

    // Determine order based on direction
    const orderBy = direction === 'backward' ? { id: 'desc' } : { id: 'asc' };

    // Build cursor
    const cursorObj = cursor ? { id: cursor } : undefined;

    // Get questions
    const questions = await this.questionsService.findWithCursor({
      cursor: cursorObj,
      take: limit,
      skip: cursor ? 1 : 0,
      where,
      orderBy,
    });

    // Get metadata (OPTIMIZED - No slow count queries)
    const metadata = await this.questionsService.getCursorMetadata(
      questions,
      limit,
      direction,
    );

    // Determine next/previous cursors
    const nextCursor =
      questions.length > 0 ? questions[questions.length - 1].id : null;
    const prevCursor = cursor ? questions[0]?.id : null;

    return {
      data: questions,
      pagination: {
        nextCursor,
        prevCursor,
        hasMore: metadata.hasMore,
        hasPrevious: !!prevCursor, // Simple check - if there's a previous cursor, we have previous data
        // 🚨 FIX 4: Remove count-based metadata for performance
        // total: 0, // Not needed for cursor pagination
        // totalPages: 0, // Not needed for cursor pagination
        // currentPage: 0, // Not needed for cursor pagination
        limit,
      },
    };
  }
}
