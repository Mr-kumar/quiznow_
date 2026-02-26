import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttemptDto {
  @ApiProperty({ example: 'uuid-of-test', description: 'The Test ID' })
  @IsNotEmpty()
  @IsUUID()
  testId: string;

  @ApiProperty({
    example: 'uuid-of-user',
    description: 'The Student ID (Hardcode for now)',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
