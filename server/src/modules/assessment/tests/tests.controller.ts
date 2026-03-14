import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Request,
  Response,
  Query,
  SetMetadata,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { LeaderboardService } from '../../analytics/leaderboard/leaderboard.service';
import { AttemptsService } from '../attempts/attempts.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Public } from '../../iam/auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Tests)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('tests')
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly leaderboardService: LeaderboardService,
    private readonly attemptsService: AttemptsService, // ← ADD THIS
  ) {}

  @Post('wizard')
  @ApiOperation({ summary: 'Create Test and Section in single transaction' })
  async createTestWithSection(@Body() createTestDto: CreateTestDto) {
    return this.testsService.createTestWithSection(createTestDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a specific Test Paper' })
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Tests' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('seriesId') seriesId?: string,
  ) {
    return this.testsService.findAll({ page, limit, search, seriesId });
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Toggle test publish status (God Mode feature)',
  })
  togglePublish(@Param('id') id: string, @Body() dto: { isLive: boolean }) {
    return this.testsService.togglePublish(id, dto.isLive);
  }

  @Post(':id/duplicate')
  @ApiOperation({
    summary:
      'Duplicate test with all sections and questions (God Mode feature)',
  })
  duplicateTest(@Param('id') id: string) {
    return this.testsService.duplicateTest(id);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export test to Excel' })
  async exportTest(@Param('id') id: string, @Res() res: any) {
    return this.testsService.exportTest(id, res);
  }

  @Get(':id/sections')
  @ApiOperation({ summary: 'Get test sections with questions' })
  getSections(@Param('id') id: string) {
    return this.testsService.getSections(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a test attempt' })
  async startTest(@Param('id') testId: string, @Request() req: any) {
    // Extract userId from JWT token
    const userId = req.user.userId;

    // Call attempts service to start the exam
    return this.attemptsService.start({
      testId,
      userId,
    });
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get leaderboard for this test' })
  getLeaderboard(@Param('id') testId: string) {
    // Delegate to the leaderboard service
    return this.leaderboardService.getTestLeaderboard(testId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Test Details (Duration, Marks)' })
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testsService.update(id, updateTestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a test' })
  async remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }
}
