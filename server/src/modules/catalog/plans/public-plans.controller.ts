import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Plans (Public)')
@Controller('plans/public')
export class PublicPlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available plans (public)' })
  findAll() {
    return this.plansService.findPublicPlans();
  }
}
