import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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

export class CreateAuditLogDto {
  @ApiPropertyOptional({ description: 'Action performed' })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Type of entity that was acted upon' })
  @IsString()
  @IsOptional()
  targetType?: string;

  @ApiPropertyOptional({ description: 'ID of entity that was acted upon' })
  @IsString()
  @IsOptional()
  targetId?: string;

  @ApiPropertyOptional({ description: 'ID of user who performed the action' })
  @IsString()
  @IsOptional()
  actorId?: string;

  @ApiPropertyOptional({ description: 'Role of user who performed the action' })
  @IsOptional()
  actorRole?: string;

  @ApiPropertyOptional({ description: 'Additional metadata about the action' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
