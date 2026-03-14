import { Controller, Get, Query, Param } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Public Test Series')
@Controller('public/test-series')
export class PublicTestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available test series (public)' })
  findAll(
    @Query('examId') examId?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: number,
  ) {
    return this.testSeriesService.findPublicSeries(examId, category, q, limit);
  }

  @Get('latest-tests')
  @ApiOperation({ summary: 'Get latest published tests (public)' })
  findLatestTests(@Query('limit') limit?: number) {
    return this.testSeriesService.findLatestTests(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of one test series (public)' })
  findOne(@Param('id') id: string) {
    return this.testSeriesService.findPublicOne(id);
  }
}
