-- AlterTable
ALTER TABLE "BillItem" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

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
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_billItemId_fkey" FOREIGN KEY ("billItemId") REFERENCES "BillItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
