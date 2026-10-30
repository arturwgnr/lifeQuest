-- DropForeignKey
ALTER TABLE "DailyPillarLog" DROP CONSTRAINT "DailyPillarLog_groupId_fkey";

-- DropForeignKey
ALTER TABLE "DailyPillarLogEntry" DROP CONSTRAINT "DailyPillarLogEntry_pillarId_fkey";

-- AlterTable
ALTER TABLE "PillarGroup" ADD COLUMN     "stampIcon" TEXT,
ADD COLUMN     "stampTone" TEXT;

-- AlterTable
ALTER TABLE "DailyPillarLog" ADD COLUMN     "completedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DailyPillarLog" ADD CONSTRAINT "DailyPillarLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PillarGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPillarLogEntry" ADD CONSTRAINT "DailyPillarLogEntry_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: snapshot every existing report as it stands today, before any
-- pillar or group can be deleted, so past days keep their percentage.
UPDATE "DailyPillarLog" AS l
SET "totalCount" = counts.total,
    "completedCount" = counts.completed
FROM (
  SELECT "logId", COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "completed")::int AS completed
  FROM "DailyPillarLogEntry"
  GROUP BY "logId"
) AS counts
WHERE counts."logId" = l."id";

UPDATE "DailyPillarLog" AS l
SET "groupName" = g."name"
FROM "PillarGroup" AS g
WHERE g."id" = l."groupId";
