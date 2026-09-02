/**
 * use-theme — the user's colour aesthetic.
 *
 * A theme is `<base>-<primary>`: one of ten bases (void, charcoal, graphite,
 * midnight, abyss, umber · paper, sky, fog, dawn) × one of seven primary
 * accents (teal, cyan, emerald, azure, violet, amber, magenta). Every one of
 * the 70 combinations is pre-solved by design/themes.py against the same
 * WCAG targets as the default palette and lands in src/styles/themes.css as
 * a [data-theme="…"] block, so switching is one attribute write — no reload,
 * no recomputation, no way to pick a combination that fails contrast.
 *
 * Persistence is localStorage "sf-theme" holding the id string; public/
 * no-flash.js reads the same key before first paint. Void·Teal is the
 * default and is expressed by REMOVING the attribute, so :root wins.
 *
 * Roles vs meanings: a theme moves --sf-primary (buttons, focus, links,
 * selection). It never moves amber/crimson/stellar/violet — those are
 * meanings (Physics, Stop, Worlds, Lore) and are only re-solved for
 * contrast per base. See docs/stellarforge/13-THE-LIFT.md §0.
 */

import { useCallback, useEffect, useState } from "react";
import themes from "@/styles/themes.json";

export type ThemeBase = string & keyof typeof themes.bases;
export type ThemePrimary = (typeof themes.primaries)[number];
export interface ThemeChoice {
  base: ThemeBase;
  primary: ThemePrimary;
}

export const THEME_STORAGE_KEY = "sf-theme";
export const DEFAULT_THEME: ThemeChoice = { base: "void", primary: "teal" };
export const THEME_BASES = themes.bases as Record<
  ThemeBase,
  { seed: string; mode: "dark" | "light"; label: string; blurb: string }
>;
export const THEME_PRIMARIES = themes.primaries as readonly ThemePrimary[];

export const themeId = (t: ThemeChoice) => `${t.base}-${t.primary}`;

/** Solved primary hex for a base × primary, for swatches. */
export function primaryHex(base: ThemeBase, primary: ThemePrimary): string {
  const t = (themes.themes as Record<string, { primary: { base: string } }>)[
    `${base}-${primary}`
  ];
  return t?.primary.base ?? "#15C17B";
}

function parse(raw: string | null): ThemeChoice | null {
  if (!raw) return null;
  const m = /^([a-z]+)-([a-z]+)$/.exec(raw);
  if (!m) return null;
  const [, base, primary] = m;
  if (!(base in themes.bases)) return null;
  if (!(themes.primaries as readonly string[]).includes(primary)) return null;
  return { base: base as ThemeBase, primary: primary as ThemePrimary };
}

export function readTheme(): ThemeChoice {
  try {
    return parse(localStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(t: ThemeChoice) {
  const el = document.documentElement;
  const id = themeId(t);
  if (id === themeId(DEFAULT_THEME)) el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", id);
  const mode = THEME_BASES[t.base]?.mode ?? "dark";
  // shadcn's darkMode:['class'] and a few `dark:` utilities key off this.
  el.classList.toggle("dark", mode === "dark");
  el.classList.toggle("light", mode === "light");
}

/** Call once before first render. no-flash.js already did the attribute;
 *  this keeps the class in step and is idempotent. */
export function initTheme() {
  applyTheme(readTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      if (themeId(theme) === themeId(DEFAULT_THEME)) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, themeId(theme));
    } catch {
      /* session only */
    }
  }, [theme]);

  const setBase = useCallback((base: ThemeBase) => setTheme((p) => ({ ...p, base })), []);
  const setPrimary = useCallback(
    (primary: ThemePrimary) => setTheme((p) => ({ ...p, primary })),
    [],
  );
  const reset = useCallback(() => setTheme(DEFAULT_THEME), []);

  return { ...theme, id: themeId(theme), setBase, setPrimary, reset };
}
