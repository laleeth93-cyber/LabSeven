/*
  Warnings:

  - You are about to drop the column `deltaLimit` on the `TestParameter` table. All the data in the column will be lost.
  - You are about to drop the column `deltaType` on the `TestParameter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "doctorId" INTEGER;

-- AlterTable
ALTER TABLE "BillItem" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "interpretation" TEXT,
ADD COLUMN     "isOutsourced" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TestParameter" DROP COLUMN "deltaLimit",
DROP COLUMN "deltaType",
ADD COLUMN     "formula" TEXT;

-- CreateTable
CREATE TABLE "TestResult" (
    "id" SERIAL NOT NULL,
    "billItemId" INTEGER NOT NULL,
    "parameterId" INTEGER,
    "resultValue" TEXT,
    "flag" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_billItemId_fkey" FOREIGN KEY ("billItemId") REFERENCES "BillItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
