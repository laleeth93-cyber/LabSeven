/*
  Warnings:

  - You are about to drop the column `consentRequired` on the `Parameter` table. All the data in the column will be lost.
  - You are about to drop the column `idRequired` on the `Parameter` table. All the data in the column will be lost.
  - You are about to drop the column `lmpRequired` on the `Parameter` table. All the data in the column will be lost.
  - You are about to drop the column `printNextPage` on the `Parameter` table. All the data in the column will be lost.
  - You are about to drop the column `criticalHigh` on the `ParameterRange` table. All the data in the column will be lost.
  - You are about to drop the column `criticalLow` on the `ParameterRange` table. All the data in the column will be lost.
  - You are about to drop the column `criticalOperator` on the `ParameterRange` table. All the data in the column will be lost.
  - You are about to drop the column `criticalValue` on the `ParameterRange` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `specimen` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `vacutainer` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the `Multivalue` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Parameter` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Parameter" DROP COLUMN "consentRequired",
DROP COLUMN "idRequired",
DROP COLUMN "lmpRequired",
DROP COLUMN "printNextPage",
ALTER COLUMN "inputType" SET DEFAULT 'Numerical';

-- AlterTable
ALTER TABLE "ParameterRange" DROP COLUMN "criticalHigh",
DROP COLUMN "criticalLow",
DROP COLUMN "criticalOperator",
DROP COLUMN "criticalValue",
ADD COLUMN     "panicHigh" DOUBLE PRECISION,
ADD COLUMN     "panicLow" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "department",
DROP COLUMN "method",
DROP COLUMN "specimen",
DROP COLUMN "vacutainer",
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "methodId" INTEGER,
ADD COLUMN     "specimenId" INTEGER,
ADD COLUMN     "vacutainerId" INTEGER;

-- DropTable
DROP TABLE "Multivalue";

-- CreateTable
CREATE TABLE "TestParameter" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "parameterId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabList" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestParameter_testId_parameterId_key" ON "TestParameter"("testId", "parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "LabList_code_key" ON "LabList"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Parameter_code_key" ON "Parameter"("code");

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_vacutainerId_fkey" FOREIGN KEY ("vacutainerId") REFERENCES "Vacutainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestParameter" ADD CONSTRAINT "TestParameter_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestParameter" ADD CONSTRAINT "TestParameter_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
