"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubmissionsService = class SubmissionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        return this.prisma.$transaction(async (tx) => {
            const submission = await tx.submission.create({ data });
            try {
                const general = data.generalData || {};
                const entries = [];
                Object.keys(general).forEach((sectionKey) => {
                    const sectionObj = general[sectionKey];
                    if (sectionObj && typeof sectionObj === 'object') {
                        Object.keys(sectionObj).forEach((fieldKey) => {
                            var _a;
                            const f = sectionObj[fieldKey];
                            if (f && typeof f === 'object' && ('id' in f || 'label' in f || 'value' in f)) {
                                entries.push({
                                    section: sectionKey,
                                    fieldCode: f.id || fieldKey,
                                    label: f.label || fieldKey,
                                    value: (_a = f.value) !== null && _a !== void 0 ? _a : null,
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
            }
            catch (e) {
                console.error('Failed to normalize generalData for submission', e);
            }
            return submission;
        });
    }
    findMany() {
        return this.prisma.submission.findMany({ orderBy: { createdAt: 'desc' } });
    }
    findOne(id) {
        return this.prisma.submission.findUnique({ where: { id } });
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map