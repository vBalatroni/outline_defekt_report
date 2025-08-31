import { Module } from '@nestjs/common';
import { ConfigDataService } from './config-data.service';
import { ConfigDataController } from './config-data.controller';

@Module({
  providers: [ConfigDataService],
  controllers: [ConfigDataController],
})
export class ConfigDataModule {}


