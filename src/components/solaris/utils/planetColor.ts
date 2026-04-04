import type { PlanetType } from "../types";

const PLANET_COLORS: Record<PlanetType, string> = {
  rocky: "#8B7355",
  "super-earth": "#6B8E6B",
  "sub-neptune": "#4A8BAF",
  "ice-giant": "#6CB4D9",
  "gas-giant": "#C49B5A",
  "hot-jupiter": "#D4614B",
  "ocean-world": "#2B6CB0",
  "desert-world": "#C4A35A",
  "lava-world": "#CC4422",
};

export function getPlanetColor(type: PlanetType): string {
  return PLANET_COLORS[type] ?? "#8B7355";
}

export interface PlanetMaterial {
  roughness: number;
  metalness: number;
}

const PLANET_MATERIALS: Record<PlanetType, PlanetMaterial> = {
  rocky: { roughness: 0.9, metalness: 0.0 },
  "desert-world": { roughness: 0.95, metalness: 0.0 },
  "lava-world": { roughness: 0.7, metalness: 0.1 },
  "ocean-world": { roughness: 0.2, metalness: 0.05 },
  "super-earth": { roughness: 0.8, metalness: 0.0 },
  "sub-neptune": { roughness: 0.5, metalness: 0.0 },
  "ice-giant": { roughness: 0.3, metalness: 0.0 },
  "gas-giant": { roughness: 0.4, metalness: 0.0 },
  "hot-jupiter": { roughness: 0.45, metalness: 0.0 },
};

export function getPlanetMaterial(type: PlanetType): PlanetMaterial {
  return PLANET_MATERIALS[type] ?? { roughness: 0.7, metalness: 0.0 };
}
