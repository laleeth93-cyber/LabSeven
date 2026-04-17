-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "colCaption1" TEXT,
ADD COLUMN     "colCaption2" TEXT,
ADD COLUMN     "colCaption3" TEXT,
ADD COLUMN     "colCaption4" TEXT,
ADD COLUMN     "colCaption5" TEXT,
ADD COLUMN     "isFormulaNeeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labEquiName" TEXT,
ADD COLUMN     "reportTitle" TEXT;
