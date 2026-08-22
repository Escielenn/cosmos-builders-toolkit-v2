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
  /** Viewpoint character for this scene. Free text — writers use odd names. */
  pov: string;
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
}

export const EMPTY_DOC_META: DocumentMeta = {
  synopsis: "",
  pov: "",
  status: "",
  when: "",
  subjectEntityId: "",
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
  revised: "text-sf-stellar",
  final: "text-sf-teal",
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
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
    return { ...EMPTY_DOC_META };
  }
  const m = metadata as Record<string, unknown>;
  return {
    synopsis: str(m.synopsis),
    pov: str(m.pov),
    status: isStatus(m.status) ? m.status : "",
    when: str(m.when),
    subjectEntityId: str(m.subjectEntityId),
  };
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
  for (const [k, v] of Object.entries(patch)) {
    if (v === "" || v === undefined || v === null) delete base[k];
    else base[k] = v;
  }
  return base;
}

/** True when a document carries nothing worth showing on a card. */
export function isDocMetaEmpty(meta: DocumentMeta): boolean {
  return !meta.synopsis && !meta.pov && !meta.status && !meta.when;
}
