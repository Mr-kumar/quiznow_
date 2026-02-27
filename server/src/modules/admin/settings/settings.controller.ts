import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('admin/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get(':key')
  getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Post()
  updateSetting(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSetting(updateSettingsDto);
  }

  @Post('batch')
  updateMultiple(@Body() settings: UpdateSettingsDto[]) {
    return this.settingsService.updateMultipleSettings(settings);
  }

  @Delete(':key')
  deleteSetting(@Param('key') key: string) {
    return this.settingsService.deleteSetting(key);
  }
}
