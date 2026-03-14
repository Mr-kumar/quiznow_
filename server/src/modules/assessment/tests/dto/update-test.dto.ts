import { PartialType } from '@nestjs/swagger';
import { CreateTestDto } from './create-test.dto';
import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTestDto extends PartialType(CreateTestDto) {
  @ApiProperty({ required: false, description: 'Whether the test is premium' })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiProperty({ required: false, description: 'Whether the test is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    description: 'Maximum number of attempts (null for unlimited)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number | null;
}
