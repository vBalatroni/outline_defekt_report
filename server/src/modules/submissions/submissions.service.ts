import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { sessionId?: string; generalData: any; products: any; emailStatus?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({ data });
      // Normalize generalData into SubmissionGeneralField
      try {
        const general = data.generalData || {};
        const entries: Array<{ section?: string; fieldCode: string; label: string; value: any }> = [];
        Object.keys(general).forEach((sectionKey) => {
          const sectionObj = general[sectionKey];
          if (sectionObj && typeof sectionObj === 'object') {
            Object.keys(sectionObj).forEach((fieldKey) => {
              const f = sectionObj[fieldKey];
              if (f && typeof f === 'object' && ('id' in f || 'label' in f || 'value' in f)) {
                entries.push({
                  section: sectionKey,
                  fieldCode: f.id || fieldKey,
                  label: f.label || fieldKey,
                  value: f.value ?? null,
                });
              }
            });
          }
        });
        if (entries.length > 0) {
          await tx.submissionGeneralField.createMany({
            data: entries.map((e) => ({
              submissionId: submission.id,
              section: e.section || null,
              fieldCode: e.fieldCode,
              label: e.label,
              value: e.value,
            })),
            skipDuplicates: true,
          });
        }
      } catch (e) {
        // do not fail the submission if normalization fails; just log
        console.error('Failed to normalize generalData for submission', e);
      }
      return submission;
    });
  }

  findMany() {
    return this.prisma.submission.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.submission.findUnique({ where: { id } });
  }
}


