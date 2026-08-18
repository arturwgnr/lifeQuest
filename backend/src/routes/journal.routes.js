const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { getWeeklyJournalInsight, getEntryInsight } = require("../lib/gemini");
const { checkAndConsumeAiCall } = require("../lib/aiUsage");
const { getTaskCompletionSummary } = require("../utils/statsAggregation");

const router = express.Router();
router.use(requireAuth);

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(dateStr) {
  if (!DATE_RE.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get("/entries", async (req, res) => {
  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.userId },
    orderBy: { entryDate: "desc" }
  });
  res.json({ entries });
});

router.get("/entries/:date", async (req, res) => {
  const entryDate = parseDateParam(req.params.date);
  if (!entryDate) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const entry = await prisma.journalEntry.findUnique({
    where: { userId_entryDate: { userId: req.userId, entryDate } }
  });
  if (!entry) return res.status(404).json({ error: "No entry for this date" });
  res.json({ entry });
});

router.put("/entries/:date", async (req, res) => {
  const entryDate = parseDateParam(req.params.date);
  if (!entryDate) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const { text, dayRating, moods } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });
  if (!Number.isInteger(dayRating) || dayRating < 1 || dayRating > 5) {
    return res.status(400).json({ error: "dayRating must be an integer from 1 to 5" });
  }

  const entry = await prisma.journalEntry.upsert({
    where: { userId_entryDate: { userId: req.userId, entryDate } },
    create: { userId: req.userId, entryDate, text, dayRating, moods: moods || [] },
    update: { text, dayRating, moods: moods || [] }
  });

  // Brief per-entry reflection, generated with memory of recent past entries.
  // Supplements (doesn't replace) the weekly insight, so failures here shouldn't fail the save.
  let entryWithInsight = entry;
  let aiLimitReached = false;

  const usage = await checkAndConsumeAiCall(req.userId);
  if (!usage.allowed) {
    aiLimitReached = true;
  } else {
    const sevenDaysBeforeEntry = new Date(entryDate.getTime() - 7 * DAY_MS);
    const [recentPastEntries, taskCompletionContext] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId: req.userId, entryDate: { lt: entryDate } },
        orderBy: { entryDate: "desc" },
        take: 7
      }),
      getTaskCompletionSummary(prisma, req.userId, sevenDaysBeforeEntry, entryDate)
    ]);

    try {
      const insightText = await getEntryInsight({
        newEntry: { entryDate: req.params.date, dayRating: entry.dayRating, moods: entry.moods, text: entry.text },
        recentEntries: recentPastEntries
          .slice()
          .reverse()
          .map(e => ({ entryDate: e.entryDate.toISOString().slice(0, 10), dayRating: e.dayRating, moods: e.moods, text: e.text })),
        taskCompletionContext
      });
      entryWithInsight = await prisma.journalEntry.update({ where: { id: entry.id }, data: { insightText } });
    } catch (err) {
      console.error("Per-entry insight generation failed:", err);
    }
  }

  res.json({ entry: entryWithInsight, aiLimitReached });
});

router.delete("/entries/:date", async (req, res) => {
  const entryDate = parseDateParam(req.params.date);
  if (!entryDate) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  await prisma.journalEntry.deleteMany({ where: { userId: req.userId, entryDate } });
  res.status(204).end();
});

router.get("/insights", async (req, res) => {
  const insights = await prisma.journalWeeklyInsight.findMany({
    where: { userId: req.userId },
    orderBy: { weekEnd: "desc" }
  });
  res.json({ insights });
});

// Called when the Journal tab is viewed. Generates a new weekly insight only if
// a week has passed since the last one and there's at least one entry to summarize.
router.post("/insights/generate", async (req, res) => {
  const latest = await prisma.journalWeeklyInsight.findFirst({
    where: { userId: req.userId },
    orderBy: { weekEnd: "desc" }
  });

  const now = new Date();
  if (latest && now.getTime() - new Date(latest.createdAt).getTime() < 7 * DAY_MS) {
    return res.json({ insight: latest, generated: false });
  }

  // Trailing 7-day window that includes today: [today - 6 days, tomorrow).
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const windowEnd = new Date(startOfToday.getTime() + DAY_MS);
  const windowStart = new Date(startOfToday.getTime() - 6 * DAY_MS);

  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.userId, entryDate: { gte: windowStart, lt: windowEnd } },
    orderBy: { entryDate: "asc" }
  });

  if (entries.length === 0) {
    return res.json({ insight: latest || null, generated: false });
  }

  const usage = await checkAndConsumeAiCall(req.userId);
  if (!usage.allowed) {
    return res.json({ insight: latest || null, generated: false, aiLimitReached: true });
  }

  const [stagnantTaskCount, taskCompletionContext] = await Promise.all([
    prisma.task.count({
      where: { userId: req.userId, status: { in: ["BLOCKED", "IN_PROGRESS"] } }
    }),
    getTaskCompletionSummary(prisma, req.userId, windowStart, windowEnd)
  ]);

  try {
    const summaryText = await getWeeklyJournalInsight({
      entries: entries.map(e => ({
        entryDate: e.entryDate.toISOString().slice(0, 10),
        dayRating: e.dayRating,
        moods: e.moods,
        text: e.text
      })),
      stagnantTaskCount,
      taskCompletionContext
    });

    const insight = await prisma.journalWeeklyInsight.create({
      data: { userId: req.userId, weekStart: windowStart, weekEnd: windowEnd, summaryText }
    });

    res.json({ insight, generated: true });
  } catch (err) {
    console.error("Weekly insight generation failed:", err);
    res.json({ insight: latest || null, generated: false });
  }
});

// Journal-specific stats, distinct from the app-wide task Stats tab.
router.get("/stats", async (req, res) => {
  const window = req.query.window === "4w" ? "4w" : "all";

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const windowStart = window === "4w" ? new Date(Date.now() - 28 * DAY_MS) : new Date(user.createdAt);

  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.userId, entryDate: { gte: windowStart } },
    orderBy: { entryDate: "asc" }
  });

  const ratingTrend = entries.map(e => ({
    date: e.entryDate.toISOString().slice(0, 10),
    dayRating: e.dayRating
  }));

  const moodCounts = new Map();
  for (const entry of entries) {
    for (const mood of entry.moods) {
      moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
    }
  }
  const moodFrequency = Array.from(moodCounts.entries())
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  const avgRating = entries.length > 0 ? entries.reduce((sum, e) => sum + e.dayRating, 0) / entries.length : 0;

  res.json({
    window,
    ratingTrend,
    moodFrequency,
    avgRating: Math.round(avgRating * 10) / 10,
    entryCount: entries.length
  });
});

module.exports = { router };
