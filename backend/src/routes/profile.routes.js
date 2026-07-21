const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

// Consecutive-day streak of at least one task marked Done, ending today or
// yesterday (so the streak doesn't visually reset before the user has acted today).
function computeStreak(doneDateKeys) {
  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  if (!doneDateKeys.has(dateKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let streak = 0;
  while (doneDateKeys.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

router.get("/summary", async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { userId: req.userId } });
  const pending = tasks.filter(t => t.status !== "DONE");

  const pendingByCategory = {};
  const pendingByPriority = { MAIN: 0, SIDE: 0 };
  for (const task of pending) {
    pendingByCategory[task.categoryId] = (pendingByCategory[task.categoryId] || 0) + 1;
    pendingByPriority[task.priorityType] += 1;
  }

  const doneTransitions = await prisma.taskStatusHistory.findMany({
    where: { status: "DONE", task: { userId: req.userId } },
    select: { changedAt: true }
  });
  const doneDateKeys = new Set(doneTransitions.map(t => dateKey(t.changedAt)));

  res.json({
    pendingByCategory: Object.entries(pendingByCategory).map(([categoryId, count]) => ({ categoryId, count })),
    pendingByPriority,
    currentStreak: computeStreak(doneDateKeys),
    totalCompleted: tasks.filter(t => t.status === "DONE").length,
    totalActive: pending.length
  });
});

module.exports = { router };
