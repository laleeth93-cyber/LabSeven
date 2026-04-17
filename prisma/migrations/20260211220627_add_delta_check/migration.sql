/*
  Warnings:

  - You are about to drop the column `doctorId` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `BillItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `BillItem` table. All the data in the column will be lost.
  - You are about to drop the column `interpretation` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `formula` on the `TestParameter` table. All the data in the column will be lost.
  - You are about to drop the `TestResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "TestResult" DROP CONSTRAINT "TestResult_billItemId_fkey";

-- DropForeignKey
ALTER TABLE "TestResult" DROP CONSTRAINT "TestResult_parameterId_fkey";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "doctorId";

-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "notes",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "interpretation";

-- AlterTable
ALTER TABLE "TestParameter" DROP COLUMN "formula",
ADD COLUMN     "deltaLimit" DOUBLE PRECISION,
ADD COLUMN     "deltaType" TEXT DEFAULT 'Percentage';

-- DropTable
DROP TABLE "TestResult";
