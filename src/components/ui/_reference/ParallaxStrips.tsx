/**
 * StellarForge — ParallaxStrips (ambient telemetry)
 *
 * Revision 2. Four layers of mono text drifting at different speeds.
 *
 * What changed from v1 and why:
 *   • gated on var(--sf-ambient) and prefers-reduced-motion. v1 animated
 *     unconditionally on scroll.
 *   • aria-hidden. This is texture, not information — and it must never be
 *     the only place a real value appears. If a number matters, it belongs
 *     in a KeyValueRow, not drifting past at 0.06 alpha.
 *   • strip alpha ceiling raised off the floor and the gradient end lifted
 *     to the surface plane so the strip container reads as a plane.
 *   • scroll handler moved to rAF; v1 wrote transforms directly in the
 *     scroll event, which jank-ed on long tool pages.
 */

import { useEffect, useRef } from 'react';

type Strip = {
  text: string;
  top: number;      // px from container top
  speed: number;    // scroll multiplier
  color: string;    // decorative only — use color-mix over a token, never raw hex
  size: number;
  tracking: number;
};

const DEFAULT_STRIPS: Strip[] = [
  { top: 24,  speed: 0.3, size: 12, tracking: 2,
    color: 'color-mix(in srgb, var(--t4) 55%, transparent)',
    text: '39.87°N · 104.97°W  ·  ALT 5280 ft  ·  PRESSURE 1013.25 hPa  ·  T -18.4°C  ·  SOL 19,327  ·  JD 2461158.5  ·  LUNAR PHASE 0.74  ·  SUNSET 16:41:02  ·  MAG -26.74  ·  AU 1.00000' },
  { top: 72,  speed: 0.6, size: 12, tracking: 2,
    color: 'color-mix(in srgb, var(--sf-teal) 45%, transparent)',
    text: 'WORLDS: 00347  ·  SPECIES: 02,184  ·  SAVES: 19,402,718  ·  UPTIME 99.987%  ·  P95 LATENCY 42ms  ·  REGION US-WEST-2  ·  BUILD 2026.05.28-rc4' },
  { top: 120, speed: 1.0, size: 12, tracking: 2,
    color: 'color-mix(in srgb, var(--t4) 40%, transparent)',
    text: '// [NOTE] biome/tundra parameters stable across 1e4 iterations  ·  checksum 7F2A-91B0-44CE  ·  seed 0xDEADB10C  ·  author: batt,j  ·  rev 142  ·  last_commit "fix: gravity tensor drift in low-g"' },
  { top: 164, speed: 1.6, size: 12, tracking: 2,
    color: 'color-mix(in srgb, var(--sf-amber) 38%, transparent)',
    text: 'TRAJECTORY BOUND ··· ECLIPTIC +07.42° ··· TARGET: WOLF 359 ··· 7.86 ly ··· Δv 4.22e7 m/s' },
];

export function ParallaxStrips({
  strips = DEFAULT_STRIPS, height = 220, className,
}: { strips?: Strip[]; height?: number; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ambient = getComputedStyle(document.documentElement)
      .getPropertyValue('--sf-ambient').trim();
    if (reduced || ambient === '0') return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      const rect = containerRef.current?.getBoundingClientRect();
      const progress = rect ? -rect.top * 0.5 : window.scrollY * 0.5;
      stripRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(${-progress * strips[i].speed}px,0,0)`;
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };

    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strips]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{
        height,
        background: 'linear-gradient(180deg, var(--sf-void), var(--sf-surface))',
        opacity: 'var(--sf-ambient)',
      }}
    >
      {strips.map((s, i) => (
        <div
          key={i}
          ref={(el) => { stripRefs.current[i] = el; }}
          className="absolute left-0 whitespace-nowrap font-mono will-change-transform"
          style={{ top: s.top, color: s.color, fontSize: s.size, letterSpacing: s.tracking }}
        >
          {s.text}&nbsp;&nbsp;·&nbsp;&nbsp;{s.text}
        </div>
      ))}
    </div>
  );
}
