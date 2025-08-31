-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "generalData" JSONB NOT NULL,
    "products" JSONB NOT NULL,
    "emailStatus" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
