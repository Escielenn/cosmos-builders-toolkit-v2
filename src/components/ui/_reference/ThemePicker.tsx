/**
 * StellarForge — ThemePicker
 *
 * Base × primary accent. Every combination is pre-solved by design/themes.py
 * and lands in design/themes.css as a [data-theme="base-accent"] block, so
 * switching is one attribute write — no reload, no recomputation, no way to
 * pick a combination that fails contrast.
 *
 * Load order: tokens.css (structure + default) → themes.css (overrides).
 * Also read the theme in public/no-flash.js so the first paint is right.
 */

import { useEffect, useState } from 'react';
import themes from '@/styles/themes.json'; // GENERATED copy of design/themes.json (install step copies it beside themes.css)

type BaseId = string & keyof typeof themes.bases;
type PrimaryId = (typeof themes.primaries)[number];
const KEY = 'sf-theme';

function read(): { base: BaseId; primary: PrimaryId } {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (p.base in themes.bases && themes.primaries.includes(p.primary)) return p;
  } catch { /* fall through */ }
  return { base: 'void', primary: 'teal' };
}

function apply(base: BaseId, primary: PrimaryId) {
  const id = `${base}-${primary}`;
  const el = document.documentElement;
  if (id === 'void-teal') el.removeAttribute('data-theme');   // the :root default
  else el.setAttribute('data-theme', id);
}

/** Call before first paint — mirror this in an inline <script> in index.html. */
export function initTheme() {
  const { base, primary } = read();
  apply(base, primary);
}

export function useTheme() {
  const [t, setT] = useState(read);
  useEffect(() => {
    apply(t.base, t.primary);
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* session only */ }
  }, [t]);
  return {
    ...t,
    setBase: (base: BaseId) => setT((p) => ({ ...p, base })),
    setPrimary: (primary: PrimaryId) => setT((p) => ({ ...p, primary })),
  };
}

export function ThemePicker() {
  const { base, primary, setBase, setPrimary } = useTheme();
  const bases = Object.entries(themes.bases) as [BaseId, (typeof themes.bases)[BaseId]][];
  const dark = bases.filter(([, b]) => b.mode === 'dark');
  const light = bases.filter(([, b]) => b.mode === 'light');

  const swatch = (id: BaseId, b: (typeof themes.bases)[BaseId]) => (
    <button
      key={id}
      onClick={() => setBase(id)}
      aria-pressed={base === id}
      aria-label={`${b.label} — ${b.blurb}`}
      className={[
        'flex flex-col items-start gap-sf-1 p-sf-3 min-h-hit rounded-none border text-left',
        'transition-sf duration-fast ease-sf-out',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-focus',
        base === id ? 'border-sf-primary' : 'border-sf-line-interactive hover:border-sf-line-emphasis',
      ].join(' ')}
    >
      <span className="block w-full h-6 border border-sf-line" style={{ background: b.seed }} />
      <span className="font-mono text-sf-mono uppercase text-t3">{b.label}</span>
    </button>
  );

  return (
    <section>
      <h2 className="font-mono text-sf-mono uppercase text-t4 mb-sf-4">// APPEARANCE</h2>

      <div className="font-mono text-sf-mono uppercase text-t4 mb-sf-2">Base · dark</div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-sf-2 mb-sf-4">{dark.map(([id, b]) => swatch(id, b))}</div>

      <div className="font-mono text-sf-mono uppercase text-t4 mb-sf-2">Base · light</div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-sf-2 mb-sf-6">{light.map(([id, b]) => swatch(id, b))}</div>

      <div className="font-mono text-sf-mono uppercase text-t4 mb-sf-2">Primary accent</div>
      <div className="flex flex-wrap gap-sf-2">
        {themes.primaries.map((p) => {
          const hex = (themes.themes as Record<string, { primary: { base: string } }>)[`${base}-${p}`].primary.base;
          return (
            <button
              key={p}
              onClick={() => setPrimary(p)}
              aria-pressed={primary === p}
              aria-label={p}
              className={[
                'min-h-hit min-w-hit rounded-none border-2 transition-sf duration-fast',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-focus',
                primary === p ? 'border-t1' : 'border-transparent hover:border-sf-line-emphasis',
              ].join(' ')}
              style={{ background: hex }}
            />
          );
        })}
      </div>

      <p className="mt-sf-4 font-mono text-sf-mono text-t4 sf-measure">
        // EVERY COMBINATION IS CONTRAST-SOLVED. PHYSICS, STOP, WORLDS AND LORE KEEP THEIR COLOURS IN ALL OF THEM.
      </p>
    </section>
  );
}

/* ─── index.html, before any stylesheet paints ───
<script>try{var t=JSON.parse(localStorage.getItem('sf-theme')||'{}');
if(t.base&&t.primary&&!(t.base==='void'&&t.primary==='teal'))
document.documentElement.setAttribute('data-theme',t.base+'-'+t.primary);}catch(e){}</script>
*/
