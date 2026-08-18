const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function windowStartFor(window, accountCreatedAt) {
  const now = new Date();
  if (window === "4w") return new Date(now.getTime() - 4 * WEEK_MS);
  return new Date(accountCreatedAt);
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// Weekly buckets for "4w", monthly buckets for "all" - keeps the trend chart legible either way.
function bucketCompletionTrend(doneDates, window) {
  const buckets = new Map();
  for (const d of doneDates) {
    const date = new Date(d);
    let label;
    if (window === "4w") {
      const weekStart = new Date(date);
      const dayOfWeek = (weekStart.getUTCDay() + 6) % 7;
      weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);
      label = dateKey(weekStart);
    } else {
      label = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }
    buckets.set(label, (buckets.get(label) || 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([periodLabel, count]) => ({ periodLabel, count }));
}

function computeStatusDurations(task) {
  const history = [...task.statusHistory].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
  const durations = { IN_PROGRESS: 0, BLOCKED: 0 };
  for (let i = 0; i < history.length; i++) {
    const current = history[i];
    const next = history[i + 1];
    if (current.status !== "IN_PROGRESS" && current.status !== "BLOCKED") continue;
    const start = new Date(current.changedAt).getTime();
    const end = next ? new Date(next.changedAt).getTime() : Date.now();
    durations[current.status] += (end - start) / DAY_MS;
  }
  return durations;
}

function buildStreakHeatmap(doneDates, startDate) {
  const counts = new Map();
  for (const d of doneDates) {
    const key = dateKey(d);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const days = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = dateKey(cursor);
    days.push({ date: key, count: counts.get(key) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// Day-by-day record of completed tasks in [startDate, endDate). Shared by the
// Stats task-history panel and the Journal AI insight context, so both read
// from the same TaskStatusHistory-derived source instead of duplicating logic.
async function getTaskCompletionSummary(prisma, userId, startDate, endDate) {
  const doneTransitions = await prisma.taskStatusHistory.findMany({
    where: {
      status: "DONE",
      changedAt: { gte: startDate, lt: endDate },
      task: { userId }
    },
    include: { task: { select: { title: true, categoryId: true, priorityType: true } } },
    orderBy: { changedAt: "asc" }
  });

  const byDay = new Map();
  for (const transition of doneTransitions) {
    const key = dateKey(transition.changedAt);
    if (!byDay.has(key)) byDay.set(key, { date: key, completedCount: 0, titles: [] });
    const bucket = byDay.get(key);
    bucket.completedCount += 1;
    bucket.titles.push(transition.task.title);
  }

  return Array.from(byDay.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

module.exports = {
  windowStartFor,
  dateKey,
  bucketCompletionTrend,
  computeStatusDurations,
  buildStreakHeatmap,
  getTaskCompletionSummary,
  DAY_MS
};
