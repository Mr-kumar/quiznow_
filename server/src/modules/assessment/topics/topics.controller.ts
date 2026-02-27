import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Topics)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new topic' })
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  findAll() {
    return this.topicsService.findAll();
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all unique subjects' })
  getUniqueSubjects() {
    return this.topicsService.getUniqueSubjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update topic' })
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete topic' })
  remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
