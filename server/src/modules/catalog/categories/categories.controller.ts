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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Public } from '../../iam/auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Catalog (Categories)') // 👈 Groups this in Swagger
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new Category' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all Root Categories (with children)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // 🚀 NEW: Get Full Tree for Enterprise Syllabus Manager
  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get Full Recursive Tree (Enterprise Feature)' })
  async getFullTree() {
    return this.categoriesService.getFullTree();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details of one Category' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
