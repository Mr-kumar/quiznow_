import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  SettingKey,
  validateSetting,
  SETTINGS_SCHEMA,
} from './settings.registry';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // M-5 fix: Removed (this.prisma as any) casts — AdminSettings model exists in schema
  async getAllSettings() {
    const settings = await this.prisma.adminSettings.findMany();
    const result: any = {};
    settings.forEach((setting: any) => {
      result[setting.key] = setting.value;
    });
    return result;
  }

  async getSetting(key: string) {
    return this.prisma.adminSettings.findUnique({
      where: { key },
    });
  }

  /**
   * 🎯 TYPE-SAFE GETTER
   * Returns the typed value of a setting, falling back to schema default if not in DB.
   */
  async getSettingValue<K extends SettingKey>(key: K) {
    const setting = await this.getSetting(key);
    const schema = SETTINGS_SCHEMA[key];

    if (!setting) {
      return schema.parse(undefined);
    }

    // Still validate on read to ensure DB hasn't been corrupted
    return schema.parse(setting.value);
  }

  async updateSetting(updateSettingsDto: UpdateSettingsDto) {
    try {
      // 🛡️ Type-safe validation on write
      const validatedValue = validateSetting(
        updateSettingsDto.key as SettingKey,
        updateSettingsDto.value,
      );

      return this.prisma.adminSettings.upsert({
        where: { key: updateSettingsDto.key },
        create: {
          key: updateSettingsDto.key,
          value: validatedValue,
        },
        update: {
          value: validatedValue,
        },
      });
    } catch (error: any) {
      throw new BadRequestException(
        `Invalid setting value for "${updateSettingsDto.key}": ${error.message}`,
      );
    }
  }

  async updateMultipleSettings(settings: UpdateSettingsDto[]) {
    const results: any[] = [];
    for (const setting of settings) {
      const result = await this.updateSetting(setting);
      results.push(result);
    }
    return results;
  }

  async deleteSetting(key: string) {
    return this.prisma.adminSettings.delete({
      where: { key },
    });
  }
}
