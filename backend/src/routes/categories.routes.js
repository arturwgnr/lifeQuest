const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" }
  });
  res.json({ categories });
});

router.post("/", async (req, res) => {
  const { name, icon, tone } = req.body;
  if (!name || !icon || !tone) {
    return res.status(400).json({ error: "name, icon and tone are required" });
  }

  const category = await prisma.category.create({
    data: { userId: req.userId, name, icon, tone }
  });
  res.status(201).json({ category });
});

router.patch("/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Category not found" });

  const { name, icon, tone } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (icon !== undefined) data.icon = icon;
  if (tone !== undefined) data.tone = tone;

  const updated = await prisma.category.update({ where: { id: existing.id }, data });
  res.json({ category: updated });
});

// Deleting a category that's still in use requires an explicit reassignToId,
// so tasks/suggestions are never silently orphaned.
router.delete("/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Category not found" });

  const totalCategories = await prisma.category.count({ where: { userId: req.userId } });
  if (totalCategories <= 1) {
    return res.status(400).json({ error: "Cannot delete your only remaining category" });
  }

  const { reassignToId } = req.body;

  const [taskCount, suggestionCount] = await Promise.all([
    prisma.task.count({ where: { userId: req.userId, categoryId: existing.id } }),
    prisma.oracleSuggestion.count({
      where: { categoryId: existing.id, message: { conversation: { userId: req.userId } } }
    })
  ]);

  if (taskCount + suggestionCount > 0) {
    if (!reassignToId) {
      return res.status(409).json({
        error: "Category is still in use",
        taskCount,
        suggestionCount
      });
    }
    if (reassignToId === existing.id) {
      return res.status(400).json({ error: "Cannot reassign to the category being deleted" });
    }
    const target = await prisma.category.findFirst({ where: { id: reassignToId, userId: req.userId } });
    if (!target) {
      return res.status(400).json({ error: "reassignToId does not reference an existing category" });
    }

    await prisma.task.updateMany({
      where: { userId: req.userId, categoryId: existing.id },
      data: { categoryId: reassignToId }
    });
    await prisma.oracleSuggestion.updateMany({
      where: { categoryId: existing.id, message: { conversation: { userId: req.userId } } },
      data: { categoryId: reassignToId }
    });
  }

  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).end();
});

module.exports = { router };
