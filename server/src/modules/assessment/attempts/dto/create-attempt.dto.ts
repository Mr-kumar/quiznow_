import { IsNotEmpty, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttemptDto {
  @ApiProperty({
    example: 'c1234567890abcdef1234567890abcdef',
    description: 'The Test ID',
  })
  @IsNotEmpty()
  @Matches(/^c[0-9a-z]{24}$/, { message: 'Test ID must be a valid CUID' })
  testId: string;
}
