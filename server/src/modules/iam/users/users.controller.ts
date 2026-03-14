import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Role, UserStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
    return {
      success: true,
      message: 'Users retrieved successfully',
      ...result,
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getStats() {
    const data = await this.usersService.getStats();
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data,
    };
  }

  // M-4 fix: Removed duplicate /me endpoints — they are already in StudentUsersController
  // ─── Admin Deep-Dive Endpoints ────────────────────────────────────────────────
  
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get detailed user profile including stats and history' })
  async getDeepProfile(@Param('id') id: string) {
    try {
      const data = await this.usersService.getDeepProfile(id);
      return {
        success: true,
        message: 'User profile retrieved successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve user profile',
      };
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (ACTIVE, SUSPENDED, BANNED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Request() req: any,
  ) {
    try {
      const data = await this.usersService.updateStatus(
        id,
        status,
        req.user?.userId,
        req.user?.role,
      );
      return {
        success: true,
        message: `User status updated to ${status}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update user status',
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    if (!data) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    return {
      success: true,
      message: 'User retrieved successfully',
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    try {
      const data = await this.usersService.create(
        createUserDto,
        req.user?.userId,
        req.user?.role,
      );
      return {
        success: true,
        message: 'User created successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create user',
      };
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.usersService.update(
        id,
        updateUserDto,
        req.user?.userId,
        req.user?.role,
      );
      return {
        success: true,
        message: 'User updated successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update user',
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    try {
      const data = await this.usersService.remove(
        id,
        req.user?.userId,
        req.user?.role,
      );
      return {
        success: true,
        message: 'User deleted successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete user',
      };
    }
  }

}
