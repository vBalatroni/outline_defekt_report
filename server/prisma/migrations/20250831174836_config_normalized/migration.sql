-- CreateEnum
CREATE TYPE "MappingType" AS ENUM ('static', 'symptomSet');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InputField" (
    "id" TEXT NOT NULL,
    "fieldCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "isSymptomArea" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT,
    "optionsJson" JSONB,

    CONSTRAINT "InputField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelField" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputFieldId" TEXT NOT NULL,

    CONSTRAINT "ModelField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueMapping" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "childFieldId" TEXT NOT NULL,
    "parentFieldId" TEXT NOT NULL,

    CONSTRAINT "ValueMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingEntry" (
    "id" TEXT NOT NULL,
    "mappingId" TEXT NOT NULL,
    "parentOptionKey" TEXT NOT NULL,
    "type" "MappingType" NOT NULL,
    "optionsJson" JSONB,
    "symptomSetId" TEXT,

    CONSTRAINT "MappingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomSet" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SymptomSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldRef" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL,
    "supplierRecipient" TEXT,
    "testingRecipient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InputField_fieldCode_key" ON "InputField"("fieldCode");

-- CreateIndex
CREATE UNIQUE INDEX "SymptomSet_key_key" ON "SymptomSet"("key");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputField" ADD CONSTRAINT "InputField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelField" ADD CONSTRAINT "ModelField_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelField" ADD CONSTRAINT "ModelField_inputFieldId_fkey" FOREIGN KEY ("inputFieldId") REFERENCES "InputField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueMapping" ADD CONSTRAINT "ValueMapping_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueMapping" ADD CONSTRAINT "ValueMapping_childFieldId_fkey" FOREIGN KEY ("childFieldId") REFERENCES "InputField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueMapping" ADD CONSTRAINT "ValueMapping_parentFieldId_fkey" FOREIGN KEY ("parentFieldId") REFERENCES "InputField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingEntry" ADD CONSTRAINT "MappingEntry_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "ValueMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingEntry" ADD CONSTRAINT "MappingEntry_symptomSetId_fkey" FOREIGN KEY ("symptomSetId") REFERENCES "SymptomSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom" ADD CONSTRAINT "Symptom_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SymptomSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
