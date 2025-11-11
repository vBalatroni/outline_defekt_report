import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
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

  // Placeholder for future: assemble JSON from normalized tables
  async assembleLatest(): Promise<any | null> {
    // Try assemble from normalized tables. If empty, fallback to stored JSON.
    const categories = await this.prisma.category.findMany({ include: { models: true } });
    if (categories.length === 0) {
      const latest = await this.getLatest();
      return latest?.content || null;
    }

    const allModels = await this.prisma.model.findMany({ include: { modelFields: { include: { inputField: { include: { section: true } } } } } });
    const allFields = await this.prisma.inputField.findMany({ include: { section: true } });
    const allMappings = await this.prisma.valueMapping.findMany({ include: { entries: true, childField: true, parentField: true } });
    const sets = await this.prisma.symptomSet.findMany({ include: { symptoms: true } });
    const emailCfg = await this.prisma.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } });

    const categoriesArr = categories.map(c => c.name);
    const categoryModels: Record<string, string[]> = {};
    categories.forEach(c => { categoryModels[c.name] = c.models.map(m => m.name); });

    type FieldConf = {
      id: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      section: string;
      isSymptomArea: boolean;
      options: any;
      dependsOn?: string;
      valueMapping?: Record<string, any>;
    };

    const modelFieldConfigs: Record<string, FieldConf[]> = {};
    for (const m of allModels) {
      const fieldsForModel: FieldConf[] = m.modelFields
        .sort((a, b) => (a.inputField.sortOrder ?? 0) - (b.inputField.sortOrder ?? 0))
        .map(mf => ({
          id: mf.inputField.fieldCode,
          label: mf.inputField.label,
          type: mf.inputField.type,
          required: mf.inputField.required,
          order: mf.inputField.sortOrder ?? 0,
          section: mf.inputField.section?.name || '',
          isSymptomArea: mf.inputField.isSymptomArea || false,
          options: (Array.isArray(mf.inputField.optionsJson) || typeof mf.inputField.optionsJson === 'string') ? mf.inputField.optionsJson : [],
          dependsOn: undefined,
          valueMapping: undefined,
        }));

      // apply value mappings
      const mappingsForModel = allMappings.filter(v => v.modelId === m.id);
      for (const map of mappingsForModel) {
        const childCode = map.childField.fieldCode;
        const parentCode = map.parentField.fieldCode;
        const child = fieldsForModel.find(f => f.id === childCode);
        if (!child) continue;
        child.dependsOn = parentCode;
        child.valueMapping = {} as any;
        for (const entry of map.entries) {
          if (entry.type === 'static') {
            child.valueMapping[entry.parentOptionKey] = { type: 'static', options: entry.optionsJson || [] };
          } else {
            const set = sets.find(s => s.id === entry.symptomSetId);
            if (set) child.valueMapping[entry.parentOptionKey] = { type: 'symptomSet', key: set.key };
          }
        }
      }
      modelFieldConfigs[m.name] = fieldsForModel;
    }

    const symptomSets: Record<string, any> = {};
    for (const s of sets) {
      symptomSets[s.key] = { label: s.label, symptoms: s.symptoms.map(x => x.label) };
    }

    // Try to merge extra config from latest raw snapshot (for non-normalized parts like generalFieldsConfig)
    const latestRaw = await this.getLatest();
    const extra: any = (latestRaw?.content as any) || {} as any;

    const assembled = {
      categories: categoriesArr,
      categoryModels,
      modelFieldConfigs,
      symptomSets,
      // Use normalized EmailConfig record from DB (latest)
      emailConfig: (emailCfg ? { supplierRecipient: emailCfg.supplierRecipient || null, testingRecipient: emailCfg.testingRecipient || null, downloadHtmlReports: emailCfg.downloadHtmlReports } : undefined),
      generalFieldsConfig: extra.generalFieldsConfig || undefined,
    };
    return assembled;
  }

  // Import normalized data from current JSON shape
  async importFromJson(content: any) {
    return this.prisma.$transaction(async (tx) => {
      // Purge normalized tables to reflect the incoming JSON exactly
      await this.purgeNormalizedData(tx);

      // Email config
      if (content.emailConfig) {
        await tx.emailConfig.create({ data: {
          supplierRecipient: content.emailConfig.supplierRecipient || null,
          testingRecipient: content.emailConfig.testingRecipient || null,
        }});
      }

      // Sections (ensure defaults)
      const sectionNames: string[] = (content.defectSections || ['symptomInfo','technicalInfo','serialNumbers','versions','additionalInfo'])
        .filter((v: any) => typeof v === 'string');
      for (const sec of sectionNames) {
        await tx.section.upsert({
          where: { name: sec },
          create: { name: sec },
          update: {},
        });
      }

      // Categories & Models
      const categories: string[] = content.categories || [];
      for (const cat of categories) {
        const catRec = await tx.category.upsert({ where: { name: cat }, create: { name: cat }, update: {} });
        const models: string[] = content.categoryModels?.[cat] || [];
        for (const modelName of models) {
          await tx.model.upsert({
            where: { name: modelName },
            create: { name: modelName, categoryId: catRec.id },
            update: { categoryId: catRec.id },
          });
        }
      }

      // Symptom sets
      const sets = content.symptomSets || {};
      for (const setKey of Object.keys(sets)) {
        const setData = sets[setKey];
        const set = await tx.symptomSet.upsert({
          where: { key: setKey },
          create: { key: setKey, label: setData.label || setKey },
          update: { label: setData.label || setKey },
        });
        // Replace symptoms
        await tx.symptom.deleteMany({ where: { setId: set.id } });
        const items: string[] = setData.symptoms || setData.options || [];
        for (const label of items) {
          await tx.symptom.create({ data: { setId: set.id, label } });
        }
      }

      // Fields per model
      const modelFieldConfigs = content.modelFieldConfigs || {};
      for (const modelName of Object.keys(modelFieldConfigs)) {
        const model = await tx.model.findUnique({ where: { name: modelName } });
        if (!model) continue;
        const fields: any[] = modelFieldConfigs[modelName] || [];

        for (const f of fields) {
          // Section
          let sectionId: string | null = null;
          if (f.section) {
            const sec = await tx.section.upsert({ where: { name: f.section }, create: { name: f.section }, update: {} });
            sectionId = sec.id;
          }
          // InputField (by fieldCode=id)
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
              optionsJson: f.options ?? null,
            },
            update: {
              label: f.label || f.id,
              type: f.type || 'text',
              required: !!f.required,
              sortOrder: typeof f.order === 'number' ? f.order : null,
              isSymptomArea: !!f.isSymptomArea,
              sectionId,
              optionsJson: f.options ?? null,
            },
          });
          // Link ModelField (idempotent)
          const exists = await tx.modelField.findFirst({ where: { modelId: model.id, inputFieldId: input.id } });
          if (!exists) {
            await tx.modelField.create({ data: { modelId: model.id, inputFieldId: input.id } });
          }
        }

        // Value mappings (parent/child dependencies)
        for (const f of fields) {
          if (!f.dependsOn || !f.valueMapping) continue;
          const child = await tx.inputField.findUnique({ where: { fieldCode: f.id } });
          const parent = await tx.inputField.findUnique({ where: { fieldCode: f.dependsOn } });
          if (!child || !parent) continue;

          // Upsert ValueMapping record
          let mapping = await tx.valueMapping.findFirst({ where: { modelId: model.id, childFieldId: child.id, parentFieldId: parent.id } });
          if (!mapping) {
            mapping = await tx.valueMapping.create({ data: { modelId: model.id, childFieldId: child.id, parentFieldId: parent.id } });
          }
          // Replace entries
          await tx.mappingEntry.deleteMany({ where: { mappingId: mapping.id } });
          for (const parentKey of Object.keys(f.valueMapping)) {
            const mapConf = f.valueMapping[parentKey];
            if (mapConf.type === 'static') {
              const opts = mapConf.options || mapConf.value || [];
              const list = Array.isArray(opts) ? opts : String(opts).split('\n').map((s: string) => s.trim()).filter(Boolean);
              await tx.mappingEntry.create({ data: { mappingId: mapping.id, parentOptionKey: parentKey, type: 'static', optionsJson: list } });
            } else if (mapConf.type === 'symptomSet') {
              const key = mapConf.key || mapConf.value;
              if (!key) continue;
              const set = await tx.symptomSet.findUnique({ where: { key } });
              await tx.mappingEntry.create({ data: { mappingId: mapping.id, parentOptionKey: parentKey, type: 'symptomSet', symptomSetId: set?.id || null } });
            }
          }
        }

        // Conditions per field (optional)
        for (const f of fields) {
          if (!Array.isArray(f.conditions) || f.conditions.length === 0) continue;
          const field = await tx.inputField.findUnique({ where: { fieldCode: f.id } });
          if (!field) continue;
          // naive approach: clear and recreate
          await tx.condition.deleteMany({ where: { modelId: model.id, fieldId: f.id } });
          for (const c of f.conditions) {
            await tx.condition.create({ data: {
              modelId: model.id,
              fieldId: f.id,
              fieldRef: c.field,
              operator: c.operator,
              value: c.value ?? null,
            }});
          }
        }
      }

      // Also store original JSON as last Config snapshot
      await tx.config.create({ data: { content } });
      return { ok: true };
    });
  }

  private async purgeNormalizedData(tx: any) {
    // Delete in dependency-safe order
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

  private async loadBaseConfigContent() {
    const latest = await this.getLatest();
    if (latest?.content) {
      return JSON.parse(JSON.stringify(latest.content));
    }
    try {
      const filePath = path.resolve(process.cwd(), '../src/assets/productData.json');
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (e: any) {
      console.warn('[ConfigDataService] Unable to load default productData.json:', String(e?.message || e));
      return {};
    }
  }

  async setEmailConfig(cfg: {
    supplierRecipient?: string | null;
    testingRecipient?: string | null;
    downloadHtmlReports?: boolean;
    serialValidationEnabled?: boolean;
  }) {
    const {
      supplierRecipient = null,
      testingRecipient = null,
      downloadHtmlReports = true,
      serialValidationEnabled,
    } = cfg || {};

    const base = await this.loadBaseConfigContent();
    base.emailConfig = { supplierRecipient, testingRecipient, downloadHtmlReports };
    if (serialValidationEnabled !== undefined) {
      base.validationConfig = base.validationConfig || {};
      base.validationConfig.serial = base.validationConfig.serial || {};
      base.validationConfig.serial.enabled = !!serialValidationEnabled;
    }

    try {
      await this.prisma.emailConfig.create({
        data: { supplierRecipient, testingRecipient, downloadHtmlReports },
      });
    } catch (e) {
      console.warn('[ConfigDataService] emailConfig persistence failed, continuing with snapshot update only:', String((e as any)?.message || e));
    }

    await this.create(base);
  }
}


