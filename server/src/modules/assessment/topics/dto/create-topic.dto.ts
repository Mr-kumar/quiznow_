import { IsString, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Subject ID must be a valid CUID' })
  subjectId?: string;

  @IsOptional()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Parent ID must be a valid CUID' })
  parentId?: string;
}
