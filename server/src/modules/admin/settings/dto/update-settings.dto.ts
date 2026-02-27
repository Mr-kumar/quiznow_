import { IsString, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  key: string;

  @IsObject()
  value: any;
}
