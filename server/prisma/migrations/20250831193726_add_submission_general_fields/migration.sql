-- CreateTable
CREATE TABLE "SubmissionGeneralField" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "section" TEXT,
    "fieldCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SubmissionGeneralField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionGeneralField_submissionId_idx" ON "SubmissionGeneralField"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionGeneralField_submissionId_section_idx" ON "SubmissionGeneralField"("submissionId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionGeneralField_submissionId_section_fieldCode_key" ON "SubmissionGeneralField"("submissionId", "section", "fieldCode");

-- AddForeignKey
ALTER TABLE "SubmissionGeneralField" ADD CONSTRAINT "SubmissionGeneralField_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
