import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'RRB JE 2026', description: 'Name of Exam' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'c1234567890abcdef1234567890abcdef',
    description: 'Category ID (e.g. Civil Engineering)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Category ID must be a valid CUID' })
  categoryId: string;

  @ApiProperty({
    example: true,
    description: 'Is this exam active?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
