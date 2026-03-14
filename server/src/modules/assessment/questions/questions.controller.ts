import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
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

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE ORDERING RULES (NestJS / Express)
//
// NestJS registers routes in the order they are defined. A parameterized
// segment like `:id` acts as a wildcard — it matches ANY string including
// "cursor-paginated", "public", "bulk-tag", etc.
//
// Rule: ALL specific named routes (no dynamic segment) MUST be defined
// BEFORE the parameterized wildcard routes, or they will never be reached.
//
// Correct order per HTTP method:
//   GET:   paginated → cursor-paginated → public → '' → :id
//   POST:  upload → validate-bulk-file → import-bulk-file → inject-questions/:id → ''
//   PATCH: bulk-tag → :id/soft-delete → :id
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Assessment (Questions)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // ── GET: specific named routes first ─────────────────────────────────────

  @Roles(Role.ADMIN, Role.STUDENT)
  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated questions (cursor-based)' })
  async getPaginatedQuestions(
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 50,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('topic') topic?: string,
  ) {
    return this.questionsService.findWithCursor({
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      search,
      subject,
      topicId: topic,
    });
  }

  // ✅ FIX: Moved ABOVE @Get(':id') — previously shadowed by the :id wildcard.
  // GET /questions/cursor-paginated was matching @Get(':id') and returning a
  // "question not found" error instead of the paginated list.
  @Get('cursor-paginated')
  @Roles(Role.ADMIN, Role.STUDENT)
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
    if (limit > 100) {
      throw new BadRequestException('Maximum limit is 100 questions per page');
    }

    const where: any = {};
    if (search) {
      where.translations = {
        some: {
          // ✅ FIX: uppercase 'EN' matches the Language enum stored in DB.
          // lowercase 'en' returns zero results even when questions exist.
          lang: 'EN',
          content: { contains: search, mode: 'insensitive' },
        },
      };
    }
    if (topicId) where.topicId = topicId;
    if (subject) {
      where.topic = {
        subject: { name: { contains: subject, mode: 'insensitive' } },
      };
    }

    const orderBy = direction === 'backward' ? { id: 'desc' } : { id: 'asc' };
    const cursorObj = cursor ? { id: cursor } : undefined;

    const questions = await this.questionsService.findWithCursor({
      cursor: cursorObj,
      take: limit,
      skip: cursor ? 1 : 0,
      where,
      orderBy,
      topicId, // Explicitly pass topicId to ensure it's filtered correctly
    });

    const metadata = await this.questionsService.getCursorMetadata(
      questions,
      limit,
    );
    const nextCursor =
      questions.length > 0 ? questions[questions.length - 1].id : null;
    const prevCursor = cursor ? questions[0]?.id : null;

    return {
      data: questions,
      pagination: {
        nextCursor,
        prevCursor,
        hasMore: metadata.hasMore,
        hasPrevious: !!prevCursor,
        limit,
      },
    };
  }

  // ✅ FIX: Moved ABOVE @Get(':id') — was being shadowed by the :id wildcard.
  @Get('public')
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Public list of Questions (for testing)' })
  publicFindAll() {
    return this.questionsService.findAll();
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all Questions' })
  findAll() {
    return this.questionsService.findAll();
  }

  // ── GET: wildcard (must be last) ──────────────────────────────────────────

  @Get(':id')
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Get Question Details' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  // ── POST: specific named routes first ────────────────────────────────────

  @Post('upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk upload questions via Excel' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // ✅ FIX: documented as CUID string (not uuid format)
        sectionId: { type: 'string', description: 'Section CUID' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadQuestions(
    @UploadedFile() file: Express.Multer.File,
    // ✅ FIX: Removed ParseUUIDPipe. Section IDs are CUIDs (e.g. clx1y2z3...),
    // not UUIDs. ParseUUIDPipe rejects every valid CUID with 400 Validation failed.
    @Body('sectionId') sectionId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.questionsService.bulkUpload(file, sectionId);
  }

  @Post('validate-bulk-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Dry-run validate an Excel file — returns row errors + 5-row preview. No DB writes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topicId: { type: 'string', description: 'Optional default topic CUID' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async validateBulkFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('topicId') topicId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.questionsService.validateBulkFile(file.buffer, topicId);
  }

  @Post('import-bulk-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Validate + commit an Excel file. Rejects entirely if any row has errors (strict mode).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topicId: { type: 'string' },
        onlyValid: { type: 'boolean', default: true },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importBulkFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('topicId') topicId?: string,
    @Body('onlyValid') onlyValid: boolean = true,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.questionsService.importBulkFile(
      file.buffer,
      topicId,
      onlyValid,
    );
  }

  @Post('inject-questions/:sectionId')
  @ApiOperation({
    summary: 'Inject questions from Question Bank into a section',
  })
  async injectQuestions(
    // ✅ FIX: Removed ParseUUIDPipe — sectionId is a CUID, not a UUID.
    @Param('sectionId') sectionId: string,
    @Body() body: any,
  ) {
    const questionIds = Array.isArray(body?.questionIds)
      ? body.questionIds
      : [body.questionIds].filter(Boolean);

    // ✅ FIX: Arguments were reversed in the original code.
    // Service signature: injectQuestionsIntoSection(questionIds: string[], sectionId?: string)
    // Original: injectQuestionsIntoSection(sectionId, questionIds) ← wrong
    // Fixed:    injectQuestionsIntoSection(questionIds, sectionId) ← correct
    return this.questionsService.injectQuestionsIntoSection(
      questionIds,
      sectionId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a Question within a Section' })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  // ── PATCH: specific named routes first ───────────────────────────────────

  // ✅ FIX: Moved ABOVE @Patch(':id') — was being shadowed by the :id wildcard.
  // PATCH /questions/bulk-tag was matching @Patch(':id') and treating "bulk-tag"
  // as a question ID, causing a "question not found" error.
  @Patch('bulk-tag')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk assign topic to multiple questions' })
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

  // This has a compound path (':id/soft-delete') so NestJS distinguishes it from
  // bare ':id'. Keeping it before ':id' is still the safe practice.
  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete question (hides but preserves history)',
  })
  softDelete(@Param('id') id: string) {
    return this.questionsService.softDelete(id);
  }

  // ── PATCH: wildcard (must be last) ────────────────────────────────────────

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
