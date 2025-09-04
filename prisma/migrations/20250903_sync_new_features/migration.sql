-- AlterTable
ALTER TABLE "ExchangeRate" ADD COLUMN     "buyRate" DOUBLE PRECISION,
ADD COLUMN     "sellRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "appliedFixedFee" DOUBLE PRECISION,
ADD COLUMN     "paymentChannelId" TEXT,
ADD COLUMN     "profit" DOUBLE PRECISION,
ALTER COLUMN "platform" DROP NOT NULL,
ALTER COLUMN "paypalEmail" DROP NOT NULL,
ALTER COLUMN "wallet" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentChannel" ADD COLUMN     "providerFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentChannelId_createdAt_idx" ON "Order"("paymentChannelId", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentChannelId_fkey" FOREIGN KEY ("paymentChannelId") REFERENCES "PaymentChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

