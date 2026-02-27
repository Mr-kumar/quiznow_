import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await (this.prisma as any).adminSettings.findMany();
    const result: any = {};
    settings.forEach((setting: any) => {
      result[setting.key] = setting.value;
    });
    return result;
  }

  async getSetting(key: string) {
    return (this.prisma as any).adminSettings.findUnique({
      where: { key },
    });
  }

  async updateSetting(updateSettingsDto: UpdateSettingsDto) {
    return (this.prisma as any).adminSettings.upsert({
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
    return (this.prisma as any).adminSettings.delete({
      where: { key },
    });
  }
}
