-- AlterTable
ALTER TABLE "Parameter" ADD COLUMN     "ageUnit" TEXT DEFAULT 'Years',
ADD COLUMN     "highMessage" TEXT,
ADD COLUMN     "lowMessage" TEXT,
ADD COLUMN     "maxAge" INTEGER DEFAULT 100,
ADD COLUMN     "minAge" INTEGER DEFAULT 0,
ADD COLUMN     "options" TEXT[],
ADD COLUMN     "panicMessage" TEXT;

-- CreateTable
CREATE TABLE "ParameterRange" (
    "id" SERIAL NOT NULL,
    "parameterId" INTEGER NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'Both',
    "minAge" INTEGER NOT NULL DEFAULT 0,
    "maxAge" INTEGER NOT NULL DEFAULT 100,
    "minAgeUnit" TEXT NOT NULL DEFAULT 'Years',
    "maxAgeUnit" TEXT NOT NULL DEFAULT 'Years',
    "normalOperator" TEXT NOT NULL DEFAULT 'Between',
    "lowRange" DOUBLE PRECISION,
    "highRange" DOUBLE PRECISION,
    "normalRange" TEXT,
    "criticalOperator" TEXT DEFAULT 'Between',
    "criticalLow" DOUBLE PRECISION,
    "criticalHigh" DOUBLE PRECISION,
    "criticalValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParameterRange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParameterRange" ADD CONSTRAINT "ParameterRange_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
