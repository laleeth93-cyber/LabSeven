-- AlterTable
ALTER TABLE "TestParameter" ADD COLUMN     "headingText" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isHeading" BOOLEAN NOT NULL DEFAULT false;
