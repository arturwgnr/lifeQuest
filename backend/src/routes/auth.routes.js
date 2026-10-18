const express = require("express");
const { prisma } = require("../lib/prisma");
const {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie
} = require("../lib/auth");
const { requireAuth } = require("../middleware/requireAuth");
const { DEFAULT_CATEGORIES } = require("../lib/defaultCategories");
const { DEFAULT_PILLARS } = require("../lib/defaultPillars");
const { displayStage } = require("../utils/xp");

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    gender: user.gender,
    xp: user.xp,
    level: user.level,
    avatarStage: displayStage(user),
    profileIcon: user.profileIcon
  };
}

// Creates a new account. Any number of independent users may register; each
// gets their own tasks, categories, journal, etc., isolated by userId.
router.post("/register", async (req, res) => {
  const { email, password, name, gender } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password and name are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      gender: gender || "NEUTRAL",
      categories: { create: DEFAULT_CATEGORIES },
      pillarGroups: {
        create: {
          name: "Everyday",
          isDefault: true,
          isActive: true,
          pillars: { create: DEFAULT_PILLARS }
        }
      }
    }
  });

  setSessionCookie(res, user.id);
  res.status(201).json({ user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  setSessionCookie(res, user.id);
  res.json({ user: toPublicUser(user) });
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: toPublicUser(user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, gender, profileIcon } = req.body;
  const data = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "name cannot be empty" });
    data.name = name;
  }
  if (gender !== undefined) data.gender = gender;
  if (profileIcon !== undefined) data.profileIcon = profileIcon;

  const user = await prisma.user.update({ where: { id: req.userId }, data });
  res.json({ user: toPublicUser(user) });
});

// Permanently deletes the account and every row that belongs to it. Requires
// the current password plus a typed confirmation phrase (the account name or
// DELETE). Runs as one transaction so a failure never leaves a half-deleted
// account behind. Deletion order matters: Category, PillarGroup and Pillar
// are referenced with ON DELETE RESTRICT, so their dependents go first.
router.delete("/me", requireAuth, async (req, res) => {
  const { password, confirmation } = req.body || {};
  if (!password || !confirmation) {
    return res.status(400).json({ error: "password and confirmation are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password", field: "password" });

    const phrase = String(confirmation).trim();
    if (phrase !== "DELETE" && phrase !== user.name.trim()) {
      return res.status(400).json({ error: "Confirmation phrase does not match", field: "confirmation" });
    }

    const userId = user.id;
    await prisma.$transaction([
      // Conversations cascade to messages and suggestions
      prisma.oracleConversation.deleteMany({ where: { userId } }),
      // Logs cascade to their entries, which reference Pillar (RESTRICT)
      prisma.dailyPillarLog.deleteMany({ where: { userId } }),
      // Groups cascade to pillars
      prisma.pillarGroup.deleteMany({ where: { userId } }),
      // Tasks cascade to status history; parent links are SET NULL
      prisma.task.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
      prisma.journalEntry.deleteMany({ where: { userId } }),
      prisma.journalWeeklyInsight.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    clearSessionCookie(res);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Account could not be deleted. Nothing was removed, please try again." });
  }
});

module.exports = { router, toPublicUser };
