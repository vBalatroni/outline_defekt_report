import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { sessionId?: string; generalData: any; products: any; emailStatus?: string }) {
    return this.prisma.submission.create({ data });
  }

  findMany() {
    return this.prisma.submission.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.submission.findUnique({ where: { id } });
  }
}


