import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserAnswerDto {
  @ApiProperty({ example: 'uuid-of-question' })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    example: 0,
    description: 'Index of selected option (0, 1, 2, 3)',
  })
  @IsNotEmpty()
  @IsInt()
  selectedOptionIndex: number; // We track which option index they picked (0=A, 1=B...)
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [UserAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAnswerDto)
  answers: UserAnswerDto[];
}
