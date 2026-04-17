-- AlterTable
ALTER TABLE "Parameter" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isMultiValue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resultAlignment" TEXT DEFAULT 'Beside';
