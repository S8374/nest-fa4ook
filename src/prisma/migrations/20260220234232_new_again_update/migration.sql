/*
  Warnings:

  - The values [RECEIVED] on the enum `MilestonePaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `milestone_payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `milestone_payments` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedById` on the `milestone_payments` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MilestonePaymentStatus_new" AS ENUM ('PENDING', 'AGENT_REVIEWED', 'VERIFIED', 'REJECTED');
ALTER TABLE "public"."milestone_payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "milestone_payments" ALTER COLUMN "status" TYPE "MilestonePaymentStatus_new" USING ("status"::text::"MilestonePaymentStatus_new");
ALTER TYPE "MilestonePaymentStatus" RENAME TO "MilestonePaymentStatus_old";
ALTER TYPE "MilestonePaymentStatus_new" RENAME TO "MilestonePaymentStatus";
DROP TYPE "public"."MilestonePaymentStatus_old";
ALTER TABLE "milestone_payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "milestone_payments" DROP CONSTRAINT "milestone_payments_verifiedById_fkey";

-- AlterTable
ALTER TABLE "milestone_payments" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "verifiedById",
ADD COLUMN     "adminId" UUID,
ADD COLUMN     "agentId" UUID,
ADD COLUMN     "agentReviewedAt" TIMESTAMP(3),
ADD COLUMN     "isReadByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReadByAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "milestone_payments_agentId_idx" ON "milestone_payments"("agentId");

-- CreateIndex
CREATE INDEX "milestone_payments_adminId_idx" ON "milestone_payments"("adminId");

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
