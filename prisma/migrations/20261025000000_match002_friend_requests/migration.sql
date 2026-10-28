-- Phase 6B: Mutual Friendship Request System (MATCH-002)
-- Idempotent, non-destructive migration

-- 1. Create FriendRequestStatus enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FriendRequestStatus') THEN
        CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
    END IF;
END $$;

-- 2. Add FRIEND_REQUEST to NotificationType if not exists
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST';

-- 3. Create FriendRequest table if not exists
CREATE TABLE IF NOT EXISTS "FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- 4. Create unique constraint & indexes for FriendRequest
CREATE UNIQUE INDEX IF NOT EXISTS "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");
CREATE INDEX IF NOT EXISTS "FriendRequest_receiverId_status_idx" ON "FriendRequest"("receiverId", "status");
CREATE INDEX IF NOT EXISTS "FriendRequest_senderId_status_idx" ON "FriendRequest"("senderId", "status");
CREATE INDEX IF NOT EXISTS "FriendRequest_createdAt_idx" ON "FriendRequest"("createdAt");

-- 5. Add foreign keys safely
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FriendRequest_senderId_fkey'
    ) THEN
        ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey"
        FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FriendRequest_receiverId_fkey'
    ) THEN
        ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey"
        FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
