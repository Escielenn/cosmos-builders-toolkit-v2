/**
 * StellarForge — ParallaxStrips (ambient telemetry)
 *
 * Four layers of mono text drifting across a container at different speeds,
 * parallax-linked to page scroll. Drop into hero sections, long-form pages,
 * or the background of empty states.
 */

import { useEffect, useRef } from 'react';

type Strip = {
  text: string;
  top: number;        // px from top of container
  speed: number;      // scroll multiplier (0.3 = slow, 1.6 = fast)
  color: string;      // rgba string; keep alpha 0.03–0.18
  size: number;       // font-size px
  tracking: number;   // letter-spacing px
};

const DEFAULT_STRIPS: Strip[] = [
  {
    top: 24, speed: 0.3, size: 10, tracking: 3,
    color: 'rgba(255,255,255,0.10)',
    text: '39.87°N · 104.97°W  ·  ALT 5280 ft  ·  PRESSURE 1013.25 hPa  ·  T -18.4°C  ·  SOL 19,327  ·  JD 2461158.5  ·  LUNAR PHASE 0.74  ·  SUNSET 16:41:02  ·  MAG -26.74  ·  AU 1.00000',
  },
  {
    top: 72, speed: 0.6, size: 11, tracking: 2.5,
    color: 'rgba(21,193,123,0.18)',
    text: 'WORLDS: 00347  ·  SPECIES: 02,184  ·  SAVES: 19,402,718  ·  UPTIME 99.987%  ·  P95 LATENCY 42ms  ·  REGION US-WEST-2  ·  BUILD 2026.05.28-rc4',
  },
  {
    top: 120, speed: 1.0, size: 12, tracking: 2,
    color: 'rgba(255,255,255,0.06)',
    text: '// [NOTE] biome/tundra parameters stable across 1e4 iterations  ·  checksum 7F2A-91B0-44CE  ·  seed 0xDEADB10C  ·  author: batt,j  ·  rev 142  ·  last_commit "fix: gravity tensor drift in low-g"',
  },
  {
    top: 164, speed: 1.6, size: 10.5, tracking: 3,
    color: 'rgba(255,184,0,0.14)',
    text: 'TRAJECTORY BOUND ··· ECLIPTIC +07.42° ··· TARGET: WOLF 359 ··· 7.86 ly ··· Δv 4.22e7 m/s',
  },
];

export function ParallaxStrips({
  strips = DEFAULT_STRIPS,
  height = 220,
  className,
}: {
  strips?: Strip[];
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const progress = rect ? -rect.top * 0.5 : window.scrollY * 0.5;
      stripRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.transform = `translate3d(${-progress * strips[i].speed}px, 0, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [strips]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ height, background: 'linear-gradient(180deg, #0A0E17, #121724)' }}
    >
      {strips.map((s, i) => (
        <div
          key={i}
          ref={(el) => (stripRefs.current[i] = el)}
          className="absolute left-0 whitespace-nowrap font-mono will-change-transform"
          style={{
            top: s.top,
            color: s.color,
            fontSize: s.size,
            letterSpacing: s.tracking,
          }}
        >
          {/* Double the text so we always have coverage when it scrolls */}
          {s.text}&nbsp;&nbsp;·&nbsp;&nbsp;{s.text}
        </div>
      ))}
    </div>
  );
}
