-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
