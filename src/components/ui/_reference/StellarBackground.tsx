/**
 * StellarForge — StellarBackground + DisplaySettings
 *
 * Revision 2.
 *
 * What changed from v1 and why:
 *   • Both layers now multiply var(--sf-ambient), so one variable turns the
 *     whole atmosphere off. v1 had ten always-on decorative layers with no
 *     collective control, and every one of them reduced effective contrast
 *     below the measured token values.
 *   • Honours prefers-contrast, prefers-reduced-transparency and
 *     prefers-reduced-motion (handled in tokens.css).
 *   • Exposes a real user setting. A signature aesthetic that some people
 *     cannot read needs an escape hatch, not an apology.
 *
 * Mount ONCE at the app root.
 */

import { useEffect, useState } from 'react';

export function StellarBackground() {
  return (
    <>
      <div aria-hidden className="sf-starfield" />
      <div aria-hidden className="sf-grain" />
    </>
  );
}

/* ─────────────────────────── Display settings ─────────────────────────── */

export type ContrastMode = 'standard' | 'high';
export type AmbientMode = 'on' | 'off';

const KEY = 'sf-display';

type Prefs = { contrast: ContrastMode; ambient: AmbientMode };
const DEFAULTS: Prefs = { contrast: 'standard', ambient: 'on' };

function read(): Prefs {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

function apply(p: Prefs) {
  const el = document.documentElement;
  if (p.contrast === 'high') el.setAttribute('data-contrast', 'high');
  else el.removeAttribute('data-contrast');
  if (p.ambient === 'off') el.setAttribute('data-ambient', 'off');
  else el.removeAttribute('data-ambient');
}

/**
 * Call once at app start, before first paint if you can — put the equivalent
 * in an inline <script> in index.html to avoid a flash of standard contrast.
 */
export function initDisplayPrefs() {
  apply(read());
}

export function useDisplayPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(read);

  useEffect(() => {
    apply(prefs);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — the setting still applies for this session */
    }
  }, [prefs]);

  return {
    prefs,
    setContrast: (contrast: ContrastMode) => setPrefs((p) => ({ ...p, contrast })),
    setAmbient: (ambient: AmbientMode) => setPrefs((p) => ({ ...p, ambient })),
  };
}

/**
 * Drop into Settings. Ship's Voice throughout — no "Make text easier to read!".
 */
export function DisplaySettings() {
  const { prefs, setContrast, setAmbient } = useDisplayPrefs();

  const row = 'flex items-start justify-between gap-sf-6 py-sf-4 border-b border-sf-line-hairline';
  const btn = (active: boolean) =>
    [
      'min-h-hit px-sf-4 rounded-none border font-sans text-[14px] uppercase tracking-[0.06em]',
      'transition-sf duration-base ease-sf-out',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-focus',
      active
        ? 'bg-sf-teal border-sf-teal text-sf-on-teal'
        : 'bg-transparent border-sf-line-interactive text-t2 hover:border-sf-line-emphasis hover:text-t1',
    ].join(' ');

  return (
    <section>
      <h2 className="font-mono text-sf-mono uppercase text-t4 mb-sf-4">// DISPLAY</h2>

      <div className={row}>
        <div className="sf-measure">
          <div className="text-sf-body text-t1">Contrast</div>
          <p className="text-sf-small text-t3 mt-sf-1">
            High contrast raises secondary text and panel edges, and disables ambient layers.
          </p>
        </div>
        <div className="flex gap-sf-2 shrink-0">
          <button className={btn(prefs.contrast === 'standard')} onClick={() => setContrast('standard')}>
            Standard
          </button>
          <button className={btn(prefs.contrast === 'high')} onClick={() => setContrast('high')}>
            High
          </button>
        </div>
      </div>

      <div className={row}>
        <div className="sf-measure">
          <div className="text-sf-body text-t1">Ambient telemetry</div>
          <p className="text-sf-small text-t3 mt-sf-1">
            Starfield, grain, drifting readouts. Decorative only — nothing is lost when disabled.
          </p>
        </div>
        <div className="flex gap-sf-2 shrink-0">
          <button className={btn(prefs.ambient === 'on')} onClick={() => setAmbient('on')}>
            On
          </button>
          <button className={btn(prefs.ambient === 'off')} onClick={() => setAmbient('off')}>
            Off
          </button>
        </div>
      </div>

      <p className="mt-sf-4 font-mono text-sf-mono text-t4">
        // SYSTEM PREFERENCES FOR CONTRAST, TRANSPARENCY AND MOTION ARE HONOURED AUTOMATICALLY.
      </p>
    </section>
  );
}

/* ─── Usage ───
// src/main.tsx
import { initDisplayPrefs } from '@/components/StellarBackground';
initDisplayPrefs();

// App.tsx
<body className="bg-sf-void text-t2 font-sans min-h-screen relative">
  <StellarBackground />
  <div className="relative z-[2]">{children}</div>
</body>
*/
