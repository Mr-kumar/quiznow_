import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// Allowed action prefixes — extend as you add new auditable events
export enum AuditAction {
  // Questions
  QUESTION_CREATED = 'QUESTION_CREATED',
  QUESTION_UPDATED = 'QUESTION_UPDATED',
  QUESTION_SOFT_DELETED = 'QUESTION_SOFT_DELETED',
  QUESTION_BULK_TAGGED = 'QUESTION_BULK_TAGGED',
  // Tests
  TEST_PUBLISHED = 'TEST_PUBLISHED',
  TEST_UNPUBLISHED = 'TEST_UNPUBLISHED',
  TEST_CREATED = 'TEST_CREATED',
  TEST_DELETED = 'TEST_DELETED',
  // Sections
  SECTION_CREATED = 'SECTION_CREATED',
  SECTION_DELETED = 'SECTION_DELETED',
  SECTION_QUESTIONS_LINKED = 'SECTION_QUESTIONS_LINKED',
  SECTION_QUESTION_UNLINKED = 'SECTION_QUESTION_UNLINKED',
  // Users / IAM
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_BANNED = 'USER_BANNED',
  // Admin operations
  BULK_UPLOAD = 'BULK_UPLOAD',
  AUDIT_LOGS_PRUNED = 'AUDIT_LOGS_PRUNED',
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Prevent unreasonably large pages
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Full-text search across action, targetType, targetId, actorId',
    example: 'question',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Filter by exact action name',
    example: AuditAction.QUESTION_SOFT_DELETED,
  })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by target entity type',
    example: 'Question',
  })
  @IsString()
  @IsOptional()
  targetType?: string;

  @ApiPropertyOptional({
    description: 'Filter by actor (admin user) ID',
    example: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsOptional()
  actorId?: string;
}
