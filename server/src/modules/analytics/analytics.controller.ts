import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/auth/guards/roles.guard';
import { Roles } from '../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analytics')
// TODO: Re-enable authentication once JWT strategy is properly configured
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
  })
  async getDashboardMetrics() {
    const data = await this.analyticsService.getDashboardMetrics();
    return {
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats() {
    const data = await this.analyticsService.getUserStats();
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data,
    };
  }

  @Get('tests')
  @ApiOperation({ summary: 'Get test statistics' })
  @ApiResponse({
    status: 200,
    description: 'Test statistics retrieved successfully',
  })
  async getTestStats() {
    const data = await this.analyticsService.getTestStats();
    return {
      success: true,
      message: 'Test statistics retrieved successfully',
      data,
    };
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get attempt statistics' })
  @ApiResponse({
    status: 200,
    description: 'Attempt statistics retrieved successfully',
  })
  async getAttemptStats() {
    const data = await this.analyticsService.getAttemptStats();
    return {
      success: true,
      message: 'Attempt statistics retrieved successfully',
      data,
    };
  }
}
