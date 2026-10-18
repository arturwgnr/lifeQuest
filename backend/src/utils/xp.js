const XP_PER_LEVEL = 100;

function levelForXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

// Seven avatar stages keyed by level. Mirrors frontend/src/constants/avatarStages.js;
// level only ever goes up, so the stage is monotonic too.
const AVATAR_STAGE_MIN_LEVELS = [1, 3, 5, 8, 12, 17, 24];

function avatarStageForLevel(level) {
  let stage = 1;
  AVATAR_STAGE_MIN_LEVELS.forEach((min, idx) => {
    if (level >= min) stage = idx + 1;
  });
  return stage;
}

function applyXpGain(user, xpGained) {
  const newXp = user.xp + xpGained;
  const newLevel = levelForXp(newXp);
  return {
    xp: newXp,
    level: newLevel,
    avatarStage: avatarStageForLevel(newLevel),
    leveledUp: newLevel > user.level
  };
}

module.exports = { XP_PER_LEVEL, AVATAR_STAGE_MIN_LEVELS, levelForXp, avatarStageForLevel, applyXpGain };
