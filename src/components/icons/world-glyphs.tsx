// World glyphs (1.7): the icon a writer picks for a world.
//
// One line family, drawn in the ToolGlyph vocabulary (tool-icons.tsx): a
// 24x24 grid, 1.5 stroke, square caps, miter joins, currentColor, no fills
// except tiny accent dots. It replaces two older sets that sat side by side
// on the same cards: lucide icons (2px round strokes) and 464 full-colour
// cartoon illustrations under /world-pics/.
//
// Stored ids do not change. `src/lib/world-icons.ts` resolves every id a
// world may carry (a glyph id, or a legacy "/world-pics/NNN-name.svg" path)
// to one of the glyphs here; unknown ids fall back to the globe.

import React from "react";
import { cn } from "@/lib/utils";
import { glyphVocabulary } from "@/components/icons/tool-icons";

const { dot, disc, orbit, star, wave, lattice, eye, hull } = glyphVocabulary;

type El = React.ReactElement;

const GLYPHS: Record<string, El> = {
  // ── Celestial ──
  globe: (
    <>
      {disc(12, 12, 9)}
      {orbit(12, 12, 4, 9)}
      <path d="M3 12H21" />
    </>
  ),
  "globe-2": (
    <>
      {disc(12, 12, 9)}
      <path d="M4.5 7.5H19.5M4.5 16.5H19.5M12 3V21" />
    </>
  ),
  ringed: (
    <>
      {disc(12, 12, 5.5)}
      {orbit(12, 12, 10.5, 3.2, -20)}
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4A6.5 6.5 0 0 0 20 14.5Z" />,
  sun: (
    <>
      {disc(12, 12, 4)}
      <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7 7M17 17L19.1 19.1M4.9 19.1L7 17M17 7L19.1 4.9" />
    </>
  ),
  star: <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" />,
  sparkles: (
    <>
      {star(9, 14, 6)}
      {star(18.5, 5.5, 3)}
    </>
  ),
  comet: (
    <>
      {disc(16.5, 7.5, 3)}
      <path d="M14.2 9.8L4 20M12.2 8L3 13.5M16 11.8L10.5 21" />
    </>
  ),
  constellation: (
    <>
      <path d="M4 6L10 9L14 5L19 11L13 17L6 19" />
      {dot(4, 6)}
      {dot(10, 9)}
      {dot(14, 5)}
      {dot(19, 11)}
      {dot(13, 17)}
      {dot(6, 19)}
    </>
  ),
  galaxy: (
    <>
      <path d="M12 12A2 2 0 0 1 14 10A4.5 4.5 0 0 1 16.5 16A7.5 7.5 0 0 1 5 14" />
      <path d="M12 12A2 2 0 0 1 10 14A4.5 4.5 0 0 1 7.5 8A7.5 7.5 0 0 1 19 10" />
      {dot(12, 12, 1)}
    </>
  ),
  "black-hole": (
    <>
      {disc(12, 12, 3.5)}
      {dot(12, 12, 1.5)}
      {orbit(12, 12, 10.5, 3.5, -20)}
      <path d="M6.5 6.5A7.8 7.8 0 0 1 17.5 6.5" />
    </>
  ),
  eclipse: (
    <>
      {disc(9.5, 12, 6.5)}
      {disc(14.5, 12, 6.5)}
    </>
  ),

  // ── Space ──
  rocket: (
    <>
      <path d="M12 2C15 5 16 9 16 14H8C8 9 9 5 12 2Z" />
      <path d="M8 14L5 18H8M16 14L19 18H16M12 17V22" />
      {dot(12, 9)}
    </>
  ),
  ship: (
    <>
      {hull(4.5, 12, 17, 6)}
      <path d="M4.5 10.5H1.5M4.5 13.5H1.5" />
      {dot(14, 12, 1)}
    </>
  ),
  orbit: (
    <>
      {disc(12, 12, 3)}
      {orbit(12, 12, 10, 4.5, -30)}
      {dot(20.66, 7, 1.5)}
    </>
  ),
  satellite: (
    <>
      <path d="M9.5 9.5H14.5V14.5H9.5Z" />
      <path d="M2 10H7.5V14H2ZM16.5 10H22V14H16.5Z" />
      <path d="M7.5 12H9.5M14.5 12H16.5M12 9.5V6" />
      {dot(12, 4.5, 1)}
    </>
  ),
  station: (
    <>
      {disc(12, 12, 3)}
      {disc(12, 12, 9)}
      <path d="M12 3V9M12 15V21M3 12H9M15 12H21" />
    </>
  ),
  telescope: (
    <>
      <path d="M3 14L15 7L17 10.5L5 17.5Z" />
      <path d="M11 15L8 22M11 15L15 22" />
      {star(19.5, 4.5, 2)}
    </>
  ),
  helmet: (
    <>
      <path d="M5 13A7 7 0 0 1 19 13V16A3 3 0 0 1 16 19H8A3 3 0 0 1 5 16Z" />
      <path d="M8 11.5H16V14A2 2 0 0 1 14 16H10A2 2 0 0 1 8 14Z" />
      <path d="M9 19V22H15V19M12 6V3.5" />
      {dot(12, 2.5, 1)}
    </>
  ),
  rover: (
    <>
      <path d="M4 9H16L19 13V16H4Z" />
      {disc(8, 18, 2.2)}
      {disc(16, 18, 2.2)}
      <path d="M8 9V5.5M12 9V6.5H16" />
      {dot(8, 4, 1)}
    </>
  ),
  saucer: (
    <>
      <path d="M8 11A4 4 0 0 1 16 11" />
      {orbit(12, 13, 10, 3)}
      <path d="M8.5 17L7 21M12 17.5V21.5M15.5 17L17 21" />
    </>
  ),

  // ── Elements ──
  flame: (
    <>
      <path d="M12 2C13 7 18 9.5 18 15A6 6 0 0 1 6 15C6 12 8.5 11 9 8C10.5 9.5 11.5 8 12 2Z" />
      {dot(12, 16.5)}
    </>
  ),
  droplets: (
    <>
      <path d="M12 3C15 8 18 11 18 15A6 6 0 0 1 6 15C6 11 9 8 12 3Z" />
      <path d="M9.5 15.5A2.5 2.5 0 0 0 12 18" />
    </>
  ),
  wind: <path d="M3 8H14A3 3 0 1 0 11 5M3 12H19A3 3 0 1 1 16 15M3 16H10A2.5 2.5 0 1 1 7.5 18.5" />,
  mountain: (
    <>
      <path d="M2 20L9 7L13 14L15.5 10.5L22 20Z" />
      <path d="M7 11L9 12L11 10.5" />
    </>
  ),
  waves: (
    <>
      {wave(2, 7, 10, 1.5, 4)}
      {wave(2, 12, 10, 1.5, 4)}
      {wave(2, 17, 10, 1.5, 4)}
    </>
  ),
  snowflake: (
    <>
      <path d="M12 2V22M3.3 7L20.7 17M3.3 17L20.7 7" />
      <path d="M9.5 4L12 6.5L14.5 4M9.5 20L12 17.5L14.5 20" />
    </>
  ),
  cloud: <path d="M7 18A4 4 0 0 1 7 10A5.5 5.5 0 0 1 17.5 9.5A4.25 4.25 0 0 1 17.5 18Z" />,
  crystal: (
    <>
      <path d="M12 2L19 9L12 22L5 9Z" />
      <path d="M5 9H19M9 9L12 2L15 9L12 22Z" />
    </>
  ),

  // ── Life ──
  leaf: (
    <>
      <path d="M4 20C4 10 10 4 20 4C20 14 14 20 4 20Z" />
      <path d="M4 20L14 10" />
    </>
  ),
  trees: (
    <>
      <path d="M12 2L18 11H15L20 18H4L9 11H6Z" />
      <path d="M12 18V22" />
    </>
  ),
  flower: (
    <>
      {orbit(12, 5.5, 2, 2.5)}
      {orbit(12, 14.5, 2, 2.5)}
      {orbit(7.5, 10, 2.5, 2)}
      {orbit(16.5, 10, 2.5, 2)}
      {dot(12, 10)}
      <path d="M12 17V22" />
    </>
  ),
  bug: (
    <>
      {orbit(12, 13, 4.5, 6)}
      <path d="M7.5 11L3.5 9M7.5 14H3M8 17L4.5 19.5M16.5 11L20.5 9M16.5 14H21M16 17L19.5 19.5" />
      <path d="M10 7.5L8.5 4M14 7.5L15.5 4" />
    </>
  ),
  alien: (
    <>
      <path d="M12 3C17 3 19 7 19 10.5C19 15.5 15 21 12 21C9 21 5 15.5 5 10.5C5 7 7 3 12 3Z" />
      {orbit(9.2, 11.5, 1.8, 1.1, 25)}
      {orbit(14.8, 11.5, 1.8, 1.1, -25)}
      <path d="M11 17H13" />
    </>
  ),
  mask: (
    <>
      <path d="M5 4L8 8H16L19 4V13C19 17.5 15.5 21 12 21C8.5 21 5 17.5 5 13Z" />
      <path d="M8.5 12.5H10.5M13.5 12.5H15.5M12 15V17.5" />
    </>
  ),
  eye: <>{eye(12, 12, 9.5, 3.4)}</>,

  // ── Civilization ──
  building: (
    <>
      <path d="M4 21V8H10V21M10 21V3H17V21M17 21V11H21V21M2 21H22" />
      {dot(13.5, 7, 0.9)}
      {dot(13.5, 11, 0.9)}
      {dot(13.5, 15, 0.9)}
    </>
  ),
  castle: (
    <>
      <path d="M4 21V7H7V9.5H10V7H14V9.5H17V7H20V21Z" />
      <path d="M10 21V16A2 2 0 0 1 14 16V21" />
    </>
  ),
  temple: (
    <>
      <path d="M3 9L12 3L21 9Z" />
      <path d="M5 9V18M9.5 9V18M14.5 9V18M19 9V18M3 18H21M2 21H22" />
    </>
  ),
  crown: (
    <>
      <path d="M3 18L4.5 7L9 12L12 5L15 12L19.5 7L21 18Z" />
      <path d="M3 21H21" />
    </>
  ),
  sword: (
    <>
      <path d="M12 2L14.5 5.5V15H9.5V5.5Z" />
      <path d="M6.5 15H17.5M12 15V20.5" />
      {dot(12, 21.5, 1)}
    </>
  ),
  swords: (
    <>
      <path d="M4 3L16 15M20 3L8 15" />
      <path d="M13 18L18 13M11 18L6 13M15.5 15.5L20 20M8.5 15.5L4 20" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5Z" />
      {dot(12, 11.5)}
    </>
  ),
  scroll: (
    <>
      <path d="M5 3H17V18A3 3 0 0 0 20 21H8A3 3 0 0 1 5 18Z" />
      <path d="M8.5 8H13.5M8.5 12H13.5" />
    </>
  ),
  book: <path d="M12 6C10 4.5 7 4 3 4V19C7 19 10 19.5 12 21C14 19.5 17 19 21 19V4C17 4 14 4.5 12 6ZM12 6V21" />,
  map: <path d="M3 6L9 4L15 6L21 4V18L15 20L9 18L3 20ZM9 4V18M15 6V20" />,

  // ── Abstract ──
  compass: (
    <>
      {disc(12, 12, 9)}
      <path d="M15.5 8.5L13.5 13.5L8.5 15.5L10.5 10.5Z" />
      {dot(12, 12, 0.75)}
    </>
  ),
  anchor: (
    <>
      {disc(12, 5, 2)}
      <path d="M12 7V21M8 11H16M4 14A8 8 0 0 0 20 14" />
    </>
  ),
  infinity: (
    <path d="M12 12C10 8.5 8.5 7.5 6.5 7.5A4.5 4.5 0 0 0 6.5 16.5C8.5 16.5 10 15.5 12 12C14 8.5 15.5 7.5 17.5 7.5A4.5 4.5 0 0 1 17.5 16.5C15.5 16.5 14 15.5 12 12Z" />
  ),
  atom: (
    <>
      {orbit(12, 12, 10, 4)}
      {orbit(12, 12, 10, 4, 60)}
      {orbit(12, 12, 10, 4, 120)}
      {dot(12, 12, 1.5)}
    </>
  ),
  zap: <path d="M13 2L4 14H11L10 22L20 9H13Z" />,
  robot: (
    <>
      <path d="M5 8H19V19H5Z" />
      <path d="M12 8V4.5M9 16H15M2.5 12V15M21.5 12V15" />
      {dot(12, 3.5, 1)}
      {dot(9, 12.5)}
      {dot(15, 12.5)}
    </>
  ),
  chip: (
    <>
      {lattice(7, 7, 10, 2)}
      <path d="M10 7V3M14 7V3M10 21V17M14 21V17M3 10H7M3 14H7M17 10H21M17 14H21" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3H15M10 3V9L4.5 19A1.5 1.5 0 0 0 5.8 21H18.2A1.5 1.5 0 0 0 19.5 19L14 9V3" />
      <path d="M7.5 15H16.5" />
    </>
  ),
};

/** Every world glyph id. */
export const WORLD_GLYPH_IDS = Object.keys(GLYPHS);

export function hasWorldGlyph(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLYPHS, id);
}

export interface WorldGlyphProps {
  /** A glyph id from WORLD_GLYPH_IDS. Anything else draws the globe. */
  id: string;
  className?: string;
}

/** One world glyph, in currentColor. Decorative: the world's name is beside it. */
export function WorldGlyph({ id, className }: WorldGlyphProps): JSX.Element {
  const key = hasWorldGlyph(id) ? id : "globe";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeMiterlimit={10}
      aria-hidden="true"
      focusable="false"
      data-world-glyph={key}
      className={cn("h-6 w-6 shrink-0", className)}
    >
      {GLYPHS[key]}
    </svg>
  );
}
