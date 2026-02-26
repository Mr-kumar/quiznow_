import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Engineering', description: 'Name of the Category' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'null',
    description: 'Parent ID (Optional - Leave empty for Main Category)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    example: true,
    description: 'Is it visible?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
