-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "insightText" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileIcon" TEXT NOT NULL DEFAULT 'Shield';
