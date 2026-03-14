import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Public } from '../../iam/auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Subjects)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new Subject' })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Roles(Role.ADMIN, Role.STUDENT)
  @Get()
  @ApiOperation({ summary: 'Get all active Subjects' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Roles(Role.ADMIN, Role.STUDENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get Subject with Topics' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update Subject' })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete Subject' })
  softDelete(@Param('id') id: string) {
    return this.subjectsService.softDelete(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete Subject' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
