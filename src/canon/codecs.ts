// ---------------------------------------------------------------------------
// canon/codecs, between a tool's own field and a typed FactValue.
//
// One home per value means two tools read and write the same fact through
// fields that were never designed together: Genesis stores "g-type", Goldilocks
// "G", Orrery "g-type"; Impulse stores "solar-sail", Paradox "light-sail",
// Vessel free text. A codec reads any of those spellings into one canonical
// FactValue, so "are these the same?" has one answer, and the producer writes
// the same shape the consumer compares against.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { predicateDef } from "@/canon/vocabulary";
import { sameValue } from "@/canon/merge";
import type { FactValue } from "@/canon/types";

export interface FieldCodec {
  /** A field value, or a fact's display text, as a typed value. Null when empty or unreadable. */
  read(raw: unknown): FactValue | null;
  /** Display text for a typed value (what valueText stores). */
  text(value: FactValue): string;
}

const isBlank = (raw: unknown): boolean =>
  raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");

/** Plain text from TipTap HTML; plain strings pass through. */
export function stripHtml(raw: string): string {
  return raw
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain text as one TipTap paragraph, for prefilling a rich-text field. */
export function textToParagraphHtml(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${esc}</p>`;
}

/** Leading number of a field or display string: "1.4 g" → 1.4, "50 crew, 200 passengers" → 50. */
export function leadingNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const m = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

export function scalarCodec(unit?: string): FieldCodec {
  return {
    read(raw) {
      if (isBlank(raw)) return null;
      const n = leadingNumber(raw);
      if (n === null) return null;
      return unit ? { kind: "scalar", value: n, unit } : { kind: "scalar", value: n };
    },
    text: (v) => (v.kind === "scalar" ? String(v.value) : ""),
  };
}

export const textCodec: FieldCodec = {
  read(raw) {
    if (isBlank(raw) || typeof raw !== "string") return null;
    const t = stripHtml(raw);
    return t ? { kind: "text", value: t } : null;
  },
  text: (v) => (v.kind === "text" || v.kind === "enum" ? v.value : ""),
};

function enumCodec(normalise: (s: string) => string | null): FieldCodec {
  return {
    read(raw) {
      if (isBlank(raw) || typeof raw !== "string") return null;
      const v = normalise(stripHtml(raw));
      return v ? { kind: "enum", value: v } : null;
    },
    text: (v) => (v.kind === "enum" || v.kind === "text" ? v.value : ""),
  };
}

// ── star.spectral_class ────────────────────────────────────────────────
// 08: `o|b|a|f|g|k|m|wd|bd` + subtype. Every spelling the three star tools
// store reads to that.

/** "g-type", "G", "G2V", "k-dwarf", "white-dwarf" → "g", "g2v", "k", "wd". Null for "binary". */
export function normaliseSpectralClass(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/^white[\s-]?dwarf|^wd\b/.test(s)) return "wd";
  if (/^brown[\s-]?dwarf|^bd\b/.test(s)) return "bd";
  if (/^neutron/.test(s)) return "ns";
  const typed = s.match(/^([obafgkm])[\s-]?(?:type|dwarf|giant|star)\b/);
  if (typed) return typed[1];
  const mk = s.match(/^([obafgkm])(\d(?:\.\d)?)?\s*(i{1,3}|iv|v|vi)?\b/);
  if (mk && s.length <= 6) return `${mk[1]}${mk[2] ?? ""}${mk[3] ?? ""}`;
  return null;
}

export const spectralCodec = enumCodec(normaliseSpectralClass);

/** The letter class, for tools whose picker only knows O B A F G K M. */
export function spectralLetter(value: FactValue | null): string | null {
  if (!value || (value.kind !== "enum" && value.kind !== "text")) return null;
  const v = value.value.toLowerCase();
  if (v === "wd" || v === "bd" || v === "ns") return null;
  const m = v.match(/^([obafgkm])/);
  return m ? m[1] : null;
}

// ── propulsion.type ────────────────────────────────────────────────────
// Canonical value: Impulse's propulsion slug (Impulse owns the predicate),
// or the writer's own words for a drive outside the list.

export interface PropulsionType {
  value: string;
  label: string;
  description: string;
}

/** Impulse's propulsion list, the canonical vocabulary for propulsion.type. */
export const PROPULSION_TYPES: readonly PropulsionType[] = [
  { value: "chemical", label: "Chemical rockets", description: "Current technology" },
  { value: "ion", label: "Ion drives", description: "Proven, slow acceleration" },
  { value: "nuclear-thermal", label: "Nuclear thermal", description: "High thrust, tested 1960s-70s" },
  { value: "nuclear-pulse", label: "Nuclear pulse", description: "Orion-style, requires bombs" },
  { value: "fusion", label: "Fusion drive", description: "Theoretical, high efficiency" },
  { value: "antimatter", label: "Antimatter", description: "Theoretical, enormous energy" },
  { value: "solar-sail", label: "Solar/laser sails", description: "Continuous low thrust" },
  { value: "bussard", label: "Bussard ramjet", description: "Theoretical hydrogen scoop" },
  { value: "alcubierre", label: "Alcubierre warp drive", description: "Speculative FTL" },
  { value: "hyperspace", label: "Hyperspace/jump drive", description: "Speculative FTL" },
  { value: "wormhole", label: "Wormholes/portals", description: "Speculative instant travel" },
  { value: "generation", label: "Generation ships", description: "Subluminal, multi-century" },
  { value: "other", label: "Other", description: "Custom propulsion system" },
];

/** Spellings other tools use for the same drives (Paradox's method ids, common words). */
const PROPULSION_SYNONYMS: Record<string, string> = {
  "light-sail": "solar-sail",
  "laser-sail": "solar-sail",
  "solar sail": "solar-sail",
  "light sail": "solar-sail",
  "ion drive": "ion",
  "chemical rocket": "chemical",
  "fusion": "fusion",
  "warp drive": "alcubierre",
  "alcubierre drive": "alcubierre",
};

export function normalisePropulsionType(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const bySlug = PROPULSION_TYPES.find((t) => t.value === lower && t.value !== "other");
  if (bySlug) return bySlug.value;
  const byLabel = PROPULSION_TYPES.find((t) => t.label.toLowerCase() === lower && t.value !== "other");
  if (byLabel) return byLabel.value;
  const syn = PROPULSION_SYNONYMS[lower];
  if (syn) return syn;
  // Paradox's method labels ("Fusion Drive", "Light Sail (Laser-Pushed)").
  const head = lower.replace(/\s*\(.*\)\s*$/, "");
  if (PROPULSION_SYNONYMS[head]) return PROPULSION_SYNONYMS[head];
  // A drive outside the list stays in the writer's words.
  return lower === "other" || lower === "custom" ? null : s;
}

export function propulsionLabel(value: string): string {
  return PROPULSION_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const propulsionCodec: FieldCodec = {
  read(raw) {
    if (isBlank(raw) || typeof raw !== "string") return null;
    const v = normalisePropulsionType(stripHtml(raw));
    return v ? { kind: "text", value: v } : null;
  },
  text: (v) => (v.kind === "text" || v.kind === "enum" ? propulsionLabel(v.value) : ""),
};

// ── Registry ───────────────────────────────────────────────────────────

const SPECIAL: Record<string, FieldCodec> = {
  "star.spectral_class": spectralCodec,
  "propulsion.type": propulsionCodec,
};

/** The codec for a predicate: special-cased spellings first, then the vocabulary's kind and unit. */
export function codecFor(predicate: string): FieldCodec {
  const special = SPECIAL[predicate];
  if (special) return special;
  const def = predicateDef(predicate);
  if (def?.kind === "scalar") return scalarCodec(def.unit);
  if (def?.kind === "enum") return enumCodec((s) => s.trim().toLowerCase() || null);
  return textCodec;
}

/**
 * Do two typed values say the same thing? Numbers within a relative 1e-6
 * (a unit stamped on one side only is not a disagreement), text ignoring
 * case and whitespace, everything else structurally.
 */
export function valuesAgree(a: FactValue | null, b: FactValue | null): boolean {
  if (!a || !b) return false;
  if (a.kind === "scalar" && b.kind === "scalar") {
    if (a.unit && b.unit && a.unit !== b.unit) return false;
    const scale = Math.max(Math.abs(a.value), Math.abs(b.value), 1e-12);
    return Math.abs(a.value - b.value) / scale < 1e-6;
  }
  const isWords = (v: FactValue) => v.kind === "text" || v.kind === "enum";
  if (isWords(a) && isWords(b)) {
    const norm = (v: FactValue) => (v as { value: string }).value.trim().replace(/\s+/g, " ").toLowerCase();
    return norm(a) === norm(b);
  }
  return sameValue(a, b);
}
