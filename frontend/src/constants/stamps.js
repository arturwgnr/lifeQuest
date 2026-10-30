import {
  Shield,
  Sword,
  Briefcase,
  Laptop,
  Sun,
  TreePalm,
  Moon,
  Coffee,
  House,
  Dumbbell,
  BookOpen,
  Heart,
  Flame,
  Star,
  Flag,
  Mountain,
  Compass,
  Crown,
  Bed,
  Plane,
  Tent,
  Music,
  Palette,
  Leaf,
  Bike,
  GraduationCap,
  Hammer,
  Users
} from "lucide-react";

// Stamp = the symbol that identifies a day type (a Pillar Group) on the
// calendar, independent of the completion color. Keys are stored on the
// group as plain strings; backend/src/lib/stamps.js validates the same list.
export const STAMP_REGISTRY = {
  Shield,
  Sword,
  Briefcase,
  Laptop,
  Sun,
  TreePalm,
  Moon,
  Coffee,
  House,
  Dumbbell,
  BookOpen,
  Heart,
  Flame,
  Star,
  Flag,
  Mountain,
  Compass,
  Crown,
  Bed,
  Plane,
  Tent,
  Music,
  Palette,
  Leaf,
  Bike,
  GraduationCap,
  Hammer,
  Users
};

export const STAMP_OPTIONS = Object.keys(STAMP_REGISTRY);

export const STAMP_LABELS = {
  Shield: "Shield",
  Sword: "Sword",
  Briefcase: "Briefcase",
  Laptop: "Laptop",
  Sun: "Sun",
  TreePalm: "Palm tree",
  Moon: "Moon",
  Coffee: "Coffee",
  House: "House",
  Dumbbell: "Dumbbell",
  BookOpen: "Book",
  Heart: "Heart",
  Flame: "Flame",
  Star: "Star",
  Flag: "Flag",
  Mountain: "Mountain",
  Compass: "Compass",
  Crown: "Crown",
  Bed: "Bed",
  Plane: "Plane",
  Tent: "Tent",
  Music: "Music",
  Palette: "Palette",
  Leaf: "Leaf",
  Bike: "Bike",
  GraduationCap: "Graduation cap",
  Hammer: "Hammer",
  Users: "People"
};

// Muted accents, deliberately off the red-yellow-green completion scale so a
// stamp's tone is never mistaken for a day's score. "slate" is the neutral.
export const STAMP_TONES = [
  { key: "slate", label: "Slate" },
  { key: "stone", label: "Stone" },
  { key: "indigo", label: "Indigo" },
  { key: "violet", label: "Violet" },
  { key: "sky", label: "Sky" }
];

export const DEFAULT_STAMP = "Flag";

// Groups created before stamps existed get a sensible guess from their name
const NAME_HINTS = [
  [/\b(off|rest|free|folga|holiday|vacation|f[eé]rias|descanso)\b/i, "TreePalm"],
  [/\b(work|worked|office|job|trabalho|shift)\b/i, "Briefcase"],
  [/\b(remote|home office|coding|dev)\b/i, "Laptop"],
  [/\b(weekend|saturday|sunday|everyday|daily)\b/i, "Sun"],
  [/\b(gym|train|training|workout|treino|sport)\b/i, "Dumbbell"],
  [/\b(study|studies|learn|school|exam|estudo)\b/i, "GraduationCap"],
  [/\b(travel|trip|viagem|flight)\b/i, "Plane"],
  [/\b(sick|ill|recovery|doente)\b/i, "Bed"],
  [/\b(night|late)\b/i, "Moon"],
  [/\b(home|house|casa)\b/i, "House"],
  [/\b(family|social|friends|fam[ií]lia)\b/i, "Users"]
];

export function guessStampFromName(name = "") {
  const hit = NAME_HINTS.find(([re]) => re.test(name));
  return hit ? hit[1] : DEFAULT_STAMP;
}

// One place that turns whatever a group/day carries into something
// renderable. isGuessed = the user never picked one (nudge them to).
export function resolveStamp({ stampIcon, stampTone, name } = {}) {
  const hasIcon = Boolean(stampIcon && STAMP_REGISTRY[stampIcon]);
  const key = hasIcon ? stampIcon : guessStampFromName(name);
  return {
    key,
    Icon: STAMP_REGISTRY[key],
    label: STAMP_LABELS[key],
    tone: STAMP_TONES.some(t => t.key === stampTone) ? stampTone : "slate",
    isGuessed: !hasIcon
  };
}
