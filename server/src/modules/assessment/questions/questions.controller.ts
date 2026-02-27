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

// DTO for question injection
class InjectQuestionsDto {
  questionIds: string[];
}

@ApiTags('Assessment (Questions)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

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

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated questions with filters' })
  async getPaginatedQuestions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('topic') topic?: string,
  ) {
    return this.questionsService.getPaginatedQuestions({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      subject,
      topic,
    });
  }

  @Post('inject-questions/:sectionId')
  @ApiOperation({
    summary: 'Inject questions from Question Bank into a section',
  })
  async injectQuestions(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() injectQuestionsDto: InjectQuestionsDto,
  ) {
    return this.questionsService.injectQuestionsIntoSection(
      sectionId,
      injectQuestionsDto.questionIds,
    );
  }
}
