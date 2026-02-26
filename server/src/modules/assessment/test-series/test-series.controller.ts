import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { CreateTestSeryDto } from './dto/create-test-sery.dto';
import { UpdateTestSeryDto } from './dto/update-test-sery.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Assessment (Test Series)')
@Controller('test-series')
export class TestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a Test Series' })
  create(@Body() createTestSeryDto: CreateTestSeryDto) {
    return this.testSeriesService.create(createTestSeryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all Test Series' })
  findAll() {
    return this.testSeriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of one Series' })
  findOne(@Param('id') id: string) {
    return this.testSeriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTestSeryDto: UpdateTestSeryDto,
  ) {
    return this.testSeriesService.update(id, updateTestSeryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testSeriesService.remove(id);
  }
}
