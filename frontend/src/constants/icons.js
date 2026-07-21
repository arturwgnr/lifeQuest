import {
  Coins,
  BookOpen,
  Shield,
  Scroll,
  Leaf,
  Heart,
  Briefcase,
  Home,
  Dumbbell,
  Plane,
  Music,
  Palette,
  Star,
  Target,
  Book,
  Coffee,
  Camera,
  Gift,
  Puzzle,
  Wallet,
  Tag
} from "lucide-react";

// Curated icon set for categories (default + custom). Keys are stored on the
// Category row as plain strings so the backend never needs to know about React.
export const ICON_REGISTRY = {
  Coins,
  BookOpen,
  Shield,
  Scroll,
  Leaf,
  Heart,
  Briefcase,
  Home,
  Dumbbell,
  Plane,
  Music,
  Palette,
  Star,
  Target,
  Book,
  Coffee,
  Camera,
  Gift,
  Puzzle,
  Wallet
};

export const ICON_OPTIONS = Object.keys(ICON_REGISTRY);

export function getIconComponent(key) {
  return ICON_REGISTRY[key] || Tag;
}
