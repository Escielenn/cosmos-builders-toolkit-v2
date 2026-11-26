// ---------------------------------------------------------------------------
// World icons: the catalogue the icon picker offers, and the resolver that
// turns whatever a world has stored into one glyph of the line family
// (src/components/icons/world-glyphs.tsx).
//
// A world's `icon` column may hold:
//   - a glyph id ("globe", "ringed", "helmet")
//   - one of the 34 ids the old lucide set used (same ids, kept)
//   - a legacy illustration path ("/world-pics/007-astronaut.svg") from the
//     cartoon set retired in 1.7. Those files are gone; the path resolves by
//     name to the nearest glyph, so no stored value needs migrating.
// Anything unrecognised resolves to the globe.
// ---------------------------------------------------------------------------

import { hasWorldGlyph } from "@/components/icons/world-glyphs";

export interface WorldIcon {
  id: string;
  label: string;
  category: IconCategory;
}

export const ICON_CATEGORIES = [
  "Celestial",
  "Space",
  "Elements",
  "Life",
  "Civilization",
  "Abstract",
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

export const DEFAULT_WORLD_ICON = "globe";

export const WORLD_ICONS: WorldIcon[] = [
  // Celestial
  { id: "globe", label: "Globe", category: "Celestial" },
  { id: "globe-2", label: "Globe, gridded", category: "Celestial" },
  { id: "ringed", label: "Ringed planet", category: "Celestial" },
  { id: "moon", label: "Moon", category: "Celestial" },
  { id: "sun", label: "Sun", category: "Celestial" },
  { id: "star", label: "Star", category: "Celestial" },
  { id: "sparkles", label: "Star field", category: "Celestial" },
  { id: "comet", label: "Comet", category: "Celestial" },
  { id: "constellation", label: "Constellation", category: "Celestial" },
  { id: "galaxy", label: "Galaxy", category: "Celestial" },
  { id: "black-hole", label: "Black hole", category: "Celestial" },
  { id: "eclipse", label: "Eclipse", category: "Celestial" },

  // Space
  { id: "rocket", label: "Rocket", category: "Space" },
  { id: "ship", label: "Starship", category: "Space" },
  { id: "orbit", label: "Orbit", category: "Space" },
  { id: "satellite", label: "Satellite", category: "Space" },
  { id: "station", label: "Station", category: "Space" },
  { id: "telescope", label: "Telescope", category: "Space" },
  { id: "helmet", label: "Astronaut", category: "Space" },
  { id: "rover", label: "Rover", category: "Space" },
  { id: "saucer", label: "Saucer", category: "Space" },

  // Elements
  { id: "flame", label: "Flame", category: "Elements" },
  { id: "droplets", label: "Water", category: "Elements" },
  { id: "wind", label: "Wind", category: "Elements" },
  { id: "mountain", label: "Mountain", category: "Elements" },
  { id: "waves", label: "Waves", category: "Elements" },
  { id: "snowflake", label: "Ice", category: "Elements" },
  { id: "cloud", label: "Cloud", category: "Elements" },
  { id: "crystal", label: "Crystal", category: "Elements" },

  // Life
  { id: "leaf", label: "Leaf", category: "Life" },
  { id: "trees", label: "Forest", category: "Life" },
  { id: "flower", label: "Flower", category: "Life" },
  { id: "bug", label: "Creature", category: "Life" },
  { id: "alien", label: "Alien", category: "Life" },
  { id: "mask", label: "Myth", category: "Life" },
  { id: "eye", label: "Watcher", category: "Life" },

  // Civilization
  { id: "building", label: "City", category: "Civilization" },
  { id: "castle", label: "Castle", category: "Civilization" },
  { id: "temple", label: "Temple", category: "Civilization" },
  { id: "crown", label: "Kingdom", category: "Civilization" },
  { id: "sword", label: "Sword", category: "Civilization" },
  { id: "swords", label: "Conflict", category: "Civilization" },
  { id: "shield", label: "Defense", category: "Civilization" },
  { id: "scroll", label: "Lore", category: "Civilization" },
  { id: "book", label: "Book", category: "Civilization" },
  { id: "map", label: "Map", category: "Civilization" },

  // Abstract
  { id: "compass", label: "Compass", category: "Abstract" },
  { id: "anchor", label: "Anchor", category: "Abstract" },
  { id: "infinity", label: "Infinity", category: "Abstract" },
  { id: "atom", label: "Atom", category: "Abstract" },
  { id: "zap", label: "Energy", category: "Abstract" },
  { id: "robot", label: "Robot", category: "Abstract" },
  { id: "chip", label: "Machine", category: "Abstract" },
  { id: "flask", label: "Science", category: "Abstract" },
];

// ---------------------------------------------------------------------------
// Legacy illustrations → glyphs
// ---------------------------------------------------------------------------

const LEGACY_PREFIX = "/world-pics/";

/**
 * Ordered rules: the first rule with a keyword found in the illustration's
 * name wins. Keywords match whole words ("leo" does not match
 * "teleportation"); a multi-word keyword matches the phrase.
 */
const LEGACY_RULES: readonly (readonly [glyph: string, keywords: readonly string[]])[] = [
  ["rover", ["rover", "buggy", "lander", "jeep"]],
  ["helmet", ["astronaut", "helmet", "headgear", "underwater suit", "exoskeleton"]],
  ["saucer", ["ufo"]],
  ["alien", ["alien"]],
  ["station", ["space station", "space colony", "underwater city"]],
  ["rocket", ["rocket", "jetpack", "space capsule", "space tourism", "flying shoes", "science fiction"]],
  ["ship", ["spaceship", "hover transport", "flying car", "high speed train", "yacht", "fishing boat", "paper ship", "flying", "floating"]],
  ["satellite", ["satellite", "sputnik", "drone", "wireless"]],
  ["telescope", ["telescope", "observatory", "binoculars", "astronomy"]],
  ["black-hole", ["black hole"]],
  ["galaxy", ["milky way", "andromeda"]],
  ["orbit", ["solar system", "asteroid belt"]],
  ["comet", ["comet", "meteor", "meteorite", "shooting star", "asteroid"]],
  ["eclipse", ["eclipse", "moon phases", "day and night"]],
  [
    "constellation",
    [
      "constellation", "astrology", "orion", "lyra", "cygnus", "cassiopeia", "serpens", "monoceros", "bootes",
      "ursa", "auriga", "ophiuchus", "pisces", "aquarius", "capricorn", "sagittarius", "scorpio", "libra",
      "virgo", "leo", "cancer", "gemini", "taurus", "aries", "lacerta", "horologium", "centaurus", "triangulum",
      "volans", "perseus", "crux",
    ],
  ],
  ["moon", ["moon", "crater"]],
  ["sun", ["sun", "day", "temperature"]],
  ["globe", ["earth", "global", "mercury", "venus", "mars", "pluto", "ceres", "atmosphere", "ozone", "ecosystem", "environment"]],
  ["ringed", ["saturn", "jupiter", "uranus", "neptune", "planet"]],
  ["star", ["star"]],
  [
    "temple",
    ["zeus", "poseidon", "hades", "ares", "apollo", "aphrodite", "athena", "atlas", "anubis", "horus", "church", "ancient"],
  ],
  [
    "mask",
    [
      "fairy", "cupid", "devil", "demon", "angel", "nymph", "goblin", "banshee", "ogre", "cyclops", "golem",
      "dracula", "werewolf", "bigfoot", "yeti", "minotaur", "gnome", "oni", "mermaid", "merman", "grim reaper",
      "succubus", "kappa", "jackalope", "harpy", "wendigo", "troll", "madremonte", "unicorn", "pegasus", "dragon",
      "satyr", "medusa", "faun", "elf", "genie", "kraken", "jack o lantern", "superhero", "icarus",
    ],
  ],
  ["robot", ["robot", "robotic", "android", "cyborg", "chat bot", "microbots"]],
  ["eye", ["eye scan", "awareness", "x ray"]],
  [
    "chip",
    [
      "artificial intelligence", "coding", "hologram", "quantum computing", "machine learning", "deep learning",
      "neural", "chip", "cpu", "smart", "vr glasses", "augmented reality", "biometric identification", "3d",
      "innovation", "immersive", "cloud computing", "binary code", "voice control", "remote control", "keyboard",
      "laptop", "smartphone", "control panel", "low battery", "futuristic", "interaction", "memory transfer",
      "mind transfer",
    ],
  ],
  ["infinity", ["time machine", "before", "cascading"]],
  ["zap", ["blaster", "laser gun", "weapon", "teleportation", "wind power", "light bulb", "lightbulb", "flashlight", "lantern", "matches"]],
  ["flask", ["science", "scientist", "elixir", "analysis", "medical research", "synthetic ecology", "synthetic food", "surgery", "toxic", "first aid kit", "medical"]],
  ["atom", ["dna", "bacterial", "virus", "diseases", "brain", "heartbeat", "lungs", "hibernation", "cloning"]],
  ["flame", ["fire", "bonfire", "wildfire", "volcano eruption", "candles", "emission"]],
  ["waves", ["waterfall", "sea level", "contaminated water"]],
  ["droplets", ["waterdrop", "rainbow"]],
  ["wind", ["air", "air pollution", "hurricane symbol", "storm", "weather", "weather change", "kite", "parachute", "hot air balloon"]],
  ["snowflake", ["polar bear"]],
  ["mountain", ["mountains", "alpinism", "hiking", "hiking boots", "cave", "desert", "sand", "soil erosion", "camping", "extreme"]],
  ["crystal", ["diamond", "amulet", "transparent"]],
  ["trees", ["forest", "tree", "trees", "stop deforestation"]],
  ["flower", ["flower", "rose"]],
  ["leaf", ["plant", "nature", "branch", "terrarium", "agriculture", "farming", "eco activism", "carbon neutral", "zero emission", "no plastic", "no fossil fuels", "resources", "waste", "apple", "beehive"]],
  ["bug", ["birds", "monkey", "pet", "dove", "animal communication"]],
  ["building", ["factory", "house", "household", "green city", "bridge", "lighthouse", "door", "container"]],
  ["shield", ["armor", "badge", "life vest", "humanitarian"]],
  ["swords", ["crossed"]],
  ["sword", ["machete"]],
  ["scroll", ["document", "agreement", "calendar", "notebook"]],
  ["book", ["book"]],
  ["map", ["map", "signpost", "navigation", "traveling", "tourist", "explorer", "adventures", "backpack", "photographer", "bike", "steering wheel"]],
  ["compass", ["compass", "decision", "balance", "problem solving"]],
  ["anchor", ["anchor"]],
];

/** "/world-pics/017-Space Station.svg" → "space station". */
function legacyName(path: string): string {
  let file = path.slice(LEGACY_PREFIX.length);
  try {
    file = decodeURIComponent(file);
  } catch {
    /* a stray % in the stored value: use it as written */
  }
  return file
    .replace(/\.svg$/i, "")
    .replace(/^\d+-/, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(name: string, phrase: string): boolean {
  return ` ${name} `.includes(` ${phrase} `);
}

/** The glyph a retired "/world-pics/…" illustration now draws as. */
export function legacyWorldPicGlyph(path: string): string {
  const name = legacyName(path);
  for (const [glyph, keywords] of LEGACY_RULES) {
    if (keywords.some((k) => hasPhrase(name, k))) return glyph;
  }
  return DEFAULT_WORLD_ICON;
}

/**
 * The glyph id for any stored world icon value. Never throws, never returns
 * an id without a glyph.
 */
export function resolveWorldIconId(stored: string | null | undefined): string {
  if (!stored) return DEFAULT_WORLD_ICON;
  if (stored.startsWith(LEGACY_PREFIX)) return legacyWorldPicGlyph(stored);
  return hasWorldGlyph(stored) ? stored : DEFAULT_WORLD_ICON;
}

/** Catalogue entry for a stored value (the resolved glyph's entry). */
export const getWorldIcon = (iconId: string | null | undefined): WorldIcon => {
  const id = resolveWorldIconId(iconId);
  return WORLD_ICONS.find((i) => i.id === id) ?? WORLD_ICONS[0];
};
