import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      action,
    );
  }

  @Get('actor/:actorId')
  getByActor(
    @Param('actorId') actorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogsService.getByActor(
      actorId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('cleanup')
  cleanup(@Body() body: { daysOld?: number }) {
    return this.auditLogsService.deleteOldLogs(body.daysOld || 90);
  }
}
