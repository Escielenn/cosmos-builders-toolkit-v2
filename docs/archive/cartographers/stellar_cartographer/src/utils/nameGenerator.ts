// Procedural Name Generator
// Four distinct naming styles for empire-based star naming

import { NamingStyle, NamingStyleData } from '../types';
import { SeededRandom } from './seededRandom';

export const NAMING_STYLES: Record<NamingStyle, NamingStyleData> = {
  terran: {
    prefixes: [
      'Nova', 'Proxima', 'Alpha', 'Beta', 'Tau', 'Sigma', 
      'Delta', 'Omega', 'Stella', 'Sol', 'Kepler', 'Gliese',
      'HD', 'Ross', 'Wolf', 'Luyten', 'Barnard', 'Kapteyn'
    ],
    roots: [
      'Centauri', 'Eridani', 'Cygni', 'Lyrae', 'Draconis', 
      'Aquilae', 'Pavonis', 'Carinae', 'Velorum', 'Orionis',
      'Tauri', 'Pegasi', 'Andromedae', 'Virginis', 'Leonis'
    ],
    suffixes: [' Prime', ' Major', ' Minor', '', '-IV', '-VII', ' Secundus', ' b', ' c', ''],
    patterns: ['prefix roots', 'roots suffix', 'prefix suffix', 'prefix roots suffix']
  },
  harsh: {
    prefixes: [
      "Kz'", "Vr'", "Xh'", "Gr'", "Th'", "Zk'", "Kr'", "Dr'", "Gh'", "Sk'",
      "Br'", "Tr'", "Vl'", "Zr'", "Kh'"
    ],
    roots: [
      'thral', 'gnoth', 'krath', 'vorn', 'zekt', 'morg', 'drek', 'skarn', 
      'grath', 'vrex', 'krull', 'thokk', 'grond', 'zhar', 'brakk'
    ],
    suffixes: ['-ak', '-ix', '-or', '-ux', '-eth', '-al', '-om', '-ur', '-ek', '-az'],
    patterns: ['prefix roots suffix', 'roots suffix', 'prefix roots']
  },
  flowing: {
    prefixes: [
      'Ae', 'Io', 'Eu', 'Ai', 'Oa', 'Ei', 'Au', 'Ia', 'Eo', 'Ua',
      'Ael', 'Ith', 'Elu', 'Ori', 'Ala'
    ],
    roots: [
      'laria', 'selia', 'moria', 'velia', 'naia', 'theia', 'reia', 'leia', 
      'saia', 'vaia', 'loria', 'nelia', 'taria', 'veria', 'solia'
    ],
    suffixes: ['-an', '-is', '-us', '-ae', '-os', '-ia', '-ea', '-o', '-el', '-en'],
    patterns: ['prefix roots', 'roots suffix', 'prefix roots suffix']
  },
  poetic: {
    prefixes: [
      'Whisper', 'Shadow', 'Crystal', 'Storm', 'Mist', 'Dream', 
      'Star', 'Moon', 'Dawn', 'Dusk', 'Ember', 'Frost', 'Silver', 'Golden'
    ],
    roots: [
      ' Harbor', ' Haven', ' Gate', ' Reach', ' Deep', ' Crown', 
      ' Light', ' Song', ' Vale', ' Peak', ' Spire', ' Hollow', ' Shore', ' Drift'
    ],
    suffixes: ["'s End", "'s Edge", "'s Rest", '', ' Eternal', ' Ascendant', "'s Wake", "'s Promise", ''],
    patterns: ['prefix roots', 'prefix roots suffix', 'prefix suffix']
  }
};

export function generateName(style: NamingStyle, rng: SeededRandom): string {
  const data = NAMING_STYLES[style];
  const pattern = rng.pick(data.patterns);
  
  let name = '';
  
  if (pattern.includes('prefix')) {
    name += rng.pick(data.prefixes);
  }
  if (pattern.includes('roots')) {
    name += rng.pick(data.roots);
  }
  if (pattern.includes('suffix')) {
    name += rng.pick(data.suffixes);
  }
  
  return name.trim();
}

// Generate a designation for unclaimed stars
export function generateDesignation(seed: number, index: number): string {
  return `UNK-${seed}-${index.toString().padStart(4, '0')}`;
}
