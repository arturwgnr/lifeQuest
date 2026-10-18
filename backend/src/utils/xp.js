const XP_PER_LEVEL = 100;
const MAX_LEVEL = 100;

// Level 100 is the top of the curve; XP keeps accumulating past it as a number.
function levelForXp(xp) {
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
}

// Eight avatar stages keyed by level (Wanderer 1-8 ... Transcendent 100).
// Mirrors frontend/src/constants/avatarStages.js - keep both in sync.
const AVATAR_STAGE_MIN_LEVELS = [1, 9, 21, 36, 51, 66, 81, 100];
const MAX_STAGE = AVATAR_STAGE_MIN_LEVELS.length;

function avatarStageForLevel(level) {
  let stage = 1;
  AVATAR_STAGE_MIN_LEVELS.forEach((min, idx) => {
    if (level >= min) stage = idx + 1;
  });
  return stage;
}

// The stored avatarStage is a high-water mark. Accounts created under the
// older, faster thresholds may already hold a higher stage than the new
// table gives their level; they keep it (never shown a demotion) until the
// level-based stage catches up.
function displayStage(user) {
  const stored = Math.min(MAX_STAGE, Math.max(1, user.avatarStage || 1));
  return Math.max(stored, avatarStageForLevel(user.level));
}

function applyXpGain(user, xpGained) {
  const newXp = user.xp + xpGained;
  const newLevel = levelForXp(newXp);
  return {
    xp: newXp,
    level: newLevel,
    avatarStage: Math.max(displayStage(user), avatarStageForLevel(newLevel)),
    leveledUp: newLevel > user.level
  };
}

module.exports = {
  XP_PER_LEVEL,
  MAX_LEVEL,
  AVATAR_STAGE_MIN_LEVELS,
  levelForXp,
  avatarStageForLevel,
  displayStage,
  applyXpGain
};
