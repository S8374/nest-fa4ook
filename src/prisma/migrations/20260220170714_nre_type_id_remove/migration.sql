/*
  Warnings:

  - You are about to drop the column `typeId` on the `properties` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "properties_typeId_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "typeId";
