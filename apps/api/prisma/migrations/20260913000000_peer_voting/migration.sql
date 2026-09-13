-- 3.4 Peer voting replaces DSP scoring (see packages/shared/src/voting.ts).
-- Score becomes the frozen vote tally; the old DSP columns stay nullable and unused.

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN "votingClosesAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Score" ADD COLUMN "voteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "averageVote" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PerformanceVote" (
    "id" TEXT NOT NULL,
    "queueEntryId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceVote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PerformanceVote_value_range" CHECK ("value" BETWEEN 1 AND 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceVote_queueEntryId_voterId_key" ON "PerformanceVote"("queueEntryId", "voterId");

-- CreateIndex
CREATE INDEX "PerformanceVote_queueEntryId_idx" ON "PerformanceVote"("queueEntryId");

-- CreateIndex
CREATE INDEX "PerformanceVote_voterId_idx" ON "PerformanceVote"("voterId");

-- AddForeignKey
ALTER TABLE "PerformanceVote" ADD CONSTRAINT "PerformanceVote_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "QueueEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceVote" ADD CONSTRAINT "PerformanceVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
