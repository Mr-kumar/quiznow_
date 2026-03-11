import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { AttemptsService } from '../attempts/attempts.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@ApiTags('Public Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student/tests')
export class PublicTestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly attemptsService: AttemptsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get available tests for students' })
  async findAvailableTests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('seriesId') seriesId?: string,
    @Request() req?: any,
  ) {
    // Get tests that are active and available for the user's subscription
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    const tests = await this.testsService.findAvailableForStudents(
      pageNum,
      limitNum,
      search,
      seriesId,
      req?.user?.userId,
    );

    return {
      success: true,
      message: 'Tests retrieved successfully',
      data: tests,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get test details for students' })
  async findOne(@Param('id') id: string, @Request() req?: any) {
    const test = await this.testsService.findOneForStudents(
      id,
      req?.user?.userId,
    );

    if (!test) {
      return {
        success: false,
        message: 'Test not found or not available',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Test retrieved successfully',
      data: test,
    };
  }

  @Get(':id/sections')
  @ApiOperation({ summary: 'Get test sections for students' })
  async getSections(@Param('id') id: string, @Request() req?: any) {
    const sections = await this.testsService.getSectionsForStudents(
      id,
      req?.user?.userId,
    );

    return {
      success: true,
      message: 'Sections retrieved successfully',
      data: sections,
    };
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a test attempt' })
  async startTest(@Param('id') testId: string, @Request() req: any) {
    const userId = req.user.userId;

    const attempt = await this.attemptsService.start({
      testId,
      userId,
    });

    return {
      success: true,
      message: 'Test started successfully',
      data: attempt,
    };
  }
}
