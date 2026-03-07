// Star Type Definitions
// Spectral classification data for realistic star generation

import { SpectralClass, StarTypeData } from '../types';

export const STAR_TYPES: Record<SpectralClass, StarTypeData> = {
  O: {
    color: '#9BB0FF',
    temp: '30,000K+',
    mass: '16-150 M☉',
    rarity: 0.00003,
    habitable: 0.02,
    size: 5,
    luminosity: [0.9, 1.0]
  },
  B: {
    color: '#AABFFF',
    temp: '10,000-30,000K',
    mass: '2.1-16 M☉',
    rarity: 0.0013,
    habitable: 0.05,
    size: 4,
    luminosity: [0.85, 1.0]
  },
  A: {
    color: '#CAD7FF',
    temp: '7,500-10,000K',
    mass: '1.4-2.1 M☉',
    rarity: 0.006,
    habitable: 0.12,
    size: 3.2,
    luminosity: [0.75, 0.95]
  },
  F: {
    color: '#F8F7FF',
    temp: '6,000-7,500K',
    mass: '1.04-1.4 M☉',
    rarity: 0.03,
    habitable: 0.25,
    size: 2.6,
    luminosity: [0.65, 0.9]
  },
  G: {
    color: '#FFF4EA',
    temp: '5,200-6,000K',
    mass: '0.8-1.04 M☉',
    rarity: 0.076,
    habitable: 0.45,
    size: 2.2,
    luminosity: [0.5, 0.85]
  },
  K: {
    color: '#FFD2A1',
    temp: '3,700-5,200K',
    mass: '0.45-0.8 M☉',
    rarity: 0.121,
    habitable: 0.35,
    size: 1.9,
    luminosity: [0.35, 0.7]
  },
  M: {
    color: '#FFAA6F',
    temp: '2,400-3,700K',
    mass: '0.08-0.45 M☉',
    rarity: 0.765,
    habitable: 0.15,
    size: 1.5,
    luminosity: [0.2, 0.55]
  }
};

export const SPECTRAL_CLASSES: SpectralClass[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

// Get star type based on weighted random
export function assignStarType(random: number): SpectralClass {
  let cumulative = 0;
  for (const [type, data] of Object.entries(STAR_TYPES)) {
    cumulative += data.rarity;
    if (random < cumulative) return type as SpectralClass;
  }
  return 'M';
}

// Hot stars that get glow effects
export const HOT_STAR_TYPES: SpectralClass[] = ['O', 'B', 'A'];

export function isHotStar(type: SpectralClass): boolean {
  return HOT_STAR_TYPES.includes(type);
}
