import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Assessment (Attempts)')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Student starts a test' })
  start(@Body() createAttemptDto: CreateAttemptDto) {
    return this.attemptsService.start(createAttemptDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Student submits answers & gets score' })
  submit(@Param('id') id: string, @Body() submitAttemptDto: SubmitAttemptDto) {
    return this.attemptsService.submit(id, submitAttemptDto);
  }

  @Get(':id/review')
  @ApiOperation({ summary: 'Get full solutions and analysis (After Submit)' })
  getReview(@Param('id') id: string) {
    return this.attemptsService.getReview(id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get the scorecard' })
  findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
  }

  @Get()
  findAll() {
    return this.attemptsService.findAll();
  }
}
