// Single source of truth for avatar progression: tune names and thresholds
// here only. Keep minLevel values in sync with
// backend/src/utils/xp.js (AVATAR_STAGE_MIN_LEVELS).
//
// Wide middle bands keep the pace slow and steady; level 100 alone is the
// final form.
export const MAX_LEVEL = 100;

export const AVATAR_STAGES = [
  {
    stage: 1,
    key: "wanderer",
    name: "Wanderer",
    minLevel: 1,
    maxLevel: 8,
    blurb: "A plain silhouette, just setting out."
  },
  {
    stage: 2,
    key: "initiate",
    name: "Initiate",
    minLevel: 9,
    maxLevel: 20,
    blurb: "First colors and a travelling scarf."
  },
  {
    stage: 3,
    key: "pathfinder",
    name: "Pathfinder",
    minLevel: 21,
    maxLevel: 35,
    blurb: "A sigil on the chest and a marked ring."
  },
  {
    stage: 4,
    key: "vanguard",
    name: "Vanguard",
    minLevel: 36,
    maxLevel: 50,
    blurb: "Shoulder guards and a double ring."
  },
  {
    stage: 5,
    key: "arcanist",
    name: "Arcanist",
    minLevel: 51,
    maxLevel: 65,
    blurb: "A jewelled circlet and a deeper aura."
  },
  {
    stage: 6,
    key: "ascendant",
    name: "Ascendant",
    minLevel: 66,
    maxLevel: 80,
    blurb: "A golden crown, framed by laurels."
  },
  {
    stage: 7,
    key: "sovereign",
    name: "Sovereign",
    minLevel: 81,
    maxLevel: 99,
    blurb: "Radiant crown, halo and a starlit ring."
  },
  {
    stage: 8,
    key: "transcendent",
    name: "Transcendent",
    minLevel: 100,
    maxLevel: 100,
    blurb: "A living aura and the third eye, fully open."
  }
];

export function stageForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  let current = AVATAR_STAGES[0];
  for (const stage of AVATAR_STAGES) {
    if (safeLevel >= stage.minLevel) current = stage;
  }
  return current;
}

// The stage a user actually sees. The backend sends avatarStage as a
// high-water mark, so accounts that reached a higher stage under the older,
// faster thresholds keep it instead of looking demoted.
export function stageForUser(user) {
  const byLevel = stageForLevel(user?.level);
  const stored = Math.min(AVATAR_STAGES.length, Math.max(1, Number(user?.avatarStage) || 1));
  return AVATAR_STAGES[Math.max(byLevel.stage, stored) - 1];
}

export function nextStageAfter(stage) {
  return AVATAR_STAGES.find(s => s.stage === stage.stage + 1) || null;
}

// Inclusive level range label, e.g. "Lv 9-20" or "Lv 100"
export function stageLevelRange(stage) {
  return stage.minLevel === stage.maxLevel ? `Lv ${stage.minLevel}` : `Lv ${stage.minLevel}-${stage.maxLevel}`;
}
