// ---------------------------------------------------------------------------
// writing-labels, Scrivener-style document labels for one world.
//
// A label is a writer-defined category ("Flashback", "Ix POV", "Needs
// research") with a colour. The set belongs to the world, stored under
// worlds.settings.writingLabels (jsonb, migration 20261018_writing_p1.sql);
// each document points at one by id from its metadata.labelId.
//
// Colours are the named-hue tokens only, so a label swatch never leaves the
// palette. Pure: no React, no network.
// ---------------------------------------------------------------------------

export const LABEL_HUES = [
  "amber",
  "azure",
  "emerald",
  "magenta",
  "stellar",
  "violet",
  "teal",
  "crimson",
] as const;

export type LabelHue = (typeof LABEL_HUES)[number];

export interface WritingLabel {
  id: string;
  name: string;
  hue: LabelHue;
}

/** Static class strings per hue (Tailwind JIT cannot see interpolated names). */
export const LABEL_SWATCH: Record<LabelHue, string> = {
  amber: "bg-sf-amber",
  azure: "bg-sf-azure",
  emerald: "bg-sf-emerald",
  magenta: "bg-sf-magenta",
  stellar: "bg-sf-stellar",
  violet: "bg-sf-violet",
  teal: "bg-sf-teal",
  crimson: "bg-sf-crimson",
};

export const LABEL_TEXT: Record<LabelHue, string> = {
  amber: "text-sf-amber-text",
  azure: "text-sf-azure-text",
  emerald: "text-sf-emerald-text",
  magenta: "text-sf-magenta-text",
  stellar: "text-sf-stellar-text",
  violet: "text-sf-violet-text",
  teal: "text-sf-teal-text",
  crimson: "text-sf-crimson-text",
};

export const LABEL_BORDER: Record<LabelHue, string> = {
  amber: "border-sf-amber",
  azure: "border-sf-azure",
  emerald: "border-sf-emerald",
  magenta: "border-sf-magenta",
  stellar: "border-sf-stellar",
  violet: "border-sf-violet",
  teal: "border-sf-teal",
  crimson: "border-sf-crimson",
};

export const MAX_LABELS = 24;
export const MAX_LABEL_NAME = 40;

function isHue(v: unknown): v is LabelHue {
  return typeof v === "string" && (LABEL_HUES as readonly string[]).includes(v);
}

/** Validate and de-duplicate a label list from untyped JSON. Never throws. */
export function sanitizeLabels(raw: unknown): WritingLabel[] {
  if (!Array.isArray(raw)) return [];
  const out: WritingLabel[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_LABEL_NAME) : "";
    if (!id || !name || ids.has(id)) continue;
    ids.add(id);
    out.push({ id, name, hue: isHue(r.hue) ? r.hue : "stellar" });
    if (out.length >= MAX_LABELS) break;
  }
  return out;
}

/** Read the label set off a worlds.settings value. */
export function readLabels(settings: unknown): WritingLabel[] {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return [];
  return sanitizeLabels((settings as Record<string, unknown>).writingLabels);
}

/** Merge a label set into worlds.settings, preserving every other key. */
export function writeLabels(settings: unknown, labels: WritingLabel[]): Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {};
  base.writingLabels = sanitizeLabels(labels);
  return base;
}

/** A short random id. Stable once stored; never derived from the name. */
export function newLabelId(): string {
  return `lbl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** The next hue not yet used, cycling when all are taken. */
export function nextLabelHue(labels: WritingLabel[]): LabelHue {
  const used = new Set(labels.map((l) => l.hue));
  return LABEL_HUES.find((h) => !used.has(h)) ?? LABEL_HUES[labels.length % LABEL_HUES.length];
}

export function findLabel(labels: WritingLabel[], id: string | null | undefined): WritingLabel | null {
  if (!id) return null;
  return labels.find((l) => l.id === id) ?? null;
}
