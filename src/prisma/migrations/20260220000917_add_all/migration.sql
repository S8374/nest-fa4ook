/*
  Warnings:

  - You are about to drop the column `projectId` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `districts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "districts" DROP CONSTRAINT "districts_cityId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_cityId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_developerId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_districtId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_districtId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_projectId_fkey";

-- DropIndex
DROP INDEX "properties_projectId_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "projectId",
ADD COLUMN     "availableUnits" INTEGER,
ADD COLUMN     "developerId" UUID,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "totalUnits" INTEGER,
ADD COLUMN     "type" "ProjectType" NOT NULL DEFAULT 'OFF_PLAN';

-- DropTable
DROP TABLE "cities";

-- DropTable
DROP TABLE "districts";

-- DropTable
DROP TABLE "projects";

-- CreateIndex
CREATE INDEX "properties_developerId_idx" ON "properties"("developerId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
