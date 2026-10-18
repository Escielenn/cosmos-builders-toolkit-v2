// ---------------------------------------------------------------------------
// Dossier — the saved shape of a character.
//
// A character is not a card with a bio. Most of what makes a person from
// Kellis different from a person from Earth is already on file elsewhere in
// the world: the species' lifespan in Phylo, its senses in Sensorium, its
// gods in Mythos, its gravity in Genesis. The dossier records *which* of
// those records this person comes from (origins), what the writer decided
// about them personally (identity, body, psychology, voice), and where the
// writer has deliberately departed from the inherited record (overrides).
//
// `resolved` and `provenance` are a snapshot of the effective values at save
// time. They exist so the rest of the product (worksheet-facts → Studio
// Refs/Check, entity sync → Codex infobox) can read a character with a dot
// path instead of re-running the inheritance against five other worksheets.
// The live page always re-resolves; the snapshot is only what was true when
// the writer last secured the file.
//
// Pure types. No React.
// ---------------------------------------------------------------------------

export const DOSSIER_TOOL_TYPE = "dossier";

/** A pointer to an upstream worksheet, with the name it carried when picked. */
export interface DossierSourceRef {
  worksheetId: string | null;
  /** Display name. For an unlinked origin this is the writer's own text. */
  name: string;
}

/** The six origin slots an inherited trait can be read from. */
export type OriginSlot =
  | "homeworld"
  | "species"
  | "sensorium"
  | "culture"
  | "polity"
  | "language";

export const RELATIONSHIP_TYPES = [
  "ally",
  "rival",
  "kin",
  "mentor",
  "lover",
  "enemy",
  "custom",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface DossierRelationship {
  id: string;
  type: RelationshipType;
  /** Only read when type === "custom". */
  customLabel: string;
  /** Another Dossier worksheet, or any world_entries entity. */
  targetKind: "dossier" | "entry";
  targetId: string;
  targetName: string;
  note: string;
  /** The world_connections row mirroring this edge, once synced. */
  connectionId: string | null;
}

export interface DossierArcBeat {
  id: string;
  /** chronicle_events.id, or null for a beat the writer has not placed yet. */
  eventId: string | null;
  /** The event title and date as they read when bound. */
  eventLabel: string;
  note: string;
}

export interface DossierFormState {
  version: 1;
  identity: {
    name: string;
    aliases: string;
    role: string;
    pronouns: string;
  };
  origins: {
    homeworld: DossierSourceRef;
    species: DossierSourceRef;
    sensorium: DossierSourceRef;
    culture: DossierSourceRef;
    polity: DossierSourceRef;
    /** House, clan, lineage, faction within the polity. Free text. */
    house: string;
    language: DossierSourceRef;
    birth: { eventId: string | null; label: string };
  };
  body: {
    heightCm: string;
    massKg: string;
    age: string;
    /** Which calendar `age` is written in. */
    ageUnit: "standard" | "local";
  };
  /** Trait key → the writer's value. Absent means "inherit". */
  overrides: Record<string, string>;
  psychology: {
    want: string;
    need: string;
    motivation: string;
    fear: string;
    wound: string;
    values: string;
    temperament: string;
  };
  voice: {
    dialect: string;
    idiolect: string;
    sampleLines: string;
  };
  relationships: DossierRelationship[];
  arc: DossierArcBeat[];
  /** Save-time snapshot of effective values, flat, for facts and sync. */
  resolved: Record<string, string>;
  /** resolved key → producing tool slug, or "override" / "dossier". */
  provenance: Record<string, string>;
  generalNotes: string;
}

const emptyRef = (): DossierSourceRef => ({ worksheetId: null, name: "" });

export function createEmptyDossier(): DossierFormState {
  return {
    version: 1,
    identity: { name: "", aliases: "", role: "", pronouns: "" },
    origins: {
      homeworld: emptyRef(),
      species: emptyRef(),
      sensorium: emptyRef(),
      culture: emptyRef(),
      polity: emptyRef(),
      house: "",
      language: emptyRef(),
      birth: { eventId: null, label: "" },
    },
    body: { heightCm: "", massKg: "", age: "", ageUnit: "standard" },
    overrides: {},
    psychology: {
      want: "",
      need: "",
      motivation: "",
      fear: "",
      wound: "",
      values: "",
      temperament: "",
    },
    voice: { dialect: "", idiolect: "", sampleLines: "" },
    relationships: [],
    arc: [],
    resolved: {},
    provenance: {},
    generalNotes: "",
  };
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

function ref(raw: unknown): DossierSourceRef {
  const r = obj(raw);
  return {
    worksheetId: typeof r.worksheetId === "string" && r.worksheetId ? r.worksheetId : null,
    name: str(r.name),
  };
}

/**
 * Read a saved dossier blob into a complete form state.
 *
 * Tolerant by design: a worksheet saved by an older build, or edited by hand,
 * must load with every missing field defaulted rather than crash the page.
 */
export function normalizeDossier(raw: unknown): DossierFormState {
  const base = createEmptyDossier();
  const d = obj(raw);
  const identity = obj(d.identity);
  const origins = obj(d.origins);
  const body = obj(d.body);
  const psychology = obj(d.psychology);
  const voice = obj(d.voice);
  const birth = obj(origins.birth);

  const strRecord = (raw: unknown): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj(raw))) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  };

  return {
    version: 1,
    identity: {
      name: str(identity.name),
      aliases: str(identity.aliases),
      role: str(identity.role),
      pronouns: str(identity.pronouns),
    },
    origins: {
      homeworld: ref(origins.homeworld),
      species: ref(origins.species),
      sensorium: ref(origins.sensorium),
      culture: ref(origins.culture),
      polity: ref(origins.polity),
      house: str(origins.house),
      language: ref(origins.language),
      birth: {
        eventId: typeof birth.eventId === "string" && birth.eventId ? birth.eventId : null,
        label: str(birth.label),
      },
    },
    body: {
      heightCm: str(body.heightCm),
      massKg: str(body.massKg),
      age: str(body.age),
      ageUnit: body.ageUnit === "local" ? "local" : "standard",
    },
    overrides: strRecord(d.overrides),
    psychology: {
      ...base.psychology,
      ...strRecord(psychology),
    },
    voice: { ...base.voice, ...strRecord(voice) },
    relationships: (Array.isArray(d.relationships) ? d.relationships : [])
      .map((r) => obj(r))
      .filter((r) => typeof r.id === "string" && typeof r.targetId === "string")
      .map((r) => ({
        id: str(r.id),
        type: (RELATIONSHIP_TYPES as readonly string[]).includes(str(r.type))
          ? (r.type as RelationshipType)
          : "custom",
        customLabel: str(r.customLabel),
        targetKind: r.targetKind === "entry" ? "entry" : "dossier",
        targetId: str(r.targetId),
        targetName: str(r.targetName),
        note: str(r.note),
        connectionId: typeof r.connectionId === "string" && r.connectionId ? r.connectionId : null,
      })),
    arc: (Array.isArray(d.arc) ? d.arc : [])
      .map((b) => obj(b))
      .filter((b) => typeof b.id === "string")
      .map((b) => ({
        id: str(b.id),
        eventId: typeof b.eventId === "string" && b.eventId ? b.eventId : null,
        eventLabel: str(b.eventLabel),
        note: str(b.note),
      })),
    resolved: strRecord(d.resolved),
    provenance: strRecord(d.provenance),
    generalNotes: str(d.generalNotes),
  };
}
