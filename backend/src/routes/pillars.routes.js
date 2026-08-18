const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function parseDateParam(dateStr) {
  if (!DATE_RE.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function groupInclude() {
  return { pillars: { orderBy: { order: "asc" } } };
}

// --- Pillar Groups ---------------------------------------------------------

router.get("/groups", async (req, res) => {
  const groups = await prisma.pillarGroup.findMany({
    where: { userId: req.userId },
    include: groupInclude(),
    orderBy: { createdAt: "asc" }
  });
  res.json({ groups });
});

router.post("/groups", async (req, res) => {
  const { name, pillars } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

  const group = await prisma.pillarGroup.create({
    data: {
      userId: req.userId,
      name,
      isDefault: false,
      isActive: false,
      pillars: {
        create: (Array.isArray(pillars) ? pillars : []).map((p, index) => ({
          title: p.title,
          order: index
        }))
      }
    },
    include: groupInclude()
  });
  res.status(201).json({ group });
});

// Renames the group and/or reconciles its pillar list: existing pillars (matched
// by id) are updated in place, pillars without an id are created, and pillars
// previously in the group but missing from the payload are deleted - unless
// they already have logged history, in which case the request is rejected so
// past daily reports are never silently orphaned.
router.patch("/groups/:id", async (req, res) => {
  const existing = await prisma.pillarGroup.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: groupInclude()
  });
  if (!existing) return res.status(404).json({ error: "Pillar group not found" });

  const { name, pillars } = req.body;
  const data = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "name cannot be empty" });
    data.name = name;
  }

  if (pillars !== undefined) {
    const incoming = Array.isArray(pillars) ? pillars : [];
    const incomingIds = new Set(incoming.filter(p => p.id).map(p => p.id));
    const removedIds = existing.pillars.filter(p => !incomingIds.has(p.id)).map(p => p.id);

    if (removedIds.length > 0) {
      const entryCount = await prisma.dailyPillarLogEntry.count({ where: { pillarId: { in: removedIds } } });
      if (entryCount > 0) {
        return res.status(409).json({ error: "Cannot remove a pillar that already has logged history" });
      }
    }

    await prisma.$transaction([
      ...removedIds.map(id => prisma.pillar.delete({ where: { id } })),
      ...incoming
        .filter(p => p.id)
        .map((p, index) => prisma.pillar.update({ where: { id: p.id }, data: { title: p.title, order: index } })),
      ...incoming
        .filter(p => !p.id)
        .map((p, index) =>
          prisma.pillar.create({ data: { groupId: existing.id, title: p.title, order: index } })
        )
    ]);
  }

  if (Object.keys(data).length > 0) {
    await prisma.pillarGroup.update({ where: { id: existing.id }, data });
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

  const groups = await prisma.pillarGroup.findMany({
    where: { userId: req.userId },
    include: groupInclude(),
    orderBy: { createdAt: "asc" }
  });
  res.json({ groups });
});

router.delete("/groups/:id", async (req, res) => {
  const existing = await prisma.pillarGroup.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Pillar group not found" });

  const totalGroups = await prisma.pillarGroup.count({ where: { userId: req.userId } });
  if (totalGroups <= 1) {
    return res.status(400).json({ error: "Cannot delete your only remaining Pillar Group" });
  }
  if (existing.isActive) {
    return res.status(400).json({ error: "Cannot delete the currently active Pillar Group. Switch to another group first." });
  }

  const logCount = await prisma.dailyPillarLog.count({ where: { groupId: existing.id } });
  if (logCount > 0) {
    return res.status(409).json({ error: "Cannot delete a Pillar Group that already has daily report history" });
  }

  await prisma.pillarGroup.delete({ where: { id: existing.id } });
  res.status(204).end();
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
    include: { entries: { include: { pillar: true } } },
    orderBy: { date: "asc" }
  });
  res.json({ logs });
});

router.get("/logs/:date", async (req, res) => {
  const date = parseDateParam(req.params.date);
  if (!date) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const log = await prisma.dailyPillarLog.findUnique({
    where: { userId_date: { userId: req.userId, date } },
    include: { entries: { include: { pillar: true } } }
  });
  if (!log) return res.status(404).json({ error: "No report for this date" });
  res.json({ log });
});

router.put("/logs/:date", async (req, res) => {
  const date = parseDateParam(req.params.date);
  if (!date) return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });

  const { groupId, entries } = req.body;
  if (!groupId) return res.status(400).json({ error: "groupId is required" });
  if (!Array.isArray(entries)) return res.status(400).json({ error: "entries must be an array" });

  const group = await prisma.pillarGroup.findFirst({ where: { id: groupId, userId: req.userId } });
  if (!group) return res.status(400).json({ error: "groupId does not reference an existing Pillar Group" });

  const log = await prisma.dailyPillarLog.upsert({
    where: { userId_date: { userId: req.userId, date } },
    create: { userId: req.userId, date, groupId },
    update: { groupId }
  });

  await prisma.dailyPillarLogEntry.deleteMany({ where: { logId: log.id } });
  if (entries.length > 0) {
    await prisma.dailyPillarLogEntry.createMany({
      data: entries.map(e => ({ logId: log.id, pillarId: e.pillarId, completed: !!e.completed }))
    });
  }

  const fullLog = await prisma.dailyPillarLog.findUnique({
    where: { id: log.id },
    include: { entries: { include: { pillar: true } } }
  });
  res.json({ log: fullLog });
});

router.get("/summary", async (req, res) => {
  const logs = await prisma.dailyPillarLog.findMany({
    where: { userId: req.userId },
    include: { entries: true },
    orderBy: { date: "asc" }
  });

  const summary = logs.map(log => ({
    date: log.date.toISOString().slice(0, 10),
    totalCount: log.entries.length,
    completedCount: log.entries.filter(e => e.completed).length
  }));
  res.json({ summary });
});

module.exports = { router };
