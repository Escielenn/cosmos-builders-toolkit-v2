/**
 * StellarForge — VelocityDial (ambient telemetry)
 *
 * Revision 2. Cycles every 3.4s through four real reference frames.
 * Ambient, never interactive, never load-bearing.
 *
 * What changed from v1 and why:
 *   • hardcoded #2E3548 ticks (1.4:1) → sf-line tokens, so the dial is
 *     actually visible on the plane it sits on.
 *   • the "REF-FRAME" label used t5 (1.51:1). t5 is retired.
 *   • 9px mono at 2px tracking → 12px at 0.10em. Tracking under 12px
 *     destroys word shape, and this was below the floor on both counts.
 *   • respects prefers-reduced-motion and var(--sf-ambient).
 *   • aria-hidden: it is decoration, and a screen reader announcing a
 *     changing velocity every 3.4s is hostile.
 */

import { useEffect, useState } from 'react';

type Frame = { name: string; v: string; u: string; pct: number };

const FRAMES: Frame[] = [
  { name: 'EARTH ROTATION', v: '0.465', u: 'km/s', pct: 0.05 },
  { name: 'SOLAR ORBIT',    v: '29.78', u: 'km/s', pct: 0.22 },
  { name: 'SOLAR APEX',     v: '19.4',  u: 'km/s', pct: 0.15 },
  { name: 'GALACTIC ORBIT', v: '230',   u: 'km/s', pct: 0.88 },
];

const TICK_MINOR = '#50555E';   // sf-line-hairline
const TICK_MAJOR = '#676B75';       // sf-line
const TRACK      = '#676B75';

export function VelocityDial({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (still) return;                       // hold on frame 0 when motion is reduced
    const t = setInterval(() => setIdx((i) => (i + 1) % FRAMES.length), 3400);
    return () => clearInterval(t);
  }, [still]);

  const f = FRAMES[idx];
  const deg = -135 + 270 * f.pct;

  const r = 60, cx = 100, cy = 100;
  const start = -Math.PI * 1.25;
  const end = start + Math.PI * 1.5 * f.pct;
  const arcD =
    `M ${cx + Math.cos(start) * r} ${cy + Math.sin(start) * r} ` +
    `A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ` +
    `${cx + Math.cos(end) * r} ${cy + Math.sin(end) * r}`;

  return (
    <div
      aria-hidden
      className={`relative aspect-square bg-sf-void border border-sf-line p-sf-5 ${className ?? ''}`}
      // Must reach 0. At any residual opacity the t1/t4 text inside falls
      // below its measured ratio, which is exactly what ambient-off exists to prevent.
      style={{ opacity: 'var(--sf-ambient)' }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="veloArc" x1="0" x2="1">
            <stop offset="0" stopColor="var(--sf-teal)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--sf-teal)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {Array.from({ length: 60 }).map((_, i) => {
          const a = -Math.PI * 1.25 + (i / 59) * Math.PI * 1.5;
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 82} y1={100 + Math.sin(a) * 82}
              x2={100 + Math.cos(a) * (major ? 72 : 76)}
              y2={100 + Math.sin(a) * (major ? 72 : 76)}
              stroke={major ? TICK_MAJOR : TICK_MINOR}
              strokeWidth={major ? 1.2 : 0.8}
            />
          );
        })}

        <path
          d={`M ${100 + Math.cos(-Math.PI * 1.25) * 60} ${100 + Math.sin(-Math.PI * 1.25) * 60} A 60 60 0 1 1 ${100 + Math.cos(Math.PI * 0.25) * 60} ${100 + Math.sin(Math.PI * 0.25) * 60}`}
          fill="none" stroke={TRACK} strokeWidth={3}
        />
        <path d={arcD} fill="none" stroke="url(#veloArc)" strokeWidth={3} strokeLinecap="round" />

        <line
          x1={100} y1={100} x2={100} y2={40}
          stroke="var(--sf-teal)" strokeWidth={1.5}
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${deg}deg)`,
            transition: still ? 'none' : 'transform 2400ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        <circle cx={100} cy={100} r={5} fill="var(--sf-void)" stroke="var(--sf-teal)" strokeWidth={1.5} />
        <circle cx={100} cy={100} r={1.5} fill="var(--sf-teal)" />
      </svg>

      <div className="absolute left-1/2 top-[62%] -translate-x-1/2 text-center w-full">
        <div className="font-mono text-sf-mono text-t4">{f.name}</div>
        {/* Mono, not display. MD Nichrome is H1-only and numbers are always mono. */}
        <div className="font-mono font-medium text-[24px] text-t1 tracking-[0.02em] mt-sf-1">
          {f.v}<span className="text-[13px] text-t3 ml-1">{f.u}</span>
        </div>
      </div>

      <div className="absolute left-sf-3 top-sf-3 font-mono text-sf-mono text-sf-teal-text">VELOCITY</div>
      <div className="absolute right-sf-3 top-sf-3 font-mono text-sf-mono text-t4">REF-FRAME</div>
    </div>
  );
}
