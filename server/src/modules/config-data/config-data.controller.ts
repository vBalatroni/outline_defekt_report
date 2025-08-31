import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigDataService } from './config-data.service';

@Controller('config')
export class ConfigDataController {
  constructor(private readonly service: ConfigDataService) {}

  @Get('latest')
  getLatest() {
    return this.service.getLatest();
  }

  @Post()
  save(@Body() body: any) {
    return this.service.create(body);
  }
}


