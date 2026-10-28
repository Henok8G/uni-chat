-- Formalize Friendship and ChatMessage models (ARCH-001)
-- Non-destructive baseline & adoption for existing tables

-- 1. Create Friendship table if it does not exist
CREATE TABLE IF NOT EXISTS "Friendship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- 2. Create unique constraint & indexes for Friendship
CREATE UNIQUE INDEX IF NOT EXISTS "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");
CREATE INDEX IF NOT EXISTS "Friendship_userId_idx" ON "Friendship"("userId");
CREATE INDEX IF NOT EXISTS "Friendship_friendId_idx" ON "Friendship"("friendId");

-- 3. Add foreign keys for Friendship safely
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Friendship_userId_fkey'
    ) THEN
        ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Friendship_friendId_fkey'
    ) THEN
        ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey"
        FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Create ChatMessage table if it does not exist
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "groupId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN DEFAULT false,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- 5. Create indexes for ChatMessage
CREATE INDEX IF NOT EXISTS "ChatMessage_groupId_idx" ON "ChatMessage"("groupId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_sender_receiver_idx" ON "ChatMessage"("senderId", "receiverId", "createdAt");

-- 6. Add foreign keys for ChatMessage safely
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_senderId_fkey'
    ) THEN
        ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey"
        FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_receiverId_fkey'
    ) THEN
        ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey"
        FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_groupId_fkey'
    ) THEN
        ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_groupId_fkey"
        FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
