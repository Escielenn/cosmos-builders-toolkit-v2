# Archive — superseded material

**Nothing in this folder is canonical. Do not copy values out of it.**

It is kept for one reason: when you are reading old code and find a token that
no longer exists, this tells you what it used to mean and why it was replaced.

## What's here

| File | Was | Status |
|---|---|---|
| `AESTHETIC-UPLIFT-HANDOFF.md` | The revision-1 design handoff README | **Superseded** by `docs/stellarforge/10-LEGIBILITY.md` + `.claude/skills/stellarforge-design/`. Its principles and voice guidance still hold; its colour and type values do not. |
| `shared.css.v1` | Source-of-truth tokens for the HTML prototypes | **Superseded** by `design/tokens.css` (generated) |
| *(not bundled)* | `Style Guide.html`, `sg-sections*.js`, the reference screenshots, and the MD Nichrome font files | Still in the **StellarForge.tools Part II** Claude project. Useful as a *visual* inventory of every v1 component; every colour in it is v1. |

## The token map — v1 → v2

| v1 | Measured | v2 | Now |
|---|---|---|---|
| `--sf-border` `rgba(255,255,255,.08)` | 1.20:1 | `--sf-line` `#676B75` | 2.40:1 |
| `--sf-border-strong` `rgba(255,255,255,.14)` | 1.45:1 | `--sf-line-interactive` `#787D87` | 3.10:1 |
| — | — | `--sf-line-hairline` `#50555E` | 1.71:1 |
| — | — | `--sf-line-emphasis` `#979BA5` | 4.61:1 |
| `--sf-surface` `#0E1320` | 1.04:1 vs void | `--sf-surface` `#1B2334` | 1.23:1 |
| `--sf-surface-elevated` `#161C2B` | 1.09:1 vs surface | `--sf-surface-elevated` `#273249` | 1.23:1 |
| `--sf-surface-80` `rgba(14,19,32,.9)` | unstable over starfield | *removed* | use the solid plane |
| `--t3` `rgba(255,255,255,.45)` | 4.43:1 on elevated | `--t3` `#A7AAB0` | 5.50:1 |
| `--t4` `rgba(255,255,255,.28)` | 2.45:1 | `--t4` `#9799A0` | 4.50:1 |
| `--t5` `rgba(255,255,255,.15)` | 1.51:1 | **retired** | nothing readable below t4 |
| `--tr-wide` `0.2em` | — | `0.12em` | tracking under 12px destroys word shape |
| `--tr-ultra` `0.4em` | — | `0.24em` | 24px+ lockups only |
| `.sf-eyebrow` 11px / .2em | 2.45:1 | `text-sf-eyebrow` 12px / .12em / 600 | 4.50:1 |
| `.sf-label` 11px / 1.5px | — | `text-sf-mono` 12px / .10em | — |
| `.sf-tag` 10px | — | `Tag` 12px, canonical border + `-text` label | — |
| `.sf-sb` thumb `#2E3548` | 1.40:1 | `--sb-thumb` = `--sf-line` | 2.40:1 |
| `.sf-sb--idle` | hides for 800ms | **removed** | a hidden scrollbar fails 1.4.11 while hidden |
| `disabled { opacity: .4 }` | 2.21:1 | `--sf-disabled-*` | 4.05:1 |
| button label `#08110C` | hardcoded | `--sf-on-teal` `#0B0F18` | 8.16:1, solved |
| *no focus state* | — | `--sf-focus` `#3DFFCD` | 10:1, global |

## Also superseded: the old `stellarforge-design` skill

A skill of that name described a **different, never-shipped** system — void
`#0D0D0F`, cyan primary, 8px card radius, Clash Display / Satoshi. It also
failed its own targets (muted text 3.66:1, card borders 1.61:1). If you find
it installed anywhere, replace it with
`.claude/skills/stellarforge-design/SKILL.md` from this package.
