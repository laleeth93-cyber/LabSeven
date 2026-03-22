-- AlterTable
ALTER TABLE "Parameter" ADD COLUMN     "colCaption1" TEXT,
ADD COLUMN     "colCaption2" TEXT,
ADD COLUMN     "colCaption3" TEXT,
ADD COLUMN     "colCaption4" TEXT,
ADD COLUMN     "colCaption5" TEXT,
ADD COLUMN     "isFormula" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reportTitle" TEXT;

-- AlterTable
ALTER TABLE "ParameterRange" ADD COLUMN     "abnormalValue" TEXT,
ADD COLUMN     "normalValue" TEXT;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "barcodeCopies" INTEGER DEFAULT 1,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDays" INTEGER DEFAULT 0,
ADD COLUMN     "maxHours" INTEGER DEFAULT 0,
ADD COLUMN     "maxMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "minDays" INTEGER DEFAULT 0,
ADD COLUMN     "minHours" INTEGER DEFAULT 0,
ADD COLUMN     "minMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "resultType" TEXT DEFAULT 'Parameter',
ADD COLUMN     "sampleVolume" TEXT,
ADD COLUMN     "specimen" TEXT,
ADD COLUMN     "template" TEXT DEFAULT 'Default',
ADD COLUMN     "vacutainer" TEXT;

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specimen" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "container" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacutainer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacutainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Method" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UOM" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Multivalue" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Multivalue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Specimen_code_key" ON "Specimen"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Vacutainer_code_key" ON "Vacutainer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Method_code_key" ON "Method"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UOM_code_key" ON "UOM"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_code_key" ON "Operator"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Multivalue_code_key" ON "Multivalue"("code");
