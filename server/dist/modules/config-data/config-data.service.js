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
exports.ConfigDataService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
let ConfigDataService = class ConfigDataService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getLatest() {
        return this.prisma.config.findFirst({ orderBy: { createdAt: 'desc' } });
    }
    create(content) {
        return this.prisma.config.create({ data: { content } });
    }
    async assembleLatest() {
        const categories = await this.prisma.category.findMany({ include: { models: true } });
        if (categories.length === 0) {
            const latest = await this.getLatest();
            return (latest === null || latest === void 0 ? void 0 : latest.content) || null;
        }
        const allModels = await this.prisma.model.findMany({ include: { modelFields: { include: { inputField: { include: { section: true } } } } } });
        const allFields = await this.prisma.inputField.findMany({ include: { section: true } });
        const allMappings = await this.prisma.valueMapping.findMany({ include: { entries: true, childField: true, parentField: true } });
        const sets = await this.prisma.symptomSet.findMany({ include: { symptoms: true } });
        const emailCfg = await this.prisma.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } });
        const categoriesArr = categories.map(c => c.name);
        const categoryModels = {};
        categories.forEach(c => { categoryModels[c.name] = c.models.map(m => m.name); });
        const modelFieldConfigs = {};
        for (const m of allModels) {
            const fieldsForModel = m.modelFields
                .sort((a, b) => { var _a, _b; return ((_a = a.inputField.sortOrder) !== null && _a !== void 0 ? _a : 0) - ((_b = b.inputField.sortOrder) !== null && _b !== void 0 ? _b : 0); })
                .map(mf => {
                var _a, _b;
                return ({
                    id: mf.inputField.fieldCode,
                    label: mf.inputField.label,
                    type: mf.inputField.type,
                    required: mf.inputField.required,
                    order: (_a = mf.inputField.sortOrder) !== null && _a !== void 0 ? _a : 0,
                    section: ((_b = mf.inputField.section) === null || _b === void 0 ? void 0 : _b.name) || '',
                    isSymptomArea: mf.inputField.isSymptomArea || false,
                    options: (Array.isArray(mf.inputField.optionsJson) || typeof mf.inputField.optionsJson === 'string') ? mf.inputField.optionsJson : [],
                    dependsOn: undefined,
                    valueMapping: undefined,
                });
            });
            const mappingsForModel = allMappings.filter(v => v.modelId === m.id);
            for (const map of mappingsForModel) {
                const childCode = map.childField.fieldCode;
                const parentCode = map.parentField.fieldCode;
                const child = fieldsForModel.find(f => f.id === childCode);
                if (!child)
                    continue;
                child.dependsOn = parentCode;
                child.valueMapping = {};
                for (const entry of map.entries) {
                    if (entry.type === 'static') {
                        child.valueMapping[entry.parentOptionKey] = { type: 'static', options: entry.optionsJson || [] };
                    }
                    else {
                        const set = sets.find(s => s.id === entry.symptomSetId);
                        if (set)
                            child.valueMapping[entry.parentOptionKey] = { type: 'symptomSet', key: set.key };
                    }
                }
            }
            modelFieldConfigs[m.name] = fieldsForModel;
        }
        const symptomSets = {};
        for (const s of sets) {
            symptomSets[s.key] = { label: s.label, symptoms: s.symptoms.map(x => x.label) };
        }
        const latestRaw = await this.getLatest();
        const extra = (latestRaw === null || latestRaw === void 0 ? void 0 : latestRaw.content) || {};
        const assembled = {
            categories: categoriesArr,
            categoryModels,
            modelFieldConfigs,
            symptomSets,
            emailConfig: (emailCfg ? { supplierRecipient: emailCfg.supplierRecipient || null, testingRecipient: emailCfg.testingRecipient || null, downloadHtmlReports: emailCfg.downloadHtmlReports } : undefined),
            generalFieldsConfig: extra.generalFieldsConfig || undefined,
        };
        return assembled;
    }
    async importFromJson(content) {
        return this.prisma.$transaction(async (tx) => {
            var _a, _b, _c, _d;
            await this.purgeNormalizedData(tx);
            if (content.emailConfig) {
                await tx.emailConfig.create({ data: {
                        supplierRecipient: content.emailConfig.supplierRecipient || null,
                        testingRecipient: content.emailConfig.testingRecipient || null,
                    } });
            }
            const sectionNames = (content.defectSections || ['symptomInfo', 'technicalInfo', 'serialNumbers', 'versions', 'additionalInfo'])
                .filter((v) => typeof v === 'string');
            for (const sec of sectionNames) {
                await tx.section.upsert({
                    where: { name: sec },
                    create: { name: sec },
                    update: {},
                });
            }
            const categories = content.categories || [];
            for (const cat of categories) {
                const catRec = await tx.category.upsert({ where: { name: cat }, create: { name: cat }, update: {} });
                const models = ((_a = content.categoryModels) === null || _a === void 0 ? void 0 : _a[cat]) || [];
                for (const modelName of models) {
                    await tx.model.upsert({
                        where: { name: modelName },
                        create: { name: modelName, categoryId: catRec.id },
                        update: { categoryId: catRec.id },
                    });
                }
            }
            const sets = content.symptomSets || {};
            for (const setKey of Object.keys(sets)) {
                const setData = sets[setKey];
                const set = await tx.symptomSet.upsert({
                    where: { key: setKey },
                    create: { key: setKey, label: setData.label || setKey },
                    update: { label: setData.label || setKey },
                });
                await tx.symptom.deleteMany({ where: { setId: set.id } });
                const items = setData.symptoms || setData.options || [];
                for (const label of items) {
                    await tx.symptom.create({ data: { setId: set.id, label } });
                }
            }
            const modelFieldConfigs = content.modelFieldConfigs || {};
            for (const modelName of Object.keys(modelFieldConfigs)) {
                const model = await tx.model.findUnique({ where: { name: modelName } });
                if (!model)
                    continue;
                const fields = modelFieldConfigs[modelName] || [];
                for (const f of fields) {
                    let sectionId = null;
                    if (f.section) {
                        const sec = await tx.section.upsert({ where: { name: f.section }, create: { name: f.section }, update: {} });
                        sectionId = sec.id;
                    }
                    const input = await tx.inputField.upsert({
                        where: { fieldCode: f.id },
                        create: {
                            fieldCode: f.id,
                            label: f.label || f.id,
                            type: f.type || 'text',
                            required: !!f.required,
                            sortOrder: typeof f.order === 'number' ? f.order : null,
                            isSymptomArea: !!f.isSymptomArea,
                            sectionId,
                            optionsJson: (_b = f.options) !== null && _b !== void 0 ? _b : null,
                        },
                        update: {
                            label: f.label || f.id,
                            type: f.type || 'text',
                            required: !!f.required,
                            sortOrder: typeof f.order === 'number' ? f.order : null,
                            isSymptomArea: !!f.isSymptomArea,
                            sectionId,
                            optionsJson: (_c = f.options) !== null && _c !== void 0 ? _c : null,
                        },
                    });
                    const exists = await tx.modelField.findFirst({ where: { modelId: model.id, inputFieldId: input.id } });
                    if (!exists) {
                        await tx.modelField.create({ data: { modelId: model.id, inputFieldId: input.id } });
                    }
                }
                for (const f of fields) {
                    if (!f.dependsOn || !f.valueMapping)
                        continue;
                    const child = await tx.inputField.findUnique({ where: { fieldCode: f.id } });
                    const parent = await tx.inputField.findUnique({ where: { fieldCode: f.dependsOn } });
                    if (!child || !parent)
                        continue;
                    let mapping = await tx.valueMapping.findFirst({ where: { modelId: model.id, childFieldId: child.id, parentFieldId: parent.id } });
                    if (!mapping) {
                        mapping = await tx.valueMapping.create({ data: { modelId: model.id, childFieldId: child.id, parentFieldId: parent.id } });
                    }
                    await tx.mappingEntry.deleteMany({ where: { mappingId: mapping.id } });
                    for (const parentKey of Object.keys(f.valueMapping)) {
                        const mapConf = f.valueMapping[parentKey];
                        if (mapConf.type === 'static') {
                            const opts = mapConf.options || mapConf.value || [];
                            const list = Array.isArray(opts) ? opts : String(opts).split('\n').map((s) => s.trim()).filter(Boolean);
                            await tx.mappingEntry.create({ data: { mappingId: mapping.id, parentOptionKey: parentKey, type: 'static', optionsJson: list } });
                        }
                        else if (mapConf.type === 'symptomSet') {
                            const key = mapConf.key || mapConf.value;
                            if (!key)
                                continue;
                            const set = await tx.symptomSet.findUnique({ where: { key } });
                            await tx.mappingEntry.create({ data: { mappingId: mapping.id, parentOptionKey: parentKey, type: 'symptomSet', symptomSetId: (set === null || set === void 0 ? void 0 : set.id) || null } });
                        }
                    }
                }
                for (const f of fields) {
                    if (!Array.isArray(f.conditions) || f.conditions.length === 0)
                        continue;
                    const field = await tx.inputField.findUnique({ where: { fieldCode: f.id } });
                    if (!field)
                        continue;
                    await tx.condition.deleteMany({ where: { modelId: model.id, fieldId: f.id } });
                    for (const c of f.conditions) {
                        await tx.condition.create({ data: {
                                modelId: model.id,
                                fieldId: f.id,
                                fieldRef: c.field,
                                operator: c.operator,
                                value: (_d = c.value) !== null && _d !== void 0 ? _d : null,
                            } });
                    }
                }
            }
            await tx.config.create({ data: { content } });
            return { ok: true };
        });
    }
    async purgeNormalizedData(tx) {
        await tx.mappingEntry.deleteMany({});
        await tx.valueMapping.deleteMany({});
        await tx.modelField.deleteMany({});
        await tx.condition.deleteMany({});
        await tx.symptom.deleteMany({});
        await tx.symptomSet.deleteMany({});
        await tx.model.deleteMany({});
        await tx.category.deleteMany({});
        await tx.inputField.deleteMany({});
        await tx.section.deleteMany({});
    }
    async importDefaultFromFile() {
        const filePath = path.resolve(process.cwd(), '../src/assets/productData.json');
        const raw = await fs.readFile(filePath, 'utf-8');
        const json = JSON.parse(raw);
        return this.importFromJson(json);
    }
    async setEmailConfig(cfg) {
        const { supplierRecipient = null, testingRecipient = null, downloadHtmlReports = true } = cfg || {};
        await this.prisma.emailConfig.create({ data: { supplierRecipient, testingRecipient, downloadHtmlReports } });
    }
};
exports.ConfigDataService = ConfigDataService;
exports.ConfigDataService = ConfigDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigDataService);
//# sourceMappingURL=config-data.service.js.map