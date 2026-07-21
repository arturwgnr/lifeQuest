const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { getOracleResponse } = require("../lib/anthropic");

const router = express.Router();
router.use(requireAuth);

async function getOrCreateConversation(userId) {
  let conversation = await prisma.oracleConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (!conversation) {
    conversation = await prisma.oracleConversation.create({ data: { userId } });
  }
  return conversation;
}

async function loadMessages(conversationId) {
  return prisma.oracleMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { suggestions: true }
  });
}

router.get("/conversation", async (req, res) => {
  const conversation = await getOrCreateConversation(req.userId);
  const messages = await loadMessages(conversation.id);
  res.json({ conversationId: conversation.id, messages });
});

router.post("/messages", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const conversation = await getOrCreateConversation(req.userId);
  const priorMessages = await loadMessages(conversation.id);

  await prisma.oracleMessage.create({
    data: { conversationId: conversation.id, sender: "USER", text }
  });

  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({ where: { userId: req.userId }, include: { category: true } }),
    prisma.category.findMany({ where: { userId: req.userId } })
  ]);
  const existingTasks = tasks.map(t => ({ ...t, categoryName: t.category.name }));

  let oracleResult;
  try {
    oracleResult = await getOracleResponse({
      message: text,
      existingTasks,
      categories,
      history: priorMessages.map(m => ({ sender: m.sender, text: m.text }))
    });
  } catch (err) {
    console.error("Oracle LLM error:", err);
    const errorMessage = await prisma.oracleMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "ASSISTANT",
        text: "The Oracle could not reach its reasoning engine just now. Please try again shortly."
      }
    });
    return res.status(502).json({ conversationId: conversation.id, message: errorMessage, error: "oracle_unavailable" });
  }

  const categoryIdByName = new Map(categories.map(c => [c.name, c.id]));
  const fallbackCategoryId = categories[0]?.id;

  const assistantMessage = await prisma.oracleMessage.create({
    data: {
      conversationId: conversation.id,
      sender: "ASSISTANT",
      text: oracleResult.reply,
      suggestions: {
        create: oracleResult.suggestions.map(s => ({
          title: s.title,
          categoryId: categoryIdByName.get(s.category) || fallbackCategoryId,
          priorityType: s.priorityType,
          xpValue: s.xpValue,
          notes: s.notes || null
        }))
      }
    },
    include: { suggestions: true }
  });

  let questionMessage = null;
  if (oracleResult.question) {
    questionMessage = await prisma.oracleMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "ORACLE_QUESTION",
        text: oracleResult.question
      }
    });
  }

  res.status(201).json({
    conversationId: conversation.id,
    assistantMessage,
    questionMessage
  });
});

router.patch("/suggestions/:id", async (req, res) => {
  const suggestion = await prisma.oracleSuggestion.findFirst({
    where: {
      id: req.params.id,
      message: { conversation: { userId: req.userId } }
    }
  });
  if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
  if (suggestion.status !== "PENDING") {
    return res.status(409).json({ error: "Suggestion has already been resolved" });
  }

  const { title, categoryId, priorityType, xpValue, notes } = req.body;

  if (categoryId !== undefined) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
    if (!category) return res.status(400).json({ error: "categoryId does not reference an existing category" });
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (priorityType !== undefined) data.priorityType = priorityType;
  if (xpValue !== undefined) data.xpValue = xpValue;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.oracleSuggestion.update({ where: { id: suggestion.id }, data });
  res.json({ suggestion: updated });
});

// Approving is the ONLY path that ever inserts a suggestion into the real Task table.
router.post("/suggestions/:id/approve", async (req, res) => {
  const suggestion = await prisma.oracleSuggestion.findFirst({
    where: {
      id: req.params.id,
      message: { conversation: { userId: req.userId } }
    }
  });
  if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
  if (suggestion.status !== "PENDING") {
    return res.status(409).json({ error: "Suggestion has already been resolved" });
  }

  const task = await prisma.task.create({
    data: {
      userId: req.userId,
      title: suggestion.title,
      categoryId: suggestion.categoryId,
      priorityType: suggestion.priorityType,
      xpValue: suggestion.xpValue,
      notes: suggestion.notes,
      statusHistory: { create: { status: "TODO" } }
    }
  });

  const updatedSuggestion = await prisma.oracleSuggestion.update({
    where: { id: suggestion.id },
    data: { status: "APPROVED", createdTaskId: task.id, resolvedAt: new Date() }
  });

  res.json({ suggestion: updatedSuggestion, task });
});

router.post("/suggestions/:id/reject", async (req, res) => {
  const suggestion = await prisma.oracleSuggestion.findFirst({
    where: {
      id: req.params.id,
      message: { conversation: { userId: req.userId } }
    }
  });
  if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
  if (suggestion.status !== "PENDING") {
    return res.status(409).json({ error: "Suggestion has already been resolved" });
  }

  const updated = await prisma.oracleSuggestion.update({
    where: { id: suggestion.id },
    data: { status: "REJECTED", resolvedAt: new Date() }
  });

  res.json({ suggestion: updated });
});

module.exports = { router };
