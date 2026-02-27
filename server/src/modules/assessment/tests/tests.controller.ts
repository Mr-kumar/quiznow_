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
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Assessment (Tests)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post('wizard')
  @ApiOperation({ summary: 'Create Test and Section in single transaction' })
  async createTestWithSection(@Body() createTestDto: CreateTestDto) {
    return this.testsService.createTestWithSection(createTestDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a specific Test Paper' })
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Tests' })
  findAll() {
    return this.testsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Test Details (Duration, Marks)' })
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testsService.update(id, updateTestDto);
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Toggle test publish status (God Mode feature)',
  })
  togglePublish(@Param('id') id: string, @Body() dto: { isLive: boolean }) {
    return this.testsService.togglePublish(id, dto.isLive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }
}
