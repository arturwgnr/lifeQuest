-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiCallsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "aiCallsToday" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PillarGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pillar" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPillarLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPillarLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPillarLogEntry" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "pillarId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyPillarLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PillarGroup_userId_idx" ON "PillarGroup"("userId");

-- CreateIndex
CREATE INDEX "Pillar_groupId_idx" ON "Pillar"("groupId");

-- CreateIndex
CREATE INDEX "DailyPillarLog_userId_idx" ON "DailyPillarLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPillarLog_userId_date_key" ON "DailyPillarLog"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyPillarLogEntry_logId_idx" ON "DailyPillarLogEntry"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPillarLogEntry_logId_pillarId_key" ON "DailyPillarLogEntry"("logId", "pillarId");

-- AddForeignKey
ALTER TABLE "PillarGroup" ADD CONSTRAINT "PillarGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pillar" ADD CONSTRAINT "Pillar_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PillarGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPillarLog" ADD CONSTRAINT "DailyPillarLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPillarLog" ADD CONSTRAINT "DailyPillarLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PillarGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPillarLogEntry" ADD CONSTRAINT "DailyPillarLogEntry_logId_fkey" FOREIGN KEY ("logId") REFERENCES "DailyPillarLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPillarLogEntry" ADD CONSTRAINT "DailyPillarLogEntry_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
