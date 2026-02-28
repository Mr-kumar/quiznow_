import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestDto {
  @ApiProperty({
    example: 'Mock Test 1: Fluid Mechanics',
    description: 'Test Title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'uuid-of-test-series',
    description: 'Test Series ID',
  })
  @IsNotEmpty()
  @IsUUID()
  testSeriesId: string;

  @ApiProperty({ example: 60, description: 'Duration in Minutes' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 100, description: 'Total Marks' })
  @IsInt()
  @Min(1)
  totalMarks: number;

  @ApiProperty({ example: 33, description: 'Passing Marks' })
  @IsInt()
  @Min(0)
  passingMarks: number;

  @ApiProperty({
    example: 0.25,
    description: 'Negative Marking (e.g., 0.25 for 1/4th)',
  })
  @IsNumber()
  @Min(0)
  negativeMarking: number;

  @ApiProperty({
    example: '2024-01-01T10:00:00Z',
    description: 'Test Start Time (Optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  startAt?: string;

  @ApiProperty({
    example: '2024-01-01T12:00:00Z',
    description: 'Test End Time (Optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  endAt?: string;
}
