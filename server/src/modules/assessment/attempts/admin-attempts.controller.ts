import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Admin Attempts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/attempts')
export class AdminAttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('test/:testId')
  @ApiOperation({ summary: 'Admin: Get all attempts for a specific test' })
  findAllByTest(
    @Param('testId') testId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.attemptsService.findAllByTest(testId, pageNum, limitNum);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete an attempt' })
  deleteAttempt(@Param('id') id: string) {
    return this.attemptsService.deleteAttempt(id);
  }
}
