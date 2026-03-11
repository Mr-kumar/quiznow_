import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@ApiTags('Student Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class StudentUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/attempts')
  @ApiOperation({ summary: 'Get current user attempts' })
  @ApiResponse({
    status: 200,
    description: 'User attempts retrieved successfully',
  })
  async getMyAttempts(@Request() req: any) {
    const userId = req.user.userId;
    const data = await this.usersService.getMyAttempts(userId);
    return {
      success: true,
      message: 'User attempts retrieved successfully',
      data,
    };
  }

  @Get('me/topic-stats')
  @ApiOperation({ summary: 'Get current user topic statistics' })
  @ApiResponse({
    status: 200,
    description: 'User topic statistics retrieved successfully',
  })
  async getMyTopicStats(@Request() req: any) {
    const userId = req.user.userId;
    const data = await this.usersService.getMyTopicStats(userId);
    return {
      success: true,
      message: 'User topic statistics retrieved successfully',
      data,
    };
  }

  @Get('me/subscription')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({
    status: 200,
    description: 'User subscription retrieved successfully',
  })
  async getMySubscription(@Request() req: any) {
    const userId = req.user.userId;
    const data = await this.usersService.getMySubscription(userId);
    return {
      success: true,
      message: 'User subscription retrieved successfully',
      data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getMyProfile(@Request() req: any) {
    const userId = req.user.userId;
    const data = await this.usersService.findOne(userId);
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data,
    };
  }
}
