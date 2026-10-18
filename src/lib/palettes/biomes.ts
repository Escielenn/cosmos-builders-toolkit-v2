// ---------------------------------------------------------------------------
// Biome colours for the Surface Cartographer's generated base map.
//
// A DATA palette, not a theme palette (CLAUDE.md, Simulator Colors): these
// colour terrain on a picture of a planet, the way a spectral class colours a
// star. They do not follow the user's theme and must never be used for chrome.
// sRGB 0..255 triples, muted toward the void so pins and the graticule read on
// top of them.
// ---------------------------------------------------------------------------

export const BIOMES = [
  "deep_ocean",
  "shallow_ocean",
  "sea_ice",
  "ice_sheet",
  "tundra",
  "boreal",
  "temperate_forest",
  "grassland",
  "savanna",
  "desert",
  "jungle",
  "highland",
  "barren",
  "scorched",
] as const;

export type Biome = (typeof BIOMES)[number];

export type RGBTriple = readonly [number, number, number];

export const BIOME_COLOURS: Record<Biome, RGBTriple> = {
  deep_ocean: [14, 34, 66],
  shallow_ocean: [28, 64, 104],
  sea_ice: [168, 184, 198],
  ice_sheet: [208, 216, 224],
  tundra: [120, 124, 108],
  boreal: [46, 74, 56],
  temperate_forest: [54, 92, 54],
  grassland: [112, 128, 70],
  savanna: [146, 134, 76],
  desert: [176, 148, 102],
  jungle: [32, 82, 44],
  highland: [104, 96, 90],
  barren: [92, 86, 80],
  scorched: [110, 62, 40],
};

export const BIOME_LABELS: Record<Biome, string> = {
  deep_ocean: "Deep ocean",
  shallow_ocean: "Shallow sea",
  sea_ice: "Sea ice",
  ice_sheet: "Ice sheet",
  tundra: "Tundra",
  boreal: "Boreal forest",
  temperate_forest: "Temperate forest",
  grassland: "Grassland",
  savanna: "Savanna",
  desert: "Desert",
  jungle: "Jungle",
  highland: "Highland",
  barren: "Barren rock",
  scorched: "Scorched ground",
};
