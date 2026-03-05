import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  // Temporarily relaxed for debugging - TODO: Add proper CUID validation after debugging
  subjectId: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
