-- DropIndex
DROP INDEX "TestParameter_testId_parameterId_key";

-- AlterTable
ALTER TABLE "TestParameter" ALTER COLUMN "parameterId" DROP NOT NULL;
