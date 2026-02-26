import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
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

  @ApiProperty({ example: 'uuid-of-test', description: 'The Test ID' })
  @IsNotEmpty()
  @IsUUID()
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
