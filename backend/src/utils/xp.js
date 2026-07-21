const XP_PER_LEVEL = 100;

function levelForXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function avatarStageForLevel(level) {
  if (level >= 9) return 5;
  if (level >= 7) return 4;
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
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

module.exports = { XP_PER_LEVEL, levelForXp, avatarStageForLevel, applyXpGain };
