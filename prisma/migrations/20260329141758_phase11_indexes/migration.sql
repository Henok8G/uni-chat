-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('NUDITY', 'HARASSMENT', 'SPAM', 'HATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SessionEndedReason" AS ENUM ('NORMAL', 'NEXT', 'DISCONNECT', 'REPORTED', 'BANNED', 'ERROR');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "chatSessionId" TEXT,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "handledByAdminId" TEXT,
ADD COLUMN     "reasonCategory" "ReasonCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
ALTER COLUMN "roomId" DROP NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "year" INTEGER;

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "endedReason" "SessionEndedReason",
    "ipA" TEXT,
    "ipB" TEXT,
    "planA" "Plan" NOT NULL DEFAULT 'FREE',
    "planB" "Plan" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatSession_startedAt_idx" ON "ChatSession"("startedAt");

-- CreateIndex
CREATE INDEX "ChatSession_userAId_idx" ON "ChatSession"("userAId");

-- CreateIndex
CREATE INDEX "ChatSession_userBId_idx" ON "ChatSession"("userBId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
