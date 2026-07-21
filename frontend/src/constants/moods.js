import {
  Laugh,
  Smile,
  SmilePlus,
  Heart,
  Flame,
  Moon,
  Annoyed,
  Angry,
  Frown,
  CloudRain,
} from "lucide-react";

// Line icons only - no emoji anywhere in the Journal tab.
export const MOOD_OPTIONS = [
  { key: "happy", label: "Happy", icon: Laugh },
  { key: "calm", label: "Calm", icon: Smile },
  { key: "excited", label: "Excited", icon: SmilePlus },
  { key: "grateful", label: "Grateful", icon: Heart },
  { key: "motivated", label: "Motivated", icon: Flame },
  { key: "tired", label: "Tired", icon: Moon },
  { key: "anxious", label: "Anxious", icon: Annoyed },
  { key: "frustrated", label: "Frustrated", icon: Angry },
  { key: "sad", label: "Sad", icon: Frown },
  { key: "overwhelmed", label: "Overwhelmed", icon: CloudRain },
];

export const MOOD_BY_KEY = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.key, m]),
);

// Muted diverging ramp for day rating (1 = muted red, 5 = darker muted green),
// smooth low-saturation blend through a neutral midpoint at 3 - never neon/aggressive.
export const RATING_COLORS = {
  1: "#fa4040d3",
  2: "#fa8a40d3",
  3: "#94918c",
  4: "#60a87ed3",
  5: "#27b433d3",
};

export function ratingColor(rating) {
  return RATING_COLORS[rating] || RATING_COLORS[3];
}
