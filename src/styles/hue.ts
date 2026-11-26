/**
 * Named hues as LIVE CSS values.
 *
 * The eight named hues carry meaning (cascade layer or status) and are
 * re-solved for contrast on every base, light ones included. DOM chrome that
 * colours something from data ("this zone is crimson", "this layer is amber")
 * should hand the browser the variable, not a hex copied from the default
 * theme, so it stays legible when the user switches theme.
 *
 *   hueVar("amber")        -> var(--sf-amber)         fills, borders, icons
 *   hueTextVar("amber")    -> var(--sf-amber-text)    accent-coloured text
 *   hueTint("amber", 0.06) -> rgb(var(--sf-amber-rgb) / 0.06)   tint fill
 *   hueHex("amber")        -> the default-theme hex, for canvas,
 *                             persisted data and `${hex}40` suffixes only
 *
 * "primary" is the role colour (user-chosen); the rest are meanings.
 */

import { tokens } from "./tokens";

export const HUE_NAMES = [
  "teal",
  "amber",
  "stellar",
  "emerald",
  "violet",
  "crimson",
  "azure",
  "magenta",
] as const;

export type HueName = (typeof HUE_NAMES)[number];
export type HueOrPrimary = HueName | "primary";

/** Fill / border / icon stop. */
export function hueVar(hue: HueOrPrimary): string {
  return `var(--sf-${hue})`;
}

/** Text stop: any accent-coloured text at body size. */
export function hueTextVar(hue: HueOrPrimary): string {
  return `var(--sf-${hue}-text)`;
}

/** Tint fill at a given alpha (fills only; borders stay solid). */
export function hueTint(hue: HueOrPrimary, alpha: number): string {
  return `rgb(var(--sf-${hue}-rgb) / ${alpha})`;
}

/** Default-theme hex. Does not follow the user's theme. */
export function hueHex(hue: HueOrPrimary): string {
  return hue === "primary" ? tokens.accent.base : tokens.hue[hue];
}

/**
 * The cascade, in canon order, and the hue each layer owns. These never move
 * (CLAUDE.md, Design system). One table so the tool categories, the Codex
 * graph and the wiki cannot drift apart again.
 */
export const CASCADE_HUE = {
  physics: "amber",
  environment: "azure",
  biology: "emerald",
  psychology: "magenta",
  mythology: "stellar",
  culture: "violet",
  integration: "teal",
} as const satisfies Record<string, HueName>;

export type CascadeLayer = keyof typeof CASCADE_HUE;
