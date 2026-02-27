import { IsString, IsEnum } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;
}
