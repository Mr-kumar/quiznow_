import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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

  async updateSetting(updateSettingsDto: UpdateSettingsDto) {
    return this.prisma.adminSettings.upsert({
      where: { key: updateSettingsDto.key },
      create: {
        key: updateSettingsDto.key,
        value: updateSettingsDto.value,
      },
      update: {
        value: updateSettingsDto.value,
      },
    });
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
