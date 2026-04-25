/**
 * StellarForge — Tailwind v3 config
 *
 * Drop this in at project root and replace/extend your existing tailwind.config.{js,ts}.
 * Every design token from the style guide is exposed here as a utility.
 *
 * Requires: @tailwindcss/typography (optional, for prose), tailwindcss-animate (optional).
 *
 * Usage:
 *   <div className="bg-sf-void text-t1 font-display tracking-title">
 *   <button className="bg-sf-teal text-sf-void px-sf-5 py-sf-3 uppercase tracking-wide">
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // app is dark-native; keep class mode for any future light surface
  theme: {
    extend: {
      // ─── COLORS ─────────────────────────────────────────────────────────
      colors: {
        // Backgrounds
        'sf-void':              '#0A0E17',
        'sf-surface':           '#0E1320',
        'sf-surface-elevated':  '#161C2B',

        // Accents (campaign palette)
        'sf-teal':              '#15C17B',
        'sf-teal-bright':       '#3DFFCD',
        'sf-cyan':              '#00D4FF',
        'sf-amber':             '#FFB800',
        'sf-amber-warm':        '#FFB347',
        'sf-stellar':           '#5B8DEF',
        'sf-emerald':           '#00FF88',
        'sf-violet':            '#9B5DE5',
        'sf-crimson':           '#FF3366',
        'sf-azure':             '#4D9FFF',
        'sf-magenta':           '#FF00AA',

        // Text tiers (on dark)
        t1: '#FAFAFA',                       // Primary text
        t2: '#C8C8C8',                       // Body text
        t3: 'rgba(255, 255, 255, 0.45)',     // Muted
        t4: 'rgba(255, 255, 255, 0.28)',     // Very muted (mono eyebrows)
        t5: 'rgba(255, 255, 255, 0.15)',     // Near-hidden

        // Semantic borders
        'sf-border':         'rgba(255, 255, 255, 0.08)',
        'sf-border-strong':  'rgba(255, 255, 255, 0.14)',

        // Scrollbar swatches
        'sb-track':        '#0A0E17',
        'sb-thumb':        '#2E3548',
        'sb-thumb-hover':  '#3D4658',
      },

      // ─── TYPOGRAPHY ─────────────────────────────────────────────────────
      fontFamily: {
        // Display: 96px hero type, never below 24px
        display: ['"MD Nichrome"', '"Space Grotesk"', 'sans-serif'],
        // Heading: eyebrows, section labels, all-caps tracked
        heading: ['Jura', '"DM Sans"', 'sans-serif'],
        // Sans: body copy, buttons, forms
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        // Mono: numbers, coordinates, tag text, code
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        title: '0.08em',   // H1/H2 display
        wide:  '0.2em',    // eyebrows, labels
        ultra: '0.4em',    // the farthest tracked lockups only
      },
      fontSize: {
        // Aligned to style guide scale
        'sf-hero':    ['96px', { lineHeight: '0.98', letterSpacing: '0.03em', fontWeight: '300' }],
        'sf-h1':      ['56px', { lineHeight: '1',    letterSpacing: '0.04em', fontWeight: '300' }],
        'sf-h2':      ['36px', { lineHeight: '1.15', letterSpacing: '0.03em', fontWeight: '300' }],
        'sf-h3':      ['24px', { lineHeight: '1.25', letterSpacing: '0.02em', fontWeight: '400' }],
        'sf-body':    ['15px', { lineHeight: '1.55' }],
        'sf-small':   ['13px', { lineHeight: '1.55' }],
        'sf-mono':    ['11px', { lineHeight: '1.4', letterSpacing: '0.18em' }],
        'sf-eyebrow': ['11px', { lineHeight: '1.2', letterSpacing: '0.2em',  fontWeight: '500' }],
      },

      // ─── SPACING & LAYOUT ───────────────────────────────────────────────
      // All spacing is a multiple of 4px. Use sf-* aliases for intent.
      spacing: {
        'sf-1':  '4px',
        'sf-2':  '8px',
        'sf-3':  '12px',
        'sf-4':  '16px',
        'sf-5':  '20px',
        'sf-6':  '24px',
        'sf-8':  '32px',
        'sf-10': '40px',
        'sf-12': '48px',
        'sf-16': '64px',
        'sf-20': '80px',
        'sf-24': '120px',
      },

      // ─── BORDER RADIUS ──────────────────────────────────────────────────
      // StellarForge is ZERO radius everywhere. Only exceptions: tiny tags (2px).
      borderRadius: {
        none: '0',
        'sf-tag': '2px', // reserved for <Tag />
      },

      // ─── MOTION ─────────────────────────────────────────────────────────
      transitionDuration: {
        fast:    '120ms',
        base:    '180ms',
        slow:    '280ms',
        ambient: '2400ms', // velocity-dial class of animations
      },
      transitionTimingFunction: {
        'sf-out':   'cubic-bezier(0.2, 0, 0, 1)',
        'sf-inout': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sf-snap':  'cubic-bezier(0.6, 0, 0.1, 1)',
      },

      // ─── BOX SHADOWS ────────────────────────────────────────────────────
      // Glow is the only shadow style. No soft drop shadows.
      boxShadow: {
        'sf-glow-teal':    '0 0 24px rgba(61,255,205,0.30)',
        'sf-glow-amber':   '0 0 20px rgba(255,184,0,0.25)',
        'sf-glow-crimson': '0 0 20px rgba(255,51,102,0.25)',
        'sf-inset-teal':   'inset 0 0 20px rgba(61,255,205,0.08)',
      },

      // ─── BACKDROP BLUR ──────────────────────────────────────────────────
      backdropBlur: {
        'sf-panel': '16px',
        'sf-side':  '20px',
      },

      // ─── KEYFRAMES ──────────────────────────────────────────────────────
      keyframes: {
        'sf-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1'   },
        },
        'sf-scan': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)'  },
        },
      },
      animation: {
        'sf-pulse': 'sf-pulse 2.4s ease-in-out infinite',
        'sf-scan':  'sf-scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
