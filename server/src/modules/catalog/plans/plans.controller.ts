import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req as Request,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AddPlanAccessDto } from './dto/add-plan-access.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Plans (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Post()
  create(@Body() createPlanDto: CreatePlanDto, @Request() req: any) {
    return this.plansService.create(
      createPlanDto,
      req.user?.userId,
      req.user?.role,
    );
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.plansService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Request() req: any,
  ) {
    return this.plansService.update(
      id,
      updatePlanDto,
      req.user?.userId,
      req.user?.role,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.plansService.delete(id, req.user?.userId, req.user?.role);
  }

  @Post(':id/access')
  addAccess(
    @Param('id') id: string,
    @Body() dto: AddPlanAccessDto,
    @Request() req: any,
  ) {
    return this.plansService.addAccess(
      id,
      dto,
      req.user?.userId,
      req.user?.role,
    );
  }

  @Delete(':id/access/:accessId')
  removeAccess(
    @Param('accessId') accessId: string,
    @Request() req: any,
  ) {
    return this.plansService.removeAccess(
      accessId,
      req.user?.userId,
      req.user?.role,
    );
  }

  @Get(':id/access')
  getPlanAccesses(@Param('id') id: string) {
    return this.plansService.getPlanAccesses(id);
  }
}
