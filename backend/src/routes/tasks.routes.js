const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { withComputedFlags, chainCompletion } = require("../utils/procrastination");
const { applyXpGain } = require("../utils/xp");

const router = express.Router();
router.use(requireAuth);

const DEFAULT_XP = { MAIN: 60, SIDE: 25 };

function serializeTask(task, allTasks) {
  const withFlags = withComputedFlags(task);
  const hasSubtasks = allTasks.some(t => t.parentTaskId === task.id);
  return {
    ...withFlags,
    chain: hasSubtasks ? chainCompletion(task.id, allTasks) : null
  };
}

// List all tasks for the logged-in user, with computed procrastination flags and chain progress
router.get("/", async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ tasks: tasks.map(t => serializeTask(t, tasks)) });
});

router.get("/:id", async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } }
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const allTasks = await prisma.task.findMany({ where: { userId: req.userId } });
  res.json({ task: serializeTask(task, allTasks) });
});

router.post("/", async (req, res) => {
  const { title, categoryId, priorityType, notes, dueDate, parentTaskId, xpValue } = req.body;

  if (!title || !categoryId || !priorityType) {
    return res.status(400).json({ error: "title, categoryId and priorityType are required" });
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
  if (!category) return res.status(400).json({ error: "categoryId does not reference an existing category" });

  if (parentTaskId) {
    const parent = await prisma.task.findFirst({ where: { id: parentTaskId, userId: req.userId } });
    if (!parent) return res.status(400).json({ error: "parentTaskId does not reference an existing task" });
  }

  const resolvedXp = Number.isFinite(xpValue) ? xpValue : DEFAULT_XP[priorityType] ?? 25;

  const task = await prisma.task.create({
    data: {
      userId: req.userId,
      title,
      categoryId,
      priorityType,
      xpValue: resolvedXp,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      parentTaskId: parentTaskId || null,
      statusHistory: { create: { status: "TODO" } }
    }
  });

  const allTasks = await prisma.task.findMany({ where: { userId: req.userId } });
  res.status(201).json({ task: serializeTask(task, allTasks) });
});

// Bulk action: persist Planning Mode's custom sequence in one round trip.
// Declared before /:id so this literal path isn't swallowed by the :id param route.
router.patch("/reorder", async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: "order must be a non-empty array of task ids" });
  }

  const owned = await prisma.task.findMany({
    where: { id: { in: order }, userId: req.userId },
    select: { id: true }
  });
  if (owned.length !== order.length) {
    return res.status(400).json({ error: "order contains task ids that don't exist or aren't yours" });
  }

  await prisma.$transaction(
    order.map((id, index) => prisma.task.update({ where: { id }, data: { planningOrder: index } }))
  );

  const tasks = await prisma.task.findMany({ where: { userId: req.userId } });
  res.json({ tasks: tasks.map(t => serializeTask(t, tasks)) });
});

router.patch("/:id", async (req, res) => {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const { title, categoryId, priorityType, notes, dueDate, parentTaskId, status } = req.body;

  if (parentTaskId) {
    if (parentTaskId === existing.id) {
      return res.status(400).json({ error: "A task cannot be its own parent" });
    }
    const parent = await prisma.task.findFirst({ where: { id: parentTaskId, userId: req.userId } });
    if (!parent) return res.status(400).json({ error: "parentTaskId does not reference an existing task" });
  }

  if (categoryId !== undefined) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
    if (!category) return res.status(400).json({ error: "categoryId does not reference an existing category" });
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (priorityType !== undefined) data.priorityType = priorityType;
  if (notes !== undefined) data.notes = notes;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (parentTaskId !== undefined) data.parentTaskId = parentTaskId || null;

  const statusChanged = status !== undefined && status !== existing.status;
  if (statusChanged) {
    data.status = status;
    data.statusHistory = { create: { status } };
  }

  const updated = await prisma.task.update({ where: { id: existing.id }, data });

  let leveledUpTo = null;
  if (statusChanged && status === "DONE" && existing.status !== "DONE") {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const gain = applyXpGain(user, existing.xpValue);
    await prisma.user.update({
      where: { id: req.userId },
      data: { xp: gain.xp, level: gain.level, avatarStage: gain.avatarStage }
    });
    if (gain.leveledUp) leveledUpTo = gain.level;
  }

  const allTasks = await prisma.task.findMany({ where: { userId: req.userId } });
  res.json({ task: serializeTask(updated, allTasks), leveledUpTo });
});

// Quick action: change status without opening the full detail view
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status is required" });

  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  if (status === existing.status) {
    const allTasks = await prisma.task.findMany({ where: { userId: req.userId } });
    return res.json({ task: serializeTask(existing, allTasks), leveledUpTo: null });
  }

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: { status, statusHistory: { create: { status } } }
  });

  let leveledUpTo = null;
  if (status === "DONE" && existing.status !== "DONE") {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const gain = applyXpGain(user, existing.xpValue);
    await prisma.user.update({
      where: { id: req.userId },
      data: { xp: gain.xp, level: gain.level, avatarStage: gain.avatarStage }
    });
    if (gain.leveledUp) leveledUpTo = gain.level;
  }

  const allTasks = await prisma.task.findMany({ where: { userId: req.userId } });
  res.json({ task: serializeTask(updated, allTasks), leveledUpTo });
});

// Bulk action: wipe every completed task at once. Declared before /:id so
// this literal path isn't swallowed by the :id param route.
router.delete("/completed", async (req, res) => {
  const completed = await prisma.task.findMany({
    where: { userId: req.userId, status: "DONE" },
    select: { id: true }
  });
  const ids = completed.map(t => t.id);

  if (ids.length === 0) return res.json({ deletedCount: 0 });

  // Detach any children of a deleted completed task, same as the single-delete route
  await prisma.task.updateMany({ where: { parentTaskId: { in: ids } }, data: { parentTaskId: null } });
  const result = await prisma.task.deleteMany({ where: { id: { in: ids } } });

  res.json({ deletedCount: result.count });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  // Detach children rather than cascading, so a chain survives losing its parent
  await prisma.task.updateMany({ where: { parentTaskId: existing.id }, data: { parentTaskId: null } });
  await prisma.task.delete({ where: { id: existing.id } });

  res.status(204).end();
});

module.exports = { router };
