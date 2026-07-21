import { Crown, Wand2, Swords, Shield, Compass, Cat, Bird, Rabbit, Squirrel, Gem } from "lucide-react";

// Selectable profile picture archetypes - distinct from the XP-based evolving
// avatar. Purely a personal identity choice, changeable any time from Profile.
export const PROFILE_ICON_OPTIONS = [
  { key: "Crown", label: "King", icon: Crown, tone: "amber" },
  { key: "Wand2", label: "Mage", icon: Wand2, tone: "violet" },
  { key: "Swords", label: "Warrior", icon: Swords, tone: "slate" },
  { key: "Shield", label: "Guardian", icon: Shield, tone: "indigo" },
  { key: "Compass", label: "Wanderer", icon: Compass, tone: "sky" },
  { key: "Cat", label: "Feline", icon: Cat, tone: "stone" },
  { key: "Bird", label: "Raven", icon: Bird, tone: "emerald" },
  { key: "Rabbit", label: "Hare", icon: Rabbit, tone: "rose" },
  { key: "Squirrel", label: "Forager", icon: Squirrel, tone: "amber" },
  { key: "Gem", label: "Collector", icon: Gem, tone: "violet" }
];

const PROFILE_ICON_BY_KEY = Object.fromEntries(PROFILE_ICON_OPTIONS.map(o => [o.key, o]));

export function getProfileIconOption(key) {
  return PROFILE_ICON_BY_KEY[key] || PROFILE_ICON_OPTIONS[3];
}
