import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { ConfigDataService } from './config-data.service';

@Controller('config')
export class ConfigDataController {
  constructor(private readonly service: ConfigDataService) {}

  @Get('latest')
  async getLatest() {
    const assembled = await this.service.assembleLatest();
    if (assembled) return { content: assembled };
    const fallback = await this.service.getLatest();
    return fallback || { content: null };
  }

  @Post()
  save(@Body() body: any) {
    return this.service.create(body);
  }

  @Post('import')
  async import(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid payload');
    }
    // Minimal sanity checks
    if (!Array.isArray(body.categories) || !body.categoryModels || !body.modelFieldConfigs) {
      throw new BadRequestException('Missing required config sections');
    }
    return this.service.importFromJson(body);
  }

  @Post('import-default')
  importDefault() {
    return this.service.importDefaultFromFile();
  }
}


