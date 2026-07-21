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

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    gender: user.gender,
    xp: user.xp,
    level: user.level,
    avatarStage: user.avatarStage,
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
      categories: { create: DEFAULT_CATEGORIES }
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

module.exports = { router, toPublicUser };
