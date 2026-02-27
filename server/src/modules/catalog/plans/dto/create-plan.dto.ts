import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  durationDays: number;
}
