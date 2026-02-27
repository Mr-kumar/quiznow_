import { IsString, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
