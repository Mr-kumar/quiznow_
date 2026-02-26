import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
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
    example: 'uuid-of-exam',
    description: 'The Exam ID (e.g. RRB JE 2026)',
  })
  @IsNotEmpty()
  @IsUUID()
  examId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
