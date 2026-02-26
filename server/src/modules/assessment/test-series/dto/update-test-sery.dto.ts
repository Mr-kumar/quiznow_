import { PartialType } from '@nestjs/swagger';
import { CreateTestSeryDto } from './create-test-sery.dto';

export class UpdateTestSeryDto extends PartialType(CreateTestSeryDto) {}
