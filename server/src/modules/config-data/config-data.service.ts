import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigDataService {
  constructor(private readonly prisma: PrismaService) {}

  getLatest() {
    return this.prisma.config.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  create(content: any) {
    return this.prisma.config.create({ data: { content } });
  }
}


