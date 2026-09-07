-- CreateEnum
CREATE TYPE "PerformanceMode" AS ENUM ('SOLO', 'DUO', 'BATTLE');

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN     "mode" "PerformanceMode" NOT NULL DEFAULT 'SOLO';
