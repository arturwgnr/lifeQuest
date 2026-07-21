// Curated color tones for categories. Every tone must have matching CSS rules
// wherever category chips/icons are rendered (see styles/*.css `--{tone}` variants).
export const TONE_OPTIONS = [
  { key: "amber", label: "Amber", swatch: "var(--amber-500)" },
  { key: "indigo", label: "Indigo", swatch: "var(--indigo-500)" },
  { key: "slate", label: "Slate", swatch: "var(--slate-500)" },
  { key: "stone", label: "Stone", swatch: "var(--stone-400)" },
  { key: "emerald", label: "Emerald", swatch: "var(--emerald-600)" },
  { key: "rose", label: "Rose", swatch: "var(--rose-500)" },
  { key: "sky", label: "Sky", swatch: "var(--sky-500)" },
  { key: "violet", label: "Violet", swatch: "var(--violet-500)" }
];

export const TONE_KEYS = TONE_OPTIONS.map(t => t.key);

// Plain hex mirror of the tones above, for contexts (SVG fill attributes) where a
// CSS var() presentation-attribute isn't reliable. Keep in sync with global.css.
export const TONE_HEX = {
  amber: "#f59e0b",
  indigo: "#6366f1",
  slate: "#64748b",
  stone: "#a8a29e",
  emerald: "#059669",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6"
};

