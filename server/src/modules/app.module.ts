import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { ConfigDataModule } from './config-data/config-data.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    ConfigDataModule,
    SubmissionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


