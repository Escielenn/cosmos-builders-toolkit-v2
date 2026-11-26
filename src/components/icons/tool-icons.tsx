// Tool glyphs for StellarForge (1.6 "Quiet Instrument").
//
// One original line-glyph family replaces the old mix of cartoon SVG
// illustrations, numbered clip-art and lucide one-offs. Every glyph is:
//   - an inline SVG on a 24x24 grid, 1.5 stroke, square caps, miter joins
//   - drawn in currentColor, no fills except tiny accent dots
//   - built from one shared vocabulary (orbit ring, planet disc, star point,
//     wave, lattice, arrow chain, eye, rune, ship hull) so all tools read
//     as one instrument family, legible from 16 to 64px.
//
// Colour: `accent` gives the glyph its tool's cascade hue at the canonical
// stop (icons use --sf-X, not --sf-X-text). Without it the glyph inherits
// currentColor, which dense lists set to t3.

import React from "react";
import { cn } from "@/lib/utils";
import { accentBorderClass, accentIconClass, getToolAccent } from "@/lib/tool-accents";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

type El = React.ReactElement;

/** Tiny filled accent dot: the only fill in the family. */
const dot = (cx: number, cy: number, r = 1.25): El => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);
/** Planet disc. */
const disc = (cx: number, cy: number, r: number): El => <circle cx={cx} cy={cy} r={r} />;
/** Orbit ring (ellipse, optionally tilted). */
const orbit = (cx: number, cy: number, rx: number, ry: number, rot = 0): El => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined} />
);
/** Star point: an instrument cross with a lit centre. */
const star = (cx: number, cy: number, s = 2.5): El => (
  <>
    <path d={`M${cx - s} ${cy}H${cx - 0.9}M${cx + 0.9} ${cy}H${cx + s}M${cx} ${cy - s}V${cy - 0.9}M${cx} ${cy + 0.9}V${cy + s}`} />
    {dot(cx, cy, 0.75)}
  </>
);
/** Wave: n half-periods of amplitude a starting at (x, y), period w. */
const wave = (x: number, y: number, w: number, a: number, n: number): El => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    d += `Q${x + w * (i + 0.5) / 2} ${y + dir * a * 2} ${x + (w * (i + 1)) / 2} ${y}`;
  }
  return <path d={d} />;
};
/** Lattice: an n x n grid in the square (x, y, size). */
const lattice = (x: number, y: number, size: number, n: number): El => {
  const step = size / n;
  let d = `M${x} ${y}H${x + size}V${y + size}H${x}Z`;
  for (let i = 1; i < n; i++) {
    const p = +(x + step * i).toFixed(2);
    const q = +(y + step * i).toFixed(2);
    d += `M${p} ${y}V${y + size}M${x} ${q}H${x + size}`;
  }
  return <path d={d} />;
};
/** Arrowhead at (x, y) pointing along angle deg. */
const head = (x: number, y: number, deg: number, s = 3): El => {
  const r = (deg * Math.PI) / 180;
  const a1 = r + Math.PI * 0.8;
  const a2 = r - Math.PI * 0.8;
  const f = (n: number) => +n.toFixed(2);
  return (
    <path
      d={`M${f(x + s * Math.cos(a1))} ${f(y + s * Math.sin(a1))}L${x} ${y}L${f(x + s * Math.cos(a2))} ${f(y + s * Math.sin(a2))}`}
    />
  );
};
/** Eye: almond lids with a ringed pupil. */
const eye = (cx: number, cy: number, w: number, h: number): El => (
  <>
    <path d={`M${cx - w} ${cy}Q${cx} ${cy - h * 2} ${cx + w} ${cy}Q${cx} ${cy + h * 2} ${cx - w} ${cy}Z`} />
    {disc(cx, cy, h * 0.7)}
    {dot(cx, cy, 0.9)}
  </>
);
/** Ship hull, side profile pointing right. */
const hull = (x: number, y: number, len: number, h: number): El => (
  <path d={`M${x} ${y - h / 2}H${x + len - h}L${x + len} ${y}L${x + len - h} ${y + h / 2}H${x}Z`} />
);

/**
 * The shared vocabulary, for sibling glyph families drawn on the same grid
 * (world icons: src/components/icons/world-glyphs.tsx).
 */
export const glyphVocabulary = { dot, disc, orbit, star, wave, lattice, head, eye, hull };

// ---------------------------------------------------------------------------
// Glyphs (24x24)
// ---------------------------------------------------------------------------

const GLYPHS: Record<string, El> = {
  // ── Physics / Stars & Systems ──
  "star-system-builder": (
    <>
      {star(12, 12, 3)}
      {orbit(12, 12, 6, 6)}
      {orbit(12, 12, 10, 10)}
      {dot(18, 12, 1.5)}
      {dot(5, 5, 1.5)}
    </>
  ),
  "habitable-zone-calculator": (
    <>
      {star(4, 12, 2.5)}
      <path d="M11 3.5A10 10 0 0 1 11 20.5" />
      <path d="M17 2A14 14 0 0 1 17 22" />
      {disc(15.2, 12, 1.8)}
    </>
  ),
  "drake-equation-calculator": (
    <>
      {dot(5, 5)}
      {dot(12, 5)}
      {dot(19, 5)}
      {dot(5, 12)}
      {dot(19, 12)}
      {dot(5, 19)}
      {dot(12, 19)}
      {dot(19, 19)}
      {disc(12, 12, 3.5)}
      {dot(12, 12, 1)}
    </>
  ),
  "time-dilation": (
    <>
      <path d="M5 3H19M5 21H19" />
      <path d="M7 3C7 9 12 10 12 12C12 14 7 15 7 21M17 3C17 9 12 10 12 12C12 14 17 15 17 21" />
      {dot(12, 18.5, 1)}
    </>
  ),
  "kardashev-scale": (
    <>
      <path d="M3 21H8V16H13V11H18V6H21" />
      {dot(5.5, 18, 1)}
      {dot(10.5, 13, 1.3)}
      {dot(15.5, 8, 1.6)}
      {star(20, 2.5, 1.8)}
    </>
  ),
  "surface-gravity-calculator": (
    <>
      <path d="M2 21C6 16.5 18 16.5 22 21" />
      <path d="M12 3V12.5" />
      {head(12, 13, 90)}
      {dot(12, 3, 1)}
    </>
  ),
  gravitas: (
    <>
      <path d="M2 7C8 7 9 16 12 16C15 16 16 7 22 7" />
      <path d="M2 12C7 12 9.5 19 12 19C14.5 19 17 12 22 12" />
      <path d="M12 16V19" />
      {disc(12, 6, 2.5)}
    </>
  ),
  solaris: (
    <>
      {disc(12, 12, 4)}
      <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7 7M17 17L19.1 19.1M4.9 19.1L7 17M17 7L19.1 4.9" />
    </>
  ),
  rogue: (
    <>
      <path d="M2 6C12 6 17 11 17 22" />
      {disc(13.2, 9.9, 2.4)}
      {star(7, 16, 2.5)}
    </>
  ),

  // ── Worlds / Environment ──
  "planetary-profile": (
    <>
      {disc(12, 12, 7.5)}
      <path d="M5 9.5H19M4.5 13.5H19.5" />
      <path d="M16 2L8 22" />
    </>
  ),
  "environmental-chain-reaction": (
    <>
      {disc(4.5, 4.5, 2.25)}
      {disc(12, 12, 2.25)}
      {disc(19.5, 19.5, 2.25)}
      <path d="M6.3 6.3L10.2 10.2M13.8 13.8L17.7 17.7" />
    </>
  ),
  sensorium: (
    <>
      {eye(12, 13, 9, 4)}
      <path d="M7 4.5L8 6.5M12 3V5.5M17 4.5L16 6.5" />
    </>
  ),
  tidelock: (
    <>
      {disc(12, 12, 8)}
      <path d="M12 4V20" />
      <path d="M12 7L16.5 6M12 11.5L19.5 9.5M12 16L19 14M12 19.5L15 18.5" />
    </>
  ),
  exoforge: (
    <>
      {disc(12, 12, 9)}
      <path d="M4.5 15L8.5 10L11.5 13L15 8.5L19.5 14" />
      {dot(15, 5.5, 1)}
    </>
  ),
  "surface-cartographer": (
    <>
      <path d="M3 6L9 4L15 6L21 4V18L15 20L9 18L3 20Z" />
      <path d="M9 4V18M15 6V20" />
      {wave(4.5, 12, 4, 1, 4)}
    </>
  ),

  // ── Sky / navigation ──
  exosky: (
    <>
      <path d="M2 20H22" />
      <path d="M4 15L9 9L14 11L19 4" />
      {dot(4, 15, 1.4)}
      {dot(9, 9, 1.4)}
      {dot(14, 11, 1.4)}
      {star(19, 4, 2.2)}
    </>
  ),
  "stellar-cartographer": (
    <>
      <path d="M2 20L6.5 13H17.5L22 20Z" />
      <path d="M12 13V20M4.25 16.5H19.75" />
      <path d="M8 13V7M17 13V9" />
      {star(8, 5, 2)}
      {dot(17, 8, 1.4)}
    </>
  ),

  // ── Life / Biology ──
  "evolutionary-biology": (
    <>
      <path d="M12 21V15M6 15H18M6 15V9M18 15V5M3 9H9M3 9V5M9 9V5" />
      {dot(3, 4, 1.2)}
      {dot(9, 4, 1.2)}
      {dot(18, 4, 1.2)}
    </>
  ),
  "species-interaction-matrix": (
    <>
      {lattice(3, 3, 18, 3)}
      {dot(6, 6, 1.4)}
      {dot(12, 12, 1.4)}
      {dot(18, 6, 1.4)}
      {dot(6, 18, 1.4)}
    </>
  ),

  // ── Psychology ──
  dossier: (
    <>
      <path d="M4 3H20V21H4Z" />
      {disc(12, 9.5, 3)}
      <path d="M7 18C7.5 15 9.5 14 12 14C14.5 14 16.5 15 17 18" />
    </>
  ),

  // ── Civilizations / Culture ──
  "empire-designer": (
    <>
      <path d="M3 19H21" />
      <path d="M4 19V8L9 12L12 5L15 12L20 8V19" />
      {dot(12, 15, 1.2)}
    </>
  ),
  "technology-consequences": (
    <>
      {lattice(3, 8, 8, 2)}
      <path d="M11 12H15M15 12L19.5 6.5M15 12L19.5 17.5" />
      {head(20, 6, -50, 2.5)}
      {head(20, 18, 50, 2.5)}
    </>
  ),
  "space-expansion-modeler": (
    <>
      {disc(12, 12, 2.5)}
      <path d="M12 9.5V5M14.2 13.25L18 15.5M9.8 13.25L6 15.5" />
      {head(12, 4, -90, 2.5)}
      {head(18.9, 16, 30, 2.5)}
      {head(5.1, 16, 150, 2.5)}
      {dot(19, 6, 1.1)}
      {dot(5, 6, 1.1)}
      {dot(12, 20.5, 1.1)}
    </>
  ),
  "one-big-lie": (
    <>
      {orbit(12, 12, 9.5, 4, -30)}
      {disc(12, 12, 2.5)}
      <path d="M4 20L20 4" />
    </>
  ),
  lexdrift: (
    <>
      <path d="M3 5H21M3 10H16" />
      {wave(3, 16, 6, 1.2, 4)}
      <path d="M15 20.5H21" />
      {dot(21, 10, 1)}
    </>
  ),

  // ── Mythology ──
  "xenomythology-framework-builder": (
    <>
      <path d="M12 3L21 12L12 21L3 12Z" />
      <path d="M12 7V17M12 9.5L15 7M12 13.5L9 11" />
    </>
  ),

  // ── Integration / vehicles / time ──
  "spacecraft-designer": (
    <>
      {hull(2, 12, 20, 8)}
      <path d="M6 8V5H11V8" />
      {dot(9, 12, 1.2)}
      {dot(13, 12, 1.2)}
    </>
  ),
  "propulsion-consequences-map": (
    <>
      <path d="M12 2L16 7V14.5L12 16.5L8 14.5V7Z" />
      <path d="M9.5 19V22M12 19V21M14.5 19V22" />
      {dot(12, 8, 1.2)}
    </>
  ),
  "generation-ship": (
    <>
      <path d="M2 12H18" />
      {orbit(9, 12, 3, 7.5)}
      <path d="M18 9L22 12L18 15Z" />
      {dot(9, 4.5, 1)}
    </>
  ),
  timeline: (
    <>
      <path d="M2 12H22" />
      <path d="M5 9V15M19 9V15" />
      {disc(12, 12, 3)}
      {dot(12, 12, 1)}
      <path d="M12 3V6M12 18V21" />
    </>
  ),
  "writing-workshop": (
    <>
      <path d="M12 2L18 9L13.5 19H10.5L6 9Z" />
      <path d="M12 9V14" />
      {dot(12, 15.5, 1)}
      <path d="M8 22H16" />
    </>
  ),
};

/** Every tool id that has a glyph. */
export const TOOL_GLYPH_IDS = Object.keys(GLYPHS);

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export interface ToolGlyphProps {
  toolId: string;
  className?: string;
  /** Tint with the tool's cascade accent (canonical stop). Default: currentColor. */
  accent?: boolean;
}

/** The tool's line glyph, or null for a tool without one. */
export function ToolGlyph({ toolId, className, accent = false }: ToolGlyphProps): JSX.Element | null {
  const glyph = GLYPHS[toolId];
  if (!glyph) return null;
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
      data-tool-glyph={toolId}
      className={cn("h-6 w-6 shrink-0", accent && accentIconClass(getToolAccent(toolId)), className)}
    >
      {glyph}
    </svg>
  );
}

/** Tool page title mark: the glyph in a 44px square frame with the accent hairline. */
export function ToolTitleGlyph({ toolId }: { toolId: string }): JSX.Element | null {
  if (!GLYPHS[toolId]) return null;
  return (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center border",
        accentBorderClass(getToolAccent(toolId)),
      )}
    >
      <ToolGlyph toolId={toolId} accent className="h-6 w-6" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Legacy API: TOOL_ICONS / getToolIcon keep working. These components render
// the glyph in its cascade accent (the card/header treatment); dense lists
// should use <ToolGlyph> without `accent` under text-t3.
// ---------------------------------------------------------------------------

interface ToolIconProps {
  className?: string;
}

function createGlyphIcon(toolId: string): React.FC<ToolIconProps> {
  const Component = ({ className = "" }: ToolIconProps) => (
    <ToolGlyph toolId={toolId} accent className={className} />
  );
  Component.displayName = `ToolIcon(${toolId})`;
  return Component;
}

export const TOOL_ICONS: Record<string, React.FC<ToolIconProps>> = Object.fromEntries(
  TOOL_GLYPH_IDS.map((id) => [id, createGlyphIcon(id)]),
);

export const getToolIcon = (toolId: string): React.FC<ToolIconProps> | null => {
  return TOOL_ICONS[toolId] || null;
};
