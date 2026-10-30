// Allowed stamp keys for a Pillar Group (the day type shown on the calendar).
// Mirrors frontend/src/constants/stamps.js - keep both lists in sync.
const STAMP_KEYS = [
  "Shield",
  "Sword",
  "Briefcase",
  "Laptop",
  "Sun",
  "TreePalm",
  "Moon",
  "Coffee",
  "House",
  "Dumbbell",
  "BookOpen",
  "Heart",
  "Flame",
  "Star",
  "Flag",
  "Mountain",
  "Compass",
  "Crown",
  "Bed",
  "Plane",
  "Tent",
  "Music",
  "Palette",
  "Leaf",
  "Bike",
  "GraduationCap",
  "Hammer",
  "Users"
];

// Muted accents only: none of them sit on the red-yellow-green completion scale
const STAMP_TONES = ["slate", "stone", "indigo", "violet", "sky"];

// Returns { data } with only the stamp fields that were sent, or { error }.
// null clears a field; undefined leaves it untouched.
function parseStamp(body) {
  const data = {};
  if (body.stampIcon !== undefined) {
    if (body.stampIcon !== null && !STAMP_KEYS.includes(body.stampIcon)) {
      return { error: "stampIcon is not one of the allowed stamps" };
    }
    data.stampIcon = body.stampIcon;
  }
  if (body.stampTone !== undefined) {
    if (body.stampTone !== null && !STAMP_TONES.includes(body.stampTone)) {
      return { error: "stampTone is not one of the allowed tones" };
    }
    data.stampTone = body.stampTone;
  }
  return { data };
}

module.exports = { STAMP_KEYS, STAMP_TONES, parseStamp };
