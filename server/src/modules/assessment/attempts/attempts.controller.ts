import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface StartAttemptRequest {
  testId: string;
  userId: string;
}

@ApiTags('Assessment (Attempts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(Role.STUDENT)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Student starts a test' })
  start(@Body() createAttemptDto: CreateAttemptDto, @Request() req: any) {
    // Extract userId from JWT token instead of request body
    const userId = req.user.userId;
    return this.attemptsService.start({
      testId: createAttemptDto.testId,
      userId: userId,
    });
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Student submits answers & gets score' })
  submit(@Param('id') id: string, @Body() submitAttemptDto: SubmitAttemptDto) {
    return this.attemptsService.submit(id, submitAttemptDto);
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Get full solutions and analysis (After Submit)' })
  getReview(@Param('id') id: string) {
    return this.attemptsService.getReview(id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get the scorecard' })
  findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
  }

  @Patch(':id/answers')
  @ApiOperation({ summary: 'Save single answer during exam' })
  saveAnswer(
    @Param('id') id: string,
    @Body()
    body: {
      questionId: string;
      optionId: string | null;
      isMarkedForReview?: boolean;
    },
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.attemptsService.saveAnswer(
      id,
      body.questionId,
      body.optionId,
      userId,
      body.isMarkedForReview,
    );
  }

  @Patch(':id/answers/batch')
  @ApiOperation({ summary: 'Save multiple answers at once' })
  saveAnswersBatch(
    @Param('id') id: string,
    @Body()
    body: {
      answers: Array<{
        questionId: string;
        optionId: string | null;
        isMarkedForReview?: boolean;
      }>;
    },
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.attemptsService.saveAnswersBatch(id, body.answers, userId);
  }

  @Patch(':id/suspicious')
  @ApiOperation({ summary: 'Increment suspicious activity score' })
  incrementSuspicious(@Param('id') id: string) {
    return this.attemptsService.incrementSuspicious(id);
  }

  @Get()
  findAll() {
    return this.attemptsService.findAll();
  }
}
