// Continuous completion scale for a day's Pillars: 0% red -> ~50% yellow ->
// 100% green, judged on the percentage (completed / total in the group used
// that day) so a 3-pillar day and an 8-pillar day sit on the same scale.
//
// Only the hue is computed here; lightness/chroma live in CSS (muted, tuned
// separately for light and dark mode, in the spirit of the Journal rating
// palette), which renders it as oklch(L C var(--pillar-hue)).
const HUE_RED = 25;
const HUE_YELLOW = 92;
const HUE_GREEN = 150;

export function completionRate(completedCount, totalCount) {
  if (!totalCount) return null;
  return Math.round((completedCount / totalCount) * 100);
}

export function pillarHue(rate) {
  const clamped = Math.max(0, Math.min(100, rate));
  if (clamped <= 50) return HUE_RED + (HUE_YELLOW - HUE_RED) * (clamped / 50);
  return HUE_YELLOW + (HUE_GREEN - HUE_YELLOW) * ((clamped - 50) / 50);
}

// Inline style for any element painted with the scale. null for "no report"
// so callers render the empty/outlined state instead of a 0% red.
export function pillarScaleStyle(rate) {
  if (rate === null || rate === undefined) return null;
  return { "--pillar-hue": pillarHue(rate).toFixed(1) };
}

// Words so the scale never relies on color alone
export function dayQualityLabel(rate) {
  if (rate === null || rate === undefined) return "No report";
  if (rate >= 100) return "Perfect day";
  if (rate >= 75) return "Strong day";
  if (rate >= 50) return "Solid day";
  if (rate >= 25) return "Getting there";
  if (rate > 0) return "Rough day";
  return "Nothing checked";
}

// Kept for any older caller: a plain CSS color for a rate (light-mode tones)
export function pillarCompletionColor(rate) {
  if (rate === null || rate === undefined) return null;
  return `oklch(0.74 0.12 ${pillarHue(rate).toFixed(1)})`;
}
