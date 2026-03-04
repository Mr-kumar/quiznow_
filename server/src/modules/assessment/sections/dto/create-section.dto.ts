import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({
    example: 'Part A: General Intelligence',
    description: 'Section Name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'c1234567890abcdef1234567890abcdef',
    description: 'The Test ID',
  })
  @IsNotEmpty()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Test ID must be a valid CUID' })
  testId: string;

  @ApiProperty({
    example: 30,
    description: 'Duration in Minutes',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMins?: number;

  @ApiProperty({ example: 1, description: 'Order of the section in the test' })
  @IsInt()
  @Min(1)
  order: number;
}
