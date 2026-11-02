CREATE TYPE "GlobalSyncItemType" AS ENUM ('Test', 'Parameter', 'Format');
CREATE TYPE "GlobalSyncStatus" AS ENUM ('PendingReview', 'Approved', 'Rejected', 'Published', 'Removed');

ALTER TABLE "Test" ADD COLUMN "globalTestId" TEXT;
ALTER TABLE "Parameter" ADD COLUMN "globalParameterId" TEXT;
ALTER TABLE "TestResult" ADD COLUMN "definitionSnapshot" JSONB;

CREATE TABLE "GlobalTest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "payload" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GlobalTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalParameter" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "inputType" TEXT NOT NULL,
    "globalTestId" TEXT,
    "payload" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GlobalParameter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalFormat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "globalTestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GlobalFormat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabFormat" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "testId" INTEGER,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "globalFormatId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabFormat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalSyncSubmission" (
    "id" TEXT NOT NULL,
    "sourceOrganizationId" INTEGER NOT NULL,
    "itemType" "GlobalSyncItemType" NOT NULL,
    "sourceRecordId" INTEGER NOT NULL,
    "sourceParentTestId" INTEGER,
    "targetGlobalTestId" TEXT,
    "targetGlobalParameterId" TEXT,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "GlobalSyncStatus" NOT NULL DEFAULT 'PendingReview',
    "duplicateWarning" TEXT,
    "sourceCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "GlobalSyncSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalSyncLog" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "itemType" "GlobalSyncItemType",
    "submissionId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalSyncConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "newRecordsSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacyBootstrapDone" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GlobalSyncConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalTest_code_key" ON "GlobalTest"("code");
CREATE INDEX "GlobalTest_name_idx" ON "GlobalTest"("name");
CREATE UNIQUE INDEX "GlobalParameter_code_key" ON "GlobalParameter"("code");
CREATE INDEX "GlobalParameter_name_idx" ON "GlobalParameter"("name");
CREATE INDEX "GlobalParameter_globalTestId_idx" ON "GlobalParameter"("globalTestId");
CREATE UNIQUE INDEX "GlobalFormat_globalTestId_name_version_key" ON "GlobalFormat"("globalTestId", "name", "version");
CREATE UNIQUE INDEX "LabFormat_organizationId_testId_name_version_key" ON "LabFormat"("organizationId", "testId", "name", "version");
CREATE UNIQUE INDEX "LabFormat_organizationId_globalFormatId_key" ON "LabFormat"("organizationId", "globalFormatId");
CREATE INDEX "LabFormat_organizationId_createdAt_idx" ON "LabFormat"("organizationId", "createdAt");
CREATE UNIQUE INDEX "GlobalSyncSubmission_sourceOrganizationId_itemType_sourceRecordId_key" ON "GlobalSyncSubmission"("sourceOrganizationId", "itemType", "sourceRecordId");
CREATE INDEX "GlobalSyncSubmission_status_createdAt_idx" ON "GlobalSyncSubmission"("status", "createdAt");
CREATE INDEX "GlobalSyncSubmission_itemType_name_idx" ON "GlobalSyncSubmission"("itemType", "name");
CREATE INDEX "GlobalSyncLog_organizationId_createdAt_idx" ON "GlobalSyncLog"("organizationId", "createdAt");
CREATE INDEX "GlobalSyncLog_submissionId_idx" ON "GlobalSyncLog"("submissionId");
CREATE UNIQUE INDEX "Test_organizationId_globalTestId_key" ON "Test"("organizationId", "globalTestId");
CREATE UNIQUE INDEX "Parameter_organizationId_globalParameterId_key" ON "Parameter"("organizationId", "globalParameterId");

ALTER TABLE "GlobalParameter" ADD CONSTRAINT "GlobalParameter_globalTestId_fkey"
    FOREIGN KEY ("globalTestId") REFERENCES "GlobalTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalFormat" ADD CONSTRAINT "GlobalFormat_globalTestId_fkey"
    FOREIGN KEY ("globalTestId") REFERENCES "GlobalTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Test" ADD CONSTRAINT "Test_globalTestId_fkey"
    FOREIGN KEY ("globalTestId") REFERENCES "GlobalTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Parameter" ADD CONSTRAINT "Parameter_globalParameterId_fkey"
    FOREIGN KEY ("globalParameterId") REFERENCES "GlobalParameter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabFormat" ADD CONSTRAINT "LabFormat_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabFormat" ADD CONSTRAINT "LabFormat_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabFormat" ADD CONSTRAINT "LabFormat_globalFormatId_fkey"
    FOREIGN KEY ("globalFormatId") REFERENCES "GlobalFormat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalSyncSubmission" ADD CONSTRAINT "GlobalSyncSubmission_sourceOrganizationId_fkey"
    FOREIGN KEY ("sourceOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlobalSyncLog" ADD CONSTRAINT "GlobalSyncLog_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "GlobalSyncConfig" ("id", "newRecordsSince", "legacyBootstrapDone")
VALUES (1, CURRENT_TIMESTAMP, false);
