-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "appliedCommissionPct" DOUBLE PRECISION,
ADD COLUMN     "exchangeRateUsed" DOUBLE PRECISION,
ADD COLUMN     "paymentChannelKey" TEXT,
ADD COLUMN     "side" TEXT;

-- CreateTable
CREATE TABLE "PaymentChannel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "commissionBuyPercent" DOUBLE PRECISION NOT NULL,
    "commissionSellPercent" DOUBLE PRECISION NOT NULL,
    "enabledBuy" BOOLEAN NOT NULL DEFAULT true,
    "enabledSell" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "statusTextBuy" TEXT,
    "statusTextSell" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentChannel_key_key" ON "PaymentChannel"("key");
