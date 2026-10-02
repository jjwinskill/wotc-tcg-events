-- AlterTable
ALTER TABLE "GameFormat" ADD COLUMN     "defaultCapacity" INTEGER;

ALTER TABLE "GameFormat" ADD CONSTRAINT "GameFormat_defaultCapacity_check" CHECK ("defaultCapacity" BETWEEN 1 AND 30);
