import { IsString, IsOptional } from 'class-validator';

export class AddPlanAccessDto {
  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsString()
  seriesId?: string;
}
