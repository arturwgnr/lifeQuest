// Green-toned intensity ramp for daily Pillar completion rate (0-100%),
// visually consistent with the app's existing muted rating palette
// (constants/moods.js) but keyed by a percentage instead of a 1-5 scale.
export function pillarCompletionColor(rate) {
  if (rate === null || rate === undefined) return null;
  if (rate <= 0) return "#94918c";
  if (rate < 40) return "#fa8a40d3";
  if (rate < 70) return "#c9c94dd3";
  if (rate < 100) return "#60a87ed3";
  return "#27b433d3";
}
