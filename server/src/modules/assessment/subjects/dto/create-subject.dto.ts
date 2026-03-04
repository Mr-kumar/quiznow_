import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  isActive?: boolean = true;
}
