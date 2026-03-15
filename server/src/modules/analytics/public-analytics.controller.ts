import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Public } from '../iam/auth/decorators/public.decorator';

@ApiTags('Public Analytics')
@Controller('public/analytics')
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'Get public platform summary metrics' })
  async getPublicSummary() {
    const data = await this.analyticsService.getPublicSummary();
    return {
      success: true,
      data,
    };
  }
}
