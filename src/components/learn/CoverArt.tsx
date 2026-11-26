// ---------------------------------------------------------------------------
// Original generated cover art for SF University (finding 6).
//
// The CMS cover images were vintage book and film art, a rights risk. Every
// article, course and the landing video now get a deterministic SVG seeded
// by slug: a starfield, a world with its orbit arcs, the category glyph and
// a cascade band with the article's layer lit. Same slug, same cover, on
// every surface. Colours are tokens (CSS variables), so covers follow the
// user's theme and no hex is copied into a component.
// ---------------------------------------------------------------------------

import { useId, useMemo } from "react";
import type { ToolAccent } from "@/lib/tool-accents";
import { cn } from "@/lib/utils";

export type CoverGlyph = "basics" | "science" | "craft" | "case-studies" | "course" | "signal";

/** Category → cascade accent. Science is physics, craft is story (mythology). */
export const CATEGORY_ACCENT: Record<string, ToolAccent> = {
  basics: "azure",
  science: "amber",
  craft: "stellar",
  "case-studies": "violet",
};

const BAND: ToolAccent[] = ["amber", "azure", "emerald", "magenta", "stellar", "violet", "teal"];

// Literal classes so Tailwind keeps them (no dynamic class names).
const BAND_BG: Record<ToolAccent, string> = {
  amber: "bg-sf-amber",
  azure: "bg-sf-azure",
  emerald: "bg-sf-emerald",
  magenta: "bg-sf-magenta",
  stellar: "bg-sf-stellar",
  violet: "bg-sf-violet",
  teal: "bg-sf-teal",
  crimson: "bg-sf-crimson",
};

const W = 1200;
const H = 675;

/** FNV-1a, 32-bit. Stable across runs and platforms. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded PRNG returning [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CoverModel {
  stars: { x: number; y: number; r: number; o: number }[];
  planet: { x: number; y: number; r: number; shadowDx: number };
  orbits: { rx: number; ry: number; rot: number; dashed: boolean }[];
  moon: { orbit: number; t: number };
  glow: { x: number; y: number };
}

/** The pure, seeded geometry. Exported for the determinism test. */
export function buildCover(seedKey: string): CoverModel {
  const rand = seededRandom(hashString(seedKey));
  const between = (lo: number, hi: number) => lo + (hi - lo) * rand();

  const stars = Array.from({ length: 110 }, () => ({
    x: Math.round(between(0, W)),
    y: Math.round(between(0, H - 40)),
    r: Math.round(between(0.6, 2.1) * 10) / 10,
    o: Math.round(between(0.18, 0.85) * 100) / 100,
  }));

  // The world sits off-centre, right of the glyph corner.
  const planet = {
    x: Math.round(between(W * 0.45, W * 0.78)),
    y: Math.round(between(H * 0.32, H * 0.62)),
    r: Math.round(between(70, 150)),
    shadowDx: Math.round(between(-0.55, 0.55) * 100) / 100,
  };

  const orbitCount = 2 + Math.floor(rand() * 2);
  const baseRot = between(-24, 8);
  const orbits = Array.from({ length: orbitCount }, (_, i) => {
    const rx = planet.r * (1.7 + i * between(0.7, 1.1));
    return {
      rx: Math.round(rx),
      ry: Math.round(rx * between(0.18, 0.34)),
      rot: Math.round((baseRot + between(-4, 4)) * 10) / 10,
      dashed: i === orbitCount - 1,
    };
  });

  return {
    stars,
    planet,
    orbits,
    moon: { orbit: Math.floor(rand() * orbitCount), t: between(0, Math.PI * 2) },
    glow: { x: Math.round(between(W * 0.3, W * 0.9)), y: Math.round(between(H * 0.2, H * 0.8)) },
  };
}

const v = (name: string) => `var(--${name})`;

function Glyph({ kind, color }: { kind: CoverGlyph; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "square" as const };
  switch (kind) {
    case "basics":
      return (
        <g {...common}>
          <rect x="0" y="0" width="56" height="56" />
          <rect x="14" y="14" width="28" height="28" />
          <line x1="28" y1="0" x2="28" y2="14" />
        </g>
      );
    case "science":
      return (
        <g {...common} transform="translate(28 28)">
          <ellipse rx="30" ry="11" />
          <ellipse rx="30" ry="11" transform="rotate(60)" />
          <ellipse rx="30" ry="11" transform="rotate(-60)" />
          <circle r="4" fill={color} stroke="none" />
        </g>
      );
    case "craft":
      return (
        <g {...common}>
          <rect x="4" y="0" width="44" height="56" />
          <line x1="14" y1="16" x2="38" y2="16" />
          <line x1="14" y1="28" x2="38" y2="28" />
          <line x1="14" y1="40" x2="28" y2="40" />
        </g>
      );
    case "case-studies":
      return (
        <g {...common}>
          <circle cx="22" cy="22" r="18" />
          <line x1="35" y1="35" x2="54" y2="54" />
        </g>
      );
    case "course":
      return (
        <g {...common}>
          <polygon points="28,2 56,16 28,30 0,16" />
          <polyline points="10,22 10,40 28,50 46,40 46,22" />
        </g>
      );
    case "signal":
      return (
        <g {...common}>
          <polygon points="14,6 50,28 14,50" />
        </g>
      );
  }
}

export interface CoverArtProps {
  /** Seed: the article or course slug. */
  seed: string;
  /** CMS category (basics, science, craft, case-studies) or a ToolAccent. */
  category?: string;
  glyph?: CoverGlyph;
  className?: string;
  /** Decorative by default; pass a label to expose it as an image. */
  label?: string;
}

export function CoverArt({ seed, category, glyph, className, label }: CoverArtProps): JSX.Element {
  const uid = useId().replace(/:/g, "");
  const model = useMemo(() => buildCover(seed), [seed]);
  const accent: ToolAccent = (category && CATEGORY_ACCENT[category]) || "teal";
  const accentVar = v(`sf-${accent}`);
  const glyphKind: CoverGlyph =
    glyph ?? (category && category in CATEGORY_ACCENT ? (category as CoverGlyph) : "course");
  const { planet, orbits, moon, glow, stars } = model;
  const moonOrbit = orbits[moon.orbit];
  const mx = Math.cos(moon.t) * moonOrbit.rx;
  const my = Math.sin(moon.t) * moonOrbit.ry;
  const lit = BAND.indexOf(accent);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-sf-void", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 block h-full w-full"
        focusable="false"
      >
        <defs>
          <radialGradient id={`g${uid}`} cx={glow.x / W} cy={glow.y / H} r="0.6">
            <stop offset="0" style={{ stopColor: accentVar }} stopOpacity="0.22" />
            <stop offset="1" style={{ stopColor: accentVar }} stopOpacity="0" />
          </radialGradient>
          <clipPath id={`p${uid}`}>
            <circle cx={planet.x} cy={planet.y} r={planet.r} />
          </clipPath>
        </defs>

        <rect width={W} height={H} fill={`url(#g${uid})`} />

        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ fill: v("t1") }} fillOpacity={s.o} />
        ))}

        {/* Orbits behind the world */}
        <g transform={`translate(${planet.x} ${planet.y})`}>
          {orbits.map((o, i) => (
            <ellipse
              key={i}
              rx={o.rx}
              ry={o.ry}
              transform={`rotate(${o.rot})`}
              fill="none"
              style={{ stroke: i === 0 ? accentVar : v("sf-line-emphasis") }}
              strokeOpacity={i === 0 ? 0.7 : 1}
              strokeWidth={1.5}
              strokeDasharray={o.dashed ? "6 10" : undefined}
            />
          ))}
        </g>

        {/* The world, lit from one side */}
        <circle cx={planet.x} cy={planet.y} r={planet.r} style={{ fill: v("sf-surface-elevated") }} />
        <g clipPath={`url(#p${uid})`}>
          <circle
            cx={planet.x + planet.shadowDx * planet.r * 1.6}
            cy={planet.y - planet.r * 0.25}
            r={planet.r * 1.05}
            style={{ fill: v("sf-void") }}
            fillOpacity={0.7}
          />
          <line
            x1={planet.x - planet.r}
            y1={planet.y + planet.r * 0.35}
            x2={planet.x + planet.r}
            y2={planet.y + planet.r * 0.2}
            style={{ stroke: accentVar }}
            strokeOpacity={0.35}
            strokeWidth={2}
          />
        </g>
        <circle cx={planet.x} cy={planet.y} r={planet.r} fill="none" style={{ stroke: accentVar }} strokeWidth={2} />

        {/* A moon on one orbit */}
        <g transform={`translate(${planet.x} ${planet.y}) rotate(${moonOrbit.rot})`}>
          <circle cx={mx} cy={my} r={9} style={{ fill: v("t1") }} />
        </g>
      </svg>

      {/* Category glyph, pinned top-left whatever the crop */}
      <svg viewBox="-4 -4 64 64" className="absolute left-[5%] top-[8%] h-[14%] min-h-4 w-auto" focusable="false">
        <Glyph kind={glyphKind} color={accentVar} />
      </svg>

      {/* Cascade band: seven layers, this article's lit */}
      <div className="absolute inset-x-0 bottom-0 flex h-1.5 items-end">
        {BAND.map((b, i) => (
          <span
            key={b}
            className={cn("flex-1", BAND_BG[b], i === lit ? "h-full" : "h-0.5")}
          />
        ))}
      </div>
    </div>
  );
}

export default CoverArt;
