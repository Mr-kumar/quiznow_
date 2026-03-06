import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/auth/guards/roles.guard';
import { Roles } from '../../iam/auth/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';
import {
  AuditLogQueryDto,
  CreateAuditLogDto,
  PaginatedAuditLogsResponse,
} from './dto';

@ApiTags('Admin — Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  // ── GET /admin/audit-logs ─────────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'List audit logs',
    description:
      'Returns paginated audit logs. Supports filtering by action, targetType, actorId, and full-text search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit log entries',
  })
  findAll(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogsResponse> {
    return this.auditLogsService.findAll(query);
  }

  // ── GET /admin/audit-logs/stats ───────────────────────────────────────────
  @Get('stats')
  @ApiOperation({
    summary: 'Get audit log action counts',
    description:
      'Returns top 20 actions grouped by frequency. Useful for admin dashboards.',
  })
  @ApiResponse({ status: 200, description: 'Action frequency breakdown' })
  getStats(): Promise<{ action: string; count: number }[]> {
    return this.auditLogsService.getStats();
  }

  // ── GET /admin/audit-logs/:id ─────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single audit log entry with full metadata',
  })
  @ApiParam({ name: 'id', description: 'Audit log CUID' })
  @ApiResponse({
    status: 200,
    description: 'Full audit log record including metadata',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }

  // ── GET /admin/audit-logs/actor/:actorId ──────────────────────────────────
  @Get('actor/:actorId')
  @ApiOperation({
    summary: 'Get all actions performed by a specific actor',
  })
  @ApiParam({ name: 'actorId', description: 'Admin user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of logs for this actor',
  })
  findByActor(
    @Param('actorId') actorId: string,
    @Query() query: Pick<AuditLogQueryDto, 'page' | 'limit'>,
  ): Promise<PaginatedAuditLogsResponse> {
    return this.auditLogsService.findByActor(actorId, query.page, query.limit);
  }

  // ── GET /admin/audit-logs/target/:targetType/:targetId ────────────────────
  @Get('target/:targetType/:targetId')
  @ApiOperation({
    summary: 'Get full history of a specific entity',
    description:
      'e.g. GET /target/Question/clxxx gives every event ever fired on that question.',
  })
  @ApiParam({ name: 'targetType', example: 'Question' })
  @ApiParam({ name: 'targetId', example: 'clxxxxxxxxxxxxxxxxxxxxxxxx' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query() query: Pick<AuditLogQueryDto, 'page' | 'limit'>,
  ): Promise<PaginatedAuditLogsResponse> {
    return this.auditLogsService.findByTarget(
      targetType,
      targetId,
      query.page,
      query.limit,
    );
  }

  // ── POST /admin/audit-logs ────────────────────────────────────────────────
  // Primarily for external services or admin UI to manually record events.
  // Internal services should call AuditLogsService.logAsync() directly.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a manual audit log entry',
    description:
      'Use this for ad-hoc audit events. For programmatic use, inject AuditLogsService and call logAsync().',
  })
  @ApiBody({ type: CreateAuditLogDto })
  @ApiResponse({ status: 201, description: 'Audit log entry created' })
  create(@Body() dto: CreateAuditLogDto) {
    return this.auditLogsService.log({
      action: dto.action || '',
      targetType: dto.targetType,
      targetId: dto.targetId,
      actorId: dto.actorId,
      actorRole: dto.actorRole as any,
      metadata: dto.metadata,
    });
  }

  // ── DELETE /admin/audit-logs/cleanup ─────────────────────────────────────
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prune old audit logs',
    description:
      'Hard-deletes logs older than N days. Defaults to 90 days. ' +
      'In production prefer a scheduled cron job; this endpoint is for manual maintenance.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        daysOld: { type: 'number', example: 90 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Number of logs deleted' })
  cleanup(@Body('daysOld') daysOld?: number): Promise<{ deleted: number }> {
    return this.auditLogsService.deleteOldLogs(daysOld ?? 90);
  }
}
