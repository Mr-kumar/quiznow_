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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Sections)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a Section within a Test' })
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Sections' })
  findAll() {
    return this.sectionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Section Details' })
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionsService.update(id, updateSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }

  @Post(':id/link-questions')
  @ApiOperation({ summary: 'Link existing questions from Vault to Section' })
  linkQuestions(
    @Param('id') id: string,
    @Body() dto: { questionIds: string[] },
  ) {
    return this.sectionsService.linkExistingQuestions(id, dto.questionIds);
  }
}
