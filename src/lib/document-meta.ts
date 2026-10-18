// ---------------------------------------------------------------------------
// document-meta, typed access to a writing document's metadata.
//
// world_entries.metadata is an existing `jsonb` column that documents have
// always been created with (`metadata: {}`) and that nothing ever read. This
// gives it a shape without a schema change.
//
// Why it matters: synopsis, POV, and status are what a corkboard and an
// outliner display. Without them those views have nothing to show but titles,
// which is why the binder is currently a flat list of names.
//
// Pure: no React, no network, safe during render, unit-tested.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Draft lifecycle, mirroring the vocabulary novelists already use. */
export const DOC_STATUSES = [
  "outline",
  "draft",
  "revised",
  "final",
] as const;

export type DocStatus = (typeof DOC_STATUSES)[number];

export interface DocumentMeta {
  /** One-or-two sentence card summary. The corkboard's whole payload. */
  synopsis: string;
  /**
   * Viewpoint character for this scene, as the writer reads it. Free text —
   * writers use odd names, and documents from before the POV picker carry
   * only this. When the picker sets a character it writes the name here too,
   * so every card, outline and export keeps working off `pov`.
   */
  pov: string;
  /**
   * The POV as an entity (a character world_entries id), when picked rather
   * than typed. Absent for free-text POVs. Drives the rail ranking and the
   * World tab (Studio Charter §2.4).
   */
  povEntityId?: string;
  /** The POV's Dossier worksheet id, when the picked character has one. */
  povDossierId?: string;
  /** Where this document sits in the drafting cycle. */
  status: DocStatus | "";
  /** Optional in-world date or beat marker, for chronology views. */
  when: string;
  /**
   * The world_entries id this scene is about — a planet, a system, a vessel.
   * Empty string means unset. Lets ContinuityPanel scope its check to one
   * entity instead of pooling every worksheet in the world (Brief S0); also
   * the on-ramp to future set_in/POV binding.
   */
  subjectEntityId: string;
  /**
   * The located place this scene is SET IN — a `location` entity filed by the
   * Surface Cartographer, carrying lat/lon on its body. Empty string means
   * unset. Distinct from subjectEntityId: a scene can be ABOUT a planet and
   * set in one city on it. This is the `set_in` target 05-NEW-SYSTEMS Tier C
   * says the Planet Cartographer makes real; the Studio UI that sets it is
   * the Card's SET IN picker.
   */
  setInPlaceId: string;
  /**
   * Optional chronicle_branches id: which timeline `when` is read on, for
   * time-travel stories. Absent = the prime timeline. Set from the Card's
   * TIMELINE picker.
   */
  branchId?: string;
  /**
   * Per-document notes (Scrivener's Document Notes). Distinct from the
   * synopsis: the synopsis is what the card shows, notes are the writer's
   * private scratch about this scene. Ephemeral by Law I: manuscript
   * annotation, never canon.
   */
  notes: string;
  /** Id of a world-level writing label (see writing-labels.ts). "" = none. */
  labelId: string;
  /** Free keywords, for filtering and collections. Trimmed, de-duplicated. */
  keywords: string[];
  /** Word-count target for this document. 0 = no target. */
  target: number;
  /**
   * Canon Capture resolutions for this document (Studio Charter §2.2/2.3):
   * claim or contradiction key → what the writer decided (DISMISS, or BOTH
   * ARE RIGHT with an epoch note). Absent when none. Written as a PATCH:
   * writeDocMeta merges it into what is stored, and a null value removes a
   * key, so two quick resolutions never drop each other.
   */
  captureResolutions?: Record<string, CaptureResolutionMeta>;
}

export interface CaptureResolutionMeta {
  r: "dismissed" | "both";
  note?: string;
  at: string;
}

export const EMPTY_DOC_META: DocumentMeta = {
  synopsis: "",
  pov: "",
  status: "",
  when: "",
  subjectEntityId: "",
  setInPlaceId: "",
  notes: "",
  labelId: "",
  keywords: [],
  target: 0,
};

export const STATUS_LABELS: Record<DocStatus, string> = {
  outline: "Outline",
  draft: "Draft",
  revised: "Revised",
  final: "Final",
};

/** Tier colours for status chips, staying inside the design-system palette. */
export const STATUS_TONE: Record<DocStatus, string> = {
  outline: "text-t3",
  draft: "text-sf-amber",
  revised: "text-sf-stellar-text",
  final: "text-sf-primary-text",
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function keywordList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of v) {
    if (typeof k !== "string") continue;
    const t = k.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

function wordTarget(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 10_000_000) : 0;
}

function isStatus(v: unknown): v is DocStatus {
  return typeof v === "string" && (DOC_STATUSES as readonly string[]).includes(v);
}

/**
 * Read metadata off a document, tolerating anything already in the column.
 *
 * The column is untyped and was written as `{}` for every existing document,
 * so this must never throw on unexpected shapes — a bad value degrades to
 * empty rather than breaking the binder.
 */
export function readDocMeta(metadata: unknown): DocumentMeta {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { ...EMPTY_DOC_META, keywords: [] };
  }
  const m = metadata as Record<string, unknown>;
  return {
    synopsis: str(m.synopsis),
    pov: str(m.pov),
    // Only present when set, so a free-text POV reads exactly as before.
    ...(str(m.povEntityId) ? { povEntityId: str(m.povEntityId) } : {}),
    ...(str(m.povDossierId) ? { povDossierId: str(m.povDossierId) } : {}),
    status: isStatus(m.status) ? m.status : "",
    when: str(m.when),
    subjectEntityId: str(m.subjectEntityId),
    setInPlaceId: str(m.setInPlaceId),
    // Only present when set, so documents without a branch read unchanged.
    ...(str(m.branchId) ? { branchId: str(m.branchId) } : {}),
    notes: str(m.notes),
    labelId: str(m.labelId),
    keywords: keywordList(m.keywords),
    target: wordTarget(m.target),
    ...(hasResolutions(m.captureResolutions) ? { captureResolutions: resolutionMap(m.captureResolutions) } : {}),
  };
}

function resolutionMap(v: unknown): Record<string, CaptureResolutionMeta> {
  const out: Record<string, CaptureResolutionMeta> = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return out;
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const r = (raw as Record<string, unknown>).r;
    if (r !== "dismissed" && r !== "both") continue;
    const note = (raw as Record<string, unknown>).note;
    const at = (raw as Record<string, unknown>).at;
    out[k] = { r, at: typeof at === "string" ? at : "", ...(typeof note === "string" && note ? { note } : {}) };
  }
  return out;
}

function hasResolutions(v: unknown): boolean {
  return Object.keys(resolutionMap(v)).length > 0;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Merge a patch into existing metadata, preserving unknown keys.
 *
 * Other features may later store their own keys here; blindly replacing the
 * object would silently drop them.
 */
export function writeDocMeta(
  metadata: unknown,
  patch: Partial<DocumentMeta>,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  for (const [k, raw] of Object.entries(patch)) {
    if (k === "captureResolutions") {
      // Merge, never replace: each resolution is its own key; null removes.
      const next: Record<string, unknown> = { ...resolutionMap(base[k]) };
      for (const [rk, rv] of Object.entries((raw ?? {}) as Record<string, unknown>)) {
        if (rv === null || rv === undefined) delete next[rk];
        else next[rk] = rv;
      }
      const clean = resolutionMap(next);
      if (Object.keys(clean).length) base[k] = clean;
      else delete base[k];
      continue;
    }
    let v: unknown = raw;
    if (k === "keywords") v = keywordList(raw);
    if (k === "target") v = wordTarget(raw);
    const empty =
      v === "" || v === undefined || v === null || v === 0 ||
      (Array.isArray(v) && v.length === 0);
    if (empty) delete base[k];
    else base[k] = v;
  }
  return base;
}

/** True when a document carries nothing worth showing on a card. */
export function isDocMetaEmpty(meta: DocumentMeta): boolean {
  return !meta.synopsis && !meta.pov && !meta.status && !meta.when;
}

/** Progress toward a document target, 0..1 (0 when no target is set). */
export function targetProgress(words: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(1, words / target));
}
