const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const {
  windowStartFor,
  bucketCompletionTrend,
  computeStatusDurations,
  buildStreakHeatmap,
  DAY_MS
} = require("../utils/statsAggregation");

const router = express.Router();
router.use(requireAuth);

const MAX_HEATMAP_DAYS = 365;

router.get("/overview", async (req, res) => {
  const window = req.query.window === "4w" ? "4w" : "all";

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const rawStart = windowStartFor(window, user.createdAt);
  const heatmapStart = new Date(Math.max(rawStart.getTime(), Date.now() - MAX_HEATMAP_DAYS * DAY_MS));

  const tasks = await prisma.task.findMany({
    where: { userId: req.userId, createdAt: { gte: rawStart } },
    include: { statusHistory: true }
  });

  const doneTransitions = await prisma.taskStatusHistory.findMany({
    where: { status: "DONE", changedAt: { gte: rawStart }, task: { userId: req.userId } },
    select: { changedAt: true }
  });
  const doneDates = doneTransitions.map(t => t.changedAt);

  // Completion trend
  const completionTrend = bucketCompletionTrend(doneDates, window);

  // Category breakdown
  const byCategory = new Map();
  for (const task of tasks) {
    const entry = byCategory.get(task.categoryId) || { categoryId: task.categoryId, totalCount: 0, completedCount: 0 };
    entry.totalCount += 1;
    if (task.status === "DONE") entry.completedCount += 1;
    byCategory.set(task.categoryId, entry);
  }
  const categoryBreakdown = Array.from(byCategory.values()).map(c => ({
    ...c,
    completionRate: c.totalCount > 0 ? Math.round((c.completedCount / c.totalCount) * 100) : 0
  }));

  // Time-in-status (avg days spent in IN_PROGRESS / BLOCKED), per category
  const durationsByCategory = new Map();
  for (const task of tasks) {
    const durations = computeStatusDurations(task);
    const entry = durationsByCategory.get(task.categoryId) || {
      categoryId: task.categoryId,
      inProgressDays: [],
      blockedDays: []
    };
    if (durations.IN_PROGRESS > 0) entry.inProgressDays.push(durations.IN_PROGRESS);
    if (durations.BLOCKED > 0) entry.blockedDays.push(durations.BLOCKED);
    durationsByCategory.set(task.categoryId, entry);
  }
  const average = arr => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const timeInStatus = Array.from(durationsByCategory.values())
    .map(e => ({
      categoryId: e.categoryId,
      avgDaysInProgress: Math.round(average(e.inProgressDays) * 10) / 10,
      avgDaysBlocked: Math.round(average(e.blockedDays) * 10) / 10
    }))
    .filter(e => e.avgDaysInProgress > 0 || e.avgDaysBlocked > 0);

  // Main vs Side balance (completed tasks in window)
  const mainSideBalance = { MAIN: 0, SIDE: 0 };
  for (const task of tasks) {
    if (task.status === "DONE") mainSideBalance[task.priorityType] += 1;
  }

  // Streak / consistency heatmap
  const streakHeatmap = buildStreakHeatmap(doneDates, heatmapStart);

  res.json({
    window,
    completionTrend,
    categoryBreakdown,
    timeInStatus,
    mainSideBalance,
    streakHeatmap
  });
});

module.exports = { router };
