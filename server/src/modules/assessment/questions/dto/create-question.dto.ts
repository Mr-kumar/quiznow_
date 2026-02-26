import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({
    example: 'What is the chemical formula of water?',
    description: 'Question Text',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'uuid-of-section', description: 'Section ID' })
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({
    example: ['H2O', 'CO2', 'O2', 'NaCl'],
    description: '4 Options',
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    example: 0,
    description: 'The Correct Answer Index (0-based)',
  })
  @IsInt()
  @Min(0)
  correctAnswer: number;

  @ApiProperty({ example: 1, description: 'Marks for this question' })
  @IsInt()
  @Min(1)
  marks: number;

  @ApiProperty({ example: 'en', description: 'Language code', required: false })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiProperty({
    example: 'Water is composed of hydrogen and oxygen',
    description: 'Explanation',
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ example: 1, description: 'Order of question in section' })
  @IsInt()
  @Min(1)
  order: number;
}
