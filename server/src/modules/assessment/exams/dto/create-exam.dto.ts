import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'RRB JE 2026', description: 'Name of Exam' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'uuid-of-category',
    description: 'Category ID (e.g. Civil Engineering)',
  })
  @IsNotEmpty()
  @IsUUID()
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
