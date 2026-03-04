import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestSeryDto {
  @ApiProperty({
    example: 'Full Length Mock Tests (2026)',
    description: 'Title of the Series',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'c1234567890abcdef1234567890abcdef',
    description: 'The Exam ID (e.g. RRB JE 2026)',
  })
  @IsNotEmpty()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Exam ID must be a valid CUID' })
  examId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
