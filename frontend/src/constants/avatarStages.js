// Single source of truth for avatar progression. Stage is derived from level
// only (never stored state on the client), and level only ever goes up, so the
// avatar can never regress. Keep minLevel values in sync with
// backend/src/utils/xp.js (AVATAR_STAGE_MIN_LEVELS).
export const AVATAR_STAGES = [
  {
    stage: 1,
    key: "wanderer",
    name: "Wanderer",
    minLevel: 1,
    blurb: "A plain silhouette, just setting out."
  },
  {
    stage: 2,
    key: "apprentice",
    name: "Apprentice",
    minLevel: 3,
    blurb: "First colors and a travelling scarf."
  },
  {
    stage: 3,
    key: "initiate",
    name: "Initiate",
    minLevel: 5,
    blurb: "A sigil on the chest and a marked ring."
  },
  {
    stage: 4,
    key: "pathfinder",
    name: "Pathfinder",
    minLevel: 8,
    blurb: "Shoulder guards and a double ring."
  },
  {
    stage: 5,
    key: "vanguard",
    name: "Vanguard",
    minLevel: 12,
    blurb: "A jewelled circlet and a deeper aura."
  },
  {
    stage: 6,
    key: "champion",
    name: "Champion",
    minLevel: 17,
    blurb: "A golden crown, framed by laurels."
  },
  {
    stage: 7,
    key: "sovereign",
    name: "Sovereign",
    minLevel: 24,
    blurb: "Radiant crown, halo and a starlit ring."
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

export function nextStageForLevel(level) {
  const current = stageForLevel(level);
  return AVATAR_STAGES.find(s => s.stage === current.stage + 1) || null;
}

// Inclusive level range label, e.g. "Lv 5-7" or "Lv 24+"
export function stageLevelRange(stage) {
  const next = AVATAR_STAGES.find(s => s.stage === stage.stage + 1);
  return next ? `Lv ${stage.minLevel}-${next.minLevel - 1}` : `Lv ${stage.minLevel}+`;
}
