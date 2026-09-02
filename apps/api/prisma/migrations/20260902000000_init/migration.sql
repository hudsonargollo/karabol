-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATRON', 'VENUE_STAFF', 'VENUE_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "QueueEntryStatus" AS ENUM ('PENDING', 'PLAYING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RewardTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATRON',
    "venueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "posProvider" TEXT,
    "posApiKeyEncrypted" TEXT,
    "goldThreshold" INTEGER NOT NULL DEFAULT 90,
    "silverThreshold" INTEGER NOT NULL DEFAULT 75,
    "bronzeThreshold" INTEGER NOT NULL DEFAULT 60,
    "goldDiscountPercent" INTEGER NOT NULL DEFAULT 30,
    "silverDiscountPercent" INTEGER NOT NULL DEFAULT 20,
    "bronzeDiscountPercent" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'PENDING',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "queueEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "pitchAccuracy" DOUBLE PRECISION,
    "streakBonus" DOUBLE PRECISION,
    "tier" "RewardTier",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT,
    "tier" "RewardTier" NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "qrCode" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "posDiscountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_venueId_idx" ON "User"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE INDEX "Venue_slug_idx" ON "Venue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Table_qrToken_key" ON "Table"("qrToken");

-- CreateIndex
CREATE INDEX "Table_venueId_idx" ON "Table"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_venueId_label_key" ON "Table"("venueId", "label");

-- CreateIndex
CREATE INDEX "QueueEntry_venueId_status_idx" ON "QueueEntry"("venueId", "status");

-- CreateIndex
CREATE INDEX "QueueEntry_tableId_idx" ON "QueueEntry"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_queueEntryId_key" ON "Score"("queueEntryId");

-- CreateIndex
CREATE INDEX "Score_userId_idx" ON "Score"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRedemption_scoreId_key" ON "RewardRedemption"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRedemption_qrCode_key" ON "RewardRedemption"("qrCode");

-- CreateIndex
CREATE INDEX "RewardRedemption_userId_idx" ON "RewardRedemption"("userId");

-- CreateIndex
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");

-- CreateIndex
CREATE INDEX "Attendance_tableId_idx" ON "Attendance"("tableId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "QueueEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

