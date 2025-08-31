import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Use Node process hook to gracefully shutdown Nest app when Prisma is about to exit
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}


