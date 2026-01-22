import {
  Globe,
  Globe2,
  Moon,
  Sun,
  Star,
  Sparkles,
  Rocket,
  Orbit,
  Satellite,
  Telescope,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Waves,
  Snowflake,
  Cloud,
  Leaf,
  Trees,
  Flower2,
  Bug,
  Building,
  Castle,
  Crown,
  Sword,
  Swords,
  Shield,
  Scroll,
  BookOpen,
  Compass,
  Anchor,
  Infinity,
  Atom,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface WorldIcon {
  id: string;
  icon: LucideIcon;
  label: string;
  category: string;
}

export const WORLD_ICONS: WorldIcon[] = [
  // Celestial
  { id: "globe", icon: Globe, label: "Globe", category: "Celestial" },
  { id: "globe-2", icon: Globe2, label: "Globe Alt", category: "Celestial" },
  { id: "moon", icon: Moon, label: "Moon", category: "Celestial" },
  { id: "sun", icon: Sun, label: "Sun", category: "Celestial" },
  { id: "star", icon: Star, label: "Star", category: "Celestial" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles", category: "Celestial" },

  // Space
  { id: "rocket", icon: Rocket, label: "Rocket", category: "Space" },
  { id: "orbit", icon: Orbit, label: "Orbit", category: "Space" },
  { id: "satellite", icon: Satellite, label: "Satellite", category: "Space" },
  { id: "telescope", icon: Telescope, label: "Telescope", category: "Space" },

  // Elements
  { id: "flame", icon: Flame, label: "Flame", category: "Elements" },
  { id: "droplets", icon: Droplets, label: "Water", category: "Elements" },
  { id: "wind", icon: Wind, label: "Wind", category: "Elements" },
  { id: "mountain", icon: Mountain, label: "Mountain", category: "Elements" },
  { id: "waves", icon: Waves, label: "Waves", category: "Elements" },
  { id: "snowflake", icon: Snowflake, label: "Ice", category: "Elements" },
  { id: "cloud", icon: Cloud, label: "Cloud", category: "Elements" },

  // Life
  { id: "leaf", icon: Leaf, label: "Leaf", category: "Life" },
  { id: "trees", icon: Trees, label: "Forest", category: "Life" },
  { id: "flower", icon: Flower2, label: "Flower", category: "Life" },
  { id: "bug", icon: Bug, label: "Creature", category: "Life" },

  // Civilization
  { id: "building", icon: Building, label: "City", category: "Civilization" },
  { id: "castle", icon: Castle, label: "Castle", category: "Civilization" },
  { id: "crown", icon: Crown, label: "Kingdom", category: "Civilization" },
  { id: "sword", icon: Sword, label: "Sword", category: "Civilization" },
  { id: "swords", icon: Swords, label: "Conflict", category: "Civilization" },
  { id: "shield", icon: Shield, label: "Defense", category: "Civilization" },
  { id: "scroll", icon: Scroll, label: "Lore", category: "Civilization" },
  { id: "book", icon: BookOpen, label: "Book", category: "Civilization" },

  // Abstract
  { id: "compass", icon: Compass, label: "Compass", category: "Abstract" },
  { id: "anchor", icon: Anchor, label: "Anchor", category: "Abstract" },
  { id: "infinity", icon: Infinity, label: "Infinity", category: "Abstract" },
  { id: "atom", icon: Atom, label: "Atom", category: "Abstract" },
  { id: "zap", icon: Zap, label: "Energy", category: "Abstract" },
];

export const getWorldIcon = (iconId: string): WorldIcon => {
  return WORLD_ICONS.find((i) => i.id === iconId) || WORLD_ICONS[0];
};

export const ICON_CATEGORIES = [
  "Celestial",
  "Space",
  "Elements",
  "Life",
  "Civilization",
  "Abstract",
] as const;
