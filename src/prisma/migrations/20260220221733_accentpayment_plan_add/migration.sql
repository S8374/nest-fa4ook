-- CreateTable
CREATE TABLE "payment_plan_acceptances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyerId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "paymentPlanId" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedById" UUID,

    CONSTRAINT "payment_plan_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_plan_acceptances_buyerId_propertyId_paymentPlanId_key" ON "payment_plan_acceptances"("buyerId", "propertyId", "paymentPlanId");

-- AddForeignKey
ALTER TABLE "payment_plan_acceptances" ADD CONSTRAINT "payment_plan_acceptances_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plan_acceptances" ADD CONSTRAINT "payment_plan_acceptances_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plan_acceptances" ADD CONSTRAINT "payment_plan_acceptances_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "payment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plan_acceptances" ADD CONSTRAINT "payment_plan_acceptances_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
