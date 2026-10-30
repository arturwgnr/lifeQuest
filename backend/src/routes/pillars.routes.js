const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { parseStamp } = require("../lib/stamps");

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function parseDateParam(dateStr) {
  if (!DATE_RE.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "Today" is the user's calendar day, which only the client knows (the
// server runs in UTC). Falls back to the UTC date when it isn't sent.
function parseToday(value) {
  return (typeof value === "string" && parseDateParam(value)) || parseDateParam(new Date().toISOString().slice(0, 10));
}

// _count lets the UI say "this pillar has 23 logged days" before a delete
function groupInclude() {
  return {
    pillars: { orderBy: { order: "asc" }, include: { _count: { select: { entries: true } } } },
    _count: { select: { logs: true } }
  };
}

function listGroups(userId) {
  return prisma.pillarGroup.findMany({
    where: { userId },
    include: groupInclude(),
    orderBy: { createdAt: "asc" }
  });
}

function logInclude() {
  return {
    entries: { include: { pillar: true } },
    group: { select: { id: true, name: true, stampIcon: true, stampTone: true } }
  };
}

function findOwnedPillar(pillarId, userId) {
  return prisma.pillar.findFirst({ where: { id: pillarId, group: { userId } } });
}

// Removes pillars (their log entries cascade) inside a transaction. Past days
// keep the completed/total snapshot they were reported with; only reports
// from `today` onward are recounted, so a deleted pillar stops counting from
// the day of deletion without rewriting the calendar behind it.
async function removePillars(tx, pillarIds, today) {
  if (pillarIds.length === 0) return;
  const affected = await tx.dailyPillarLog.findMany({
    where: { date: { gte: today }, entries: { some: { pillarId: { in: pillarIds } } } },
    include: { entries: true }
  });
  for (const log of affected) {
    const remaining = log.entries.filter(e => !pillarIds.includes(e.pillarId));
    await tx.dailyPillarLog.update({
      where: { id: log.id },
      data: { totalCount: remaining.length, completedCount: remaining.filter(e => e.completed).length }
    });
  }
  await tx.pillar.deleteMany({ where: { id: { in: pillarIds } } });
}

function cleanTitle(title) {
  return typeof title === "string" ? title.trim() : "";
}

// --- Pillar Groups ---------------------------------------------------------

router.get("/groups", async (req, res) => {
  res.json({ groups: await listGroups(req.userId) });
});

router.post("/groups", async (req, res) => {
  const { name, pillars } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });
  const stamp = parseStamp(req.body);
  if (stamp.error) return res.status(400).json({ error: stamp.error });

  const group = await prisma.pillarGroup.create({
    data: {
      userId: req.userId,
      name: name.trim(),
      isDefault: false,
      isActive: false,
      ...stamp.data,
      pillars: {
        create: (Array.isArray(pillars) ? pillars : [])
          .map(p => cleanTitle(p.title))
          .filter(Boolean)
          .map((title, index) => ({ title, order: index }))
      }
    },
    include: groupInclude()
  });
  res.status(201).json({ group });
});

// Updates the group's name/stamp and, when `pillars` is sent, reconciles its
// pillar list: existing pillars (matched by id) are renamed and reordered in
// place, pillars without an id are created, and pillars missing from the
// payload are deleted, even when they already have logged history (past days
// keep their snapshot, see removePillars). All of it in one transaction.
router.patch("/groups/:id", async (req, res) => {
  const existing = await prisma.pillarGroup.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { pillars: true }
  });
  if (!existing) return res.status(404).json({ error: "Pillar group not found" });

  const { name, pillars } = req.body;
  const stamp = parseStamp(req.body);
  if (stamp.error) return res.status(400).json({ error: stamp.error });

  const data = { ...stamp.data };
  if (name !== undefined) {
    if (!name || !name.trim()) return res.status(400).json({ error: "name cannot be empty" });
    data.name = name.trim();
  }

  const ownIds = new Set(existing.pillars.map(p => p.id));
  const incoming = pillars === undefined ? null : (Array.isArray(pillars) ? pillars : []).filter(p => cleanTitle(p.title));
  if (incoming && incoming.some(p => p.id && !ownIds.has(p.id))) {
    return res.status(400).json({ error: "pillars contains an id that doesn't belong to this group" });
  }

  try {
    await prisma.$transaction(async tx => {
      if (Object.keys(data).length > 0) {
        await tx.pillarGroup.update({ where: { id: existing.id }, data });
        // Keep the snapshot name current, so the label survives a later delete
        if (data.name) await tx.dailyPillarLog.updateMany({ where: { groupId: existing.id }, data: { groupName: data.name } });
      }
      if (incoming) {
        const keptIds = new Set(incoming.filter(p => p.id).map(p => p.id));
        const removedIds = existing.pillars.filter(p => !keptIds.has(p.id)).map(p => p.id);
        await removePillars(tx, removedIds, parseToday(req.body.today));
        for (const [index, p] of incoming.entries()) {
          if (p.id) {
            await tx.pillar.update({ where: { id: p.id }, data: { title: cleanTitle(p.title), order: index } });
          } else {
            await tx.pillar.create({ data: { groupId: existing.id, title: cleanTitle(p.title), order: index } });
          }
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pillar group could not be updated, nothing was changed" });
  }

  const group = await prisma.pillarGroup.findUnique({ where: { id: existing.id }, include: groupInclude() });
  res.json({ group });
});

router.patch("/groups/:id/activate", async (req, res) => {
  const existing = await prisma.pillarGroup.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Pillar group not found" });

  await prisma.$transaction([
    prisma.pillarGroup.updateMany({ where: { userId: req.userId, isActive: true }, data: { isActive: false } }),
    prisma.pillarGroup.update({ where: { id: existing.id }, data: { isActive: true } })
  ]);

  res.json({ groups: await listGroups(req.userId) });
});

// Deletes a group at any time, history included. Its pillars and their
// entries go with it; its daily reports stay on the calendar with their
// snapshot score and name (groupId becomes null). Deleting the active group
// hands "active" to the oldest remaining one in the same transaction. Only
// the very last group is kept, since Pillars Mode needs one to report with.
router.delete("/groups/:id", async (req, res) => {
  const existing = await prisma.pillarGroup.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Pillar group not found" });

  const others = await prisma.pillarGroup.findMany({
    where: { userId: req.userId, id: { not: existing.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });
  if (others.length === 0) {
    return res.status(400).json({ error: "This is your only Pillar Group. Create another one before deleting it." });
  }

  try {
    await prisma.$transaction(async tx => {
      await tx.dailyPillarLog.updateMany({ where: { groupId: existing.id }, data: { groupName: existing.name } });
      await tx.pillarGroup.delete({ where: { id: existing.id } });
      if (existing.isActive) await tx.pillarGroup.update({ where: { id: others[0].id }, data: { isActive: true } });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pillar group could not be deleted, nothing was changed" });
  }

  res.json({ groups: await listGroups(req.userId) });
});

// --- Individual pillars ----------------------------------------------------

// Adds a pillar to a group at any time. It counts from today onward: past
// reports keep their snapshot, so their percentage and color don't move.
router.post("/groups/:id/pillars", async (req, res) => {
  const group = await prisma.pillarGroup.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!group) return res.status(404).json({ error: "Pillar group not found" });
  const title = cleanTitle(req.body.title);
  if (!title) return res.status(400).json({ error: "title is required" });

  const last = await prisma.pillar.findFirst({ where: { groupId: group.id }, orderBy: { order: "desc" } });
  const pillar = await prisma.pillar.create({
    data: { groupId: group.id, title, order: last ? last.order + 1 : 0 },
    include: { _count: { select: { entries: true } } }
  });
  res.status(201).json({ pillar });
});

// Renames a pillar (shown with the new name everywhere, past days included,
// since entries link to it) and/or moves it to a new position in its group.
router.patch("/pillars/:id", async (req, res) => {
  const existing = await findOwnedPillar(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Pillar not found" });

  const { title, order } = req.body;
  if (title !== undefined && !cleanTitle(title)) return res.status(400).json({ error: "title cannot be empty" });

  try {
    await prisma.$transaction(async tx => {
      if (title !== undefined) await tx.pillar.update({ where: { id: existing.id }, data: { title: cleanTitle(title) } });
      if (Number.isInteger(order)) {
        const siblings = await tx.pillar.findMany({ where: { groupId: existing.groupId }, orderBy: { order: "asc" } });
        const ids = siblings.map(p => p.id).filter(id => id !== existing.id);
        ids.splice(Math.max(0, Math.min(order, ids.length)), 0, existing.id);
        for (const [index, id] of ids.entries()) {
          await tx.pillar.update({ where: { id }, data: { order: index } });
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pillar could not be updated, nothing was changed" });
  }

  const group = await prisma.pillarGroup.findUnique({ where: { id: existing.groupId }, include: groupInclude() });
  res.json({ group });
});

// Deletes a pillar at any time, logged history included (see removePillars).
// ?today=YYYY-MM-DD is the client's calendar day.
router.delete("/pillars/:id", async (req, res) => {
  const existing = await findOwnedPillar(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Pillar not found" });

  try {
    await prisma.$transaction(tx => removePillars(tx, [existing.id], parseToday(req.query.today)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pillar could not be deleted, nothing was changed" });
  }

  const group = await prisma.pillarGroup.findUnique({ where: { id: existing.groupId }, include: groupInclude() });
  res.json({ group });
});

// --- Daily logs --------------------------------------------------------

router.get("/logs", async (req, res) => {
  const month = req.query.month;
  const where = { userId: req.userId };
  if (month) {
    if (!MONTH_RE.test(month)) return res.status(400).json({ error: "month must be in YYYY-MM format" });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    where.date = { gte: start, lt: end };
  }

  const logs = await prisma.dailyPillarLog.findMany({
    where,
    include: logInclude(),
    orderBy: { date: "asc" }
  });
  res.json({ logs });
});

router.get("/logs/:date", async (req, res) => {
  const date = parseDateParam(req.params.date);
  if (!date) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const log = await prisma.dailyPillarLog.findUnique({
    where: { userId_date: { userId: req.userId, date } },
    include: logInclude()
  });
  if (!log) return res.status(404).json({ error: "No report for this date" });
  res.json({ log });
});

// Saves a day's report and its snapshot (completed/total at save time), which
// is what the calendar shows from then on.
router.put("/logs/:date", async (req, res) => {
  const date = parseDateParam(req.params.date);
  if (!date) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const { groupId, entries } = req.body;
  if (!groupId) return res.status(400).json({ error: "groupId is required" });
  if (!Array.isArray(entries)) return res.status(400).json({ error: "entries must be an array" });

  const group = await prisma.pillarGroup.findFirst({
    where: { id: groupId, userId: req.userId },
    include: { pillars: { select: { id: true } } }
  });
  if (!group) return res.status(400).json({ error: "groupId does not reference an existing Pillar Group" });

  // Only pillars that still belong to this group are kept (a pillar deleted
  // in another tab while this report was open is simply dropped)
  const groupPillarIds = new Set(group.pillars.map(p => p.id));
  const validEntries = entries.filter(e => groupPillarIds.has(e.pillarId));
  const snapshot = {
    groupId,
    groupName: group.name,
    totalCount: validEntries.length,
    completedCount: validEntries.filter(e => e.completed).length
  };

  const fullLog = await prisma.$transaction(async tx => {
    const log = await tx.dailyPillarLog.upsert({
      where: { userId_date: { userId: req.userId, date } },
      create: { userId: req.userId, date, ...snapshot },
      update: snapshot
    });
    await tx.dailyPillarLogEntry.deleteMany({ where: { logId: log.id } });
    if (validEntries.length > 0) {
      await tx.dailyPillarLogEntry.createMany({
        data: validEntries.map(e => ({ logId: log.id, pillarId: e.pillarId, completed: !!e.completed }))
      });
    }
    return tx.dailyPillarLog.findUnique({ where: { id: log.id }, include: logInclude() });
  });
  res.json({ log: fullLog });
});

// Deletes one day's report (the log and its entries) and nothing else: the
// pillar group and every other day are untouched. Scoped by userId, so a
// date can only ever match the caller's own log.
router.delete("/logs/:date", async (req, res) => {
  const date = parseDateParam(req.params.date);
  if (!date) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

  try {
    const result = await prisma.dailyPillarLog.deleteMany({ where: { userId: req.userId, date } });
    if (result.count === 0) return res.status(404).json({ error: "No report for this day" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Report could not be deleted" });
  }
});

// Calendar data: each day's snapshot score plus its day type (name + stamp).
// A day whose group was deleted keeps its snapshot name, with no stamp.
router.get("/summary", async (req, res) => {
  const logs = await prisma.dailyPillarLog.findMany({
    where: { userId: req.userId },
    include: { group: { select: { id: true, name: true, stampIcon: true, stampTone: true } } },
    orderBy: { date: "asc" }
  });

  const summary = logs.map(log => ({
    date: log.date.toISOString().slice(0, 10),
    groupId: log.groupId,
    groupName: log.group?.name ?? log.groupName ?? null,
    groupDeleted: !log.group,
    stampIcon: log.group?.stampIcon ?? null,
    stampTone: log.group?.stampTone ?? null,
    totalCount: log.totalCount,
    completedCount: log.completedCount
  }));
  res.json({ summary });
});

module.exports = { router };
