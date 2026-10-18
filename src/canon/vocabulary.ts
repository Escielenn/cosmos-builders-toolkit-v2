// ---------------------------------------------------------------------------
// canon/vocabulary, the predicate namespace (docs/stellarforge/08-VOCABULARY.md).
//
// This is what lets tools speak to each other. Rules, from 08:
//   - <domain>.<attribute>, snake_case, singular domain.
//   - Units live on the value, never in the name.
//   - No tool names in predicates.
//   - NEVER rename a predicate. Deprecate it and point `aliasOf` at the
//     canonical name; reads follow the alias.
//   - Adding a predicate is deliberate: use /sf-fact.
//
// `aliases` are the OTHER half of never-renaming: the camelCase keys the
// computed-on-read pipeline already emits (entity-config master fields,
// worksheet-facts, simulation-facts). Those keys stay exactly as they are,
// because fact refs already sitting in manuscripts carry them. They resolve
// here to a predicate instead.
//
// A key that maps to nothing in this file is NOT dropped: it resolves to
// `legacy.<key>` (Law I, no orphan data). That is an honest "on file, not yet
// in the vocabulary" and the /sf-fact queue, not a predicate to build on.
//
// Kept unmapped on purpose (they resolve to legacy.*):
//   - entity names (systemName, speciesName, characterName...): the Charter's
//     "Entity names are not predicates" rule.
//   - values whose kind does not match the vocabulary's (Dossier's species /
//     polity are names where 08 wants refs; Gravitas' height in cm where 08
//     wants m; Symbiosis' prose where 08 wants typed edges). Aliasing them
//     would assert a FactValue shape the data does not have.
//   - simulator display strings (sky.*, encounter.*, system.stars...). 08
//     ("What that audit also found") says these are formatted strings, not
//     facts, until raw values travel with them.
// ---------------------------------------------------------------------------

import type { Unit } from "@/canon/units";

export type ValueKind =
  | "scalar"
  | "range"
  | "enum"
  | "text"
  | "ref"
  | "bool"
  | "struct"
  | "scalar[]"
  | "range[]"
  | "enum[]"
  | "text[]"
  | "ref[]"
  | "struct[]";

/** The Environmental Cascade, plus Integration for cross-layer facts. */
export type CascadeLayer =
  | "physics"
  | "environment"
  | "biology"
  | "psychology"
  | "mythology"
  | "culture"
  | "integration";

export interface PredicateDef {
  predicate: string;
  label: string;
  kind: ValueKind;
  unit?: Unit;
  layer: CascadeLayer;
  /** Tool id of the sole producer, where 08/03 name one. */
  producer?: string;
  /** Pipeline keys (entity-config / worksheet-facts) that mean this predicate. */
  aliases?: readonly string[];
  /** A deprecated spelling. Reads follow `aliasOf`; writes should not use it. */
  deprecated?: true;
  aliasOf?: string;
  /**
   * Written by shipped code but not (yet) a vocabulary decision. Readable,
   * never a target for new writers. The string says why it is here.
   */
  provisional?: string;
}

export const LEGACY_PREFIX = "legacy.";

// ---------------------------------------------------------------------------
// Builder: one row per predicate, grouped by domain so the layer is stated once.
// ---------------------------------------------------------------------------

type Row = [attr: string, label: string, kind: ValueKind, extra?: Partial<Omit<PredicateDef, "predicate" | "label" | "kind">>];

function domain(name: string, layer: CascadeLayer, producer: string | undefined, rows: Row[]): PredicateDef[] {
  return rows.map(([attr, label, kind, extra]) => ({
    predicate: `${name}.${attr}`,
    label,
    kind,
    layer,
    ...(producer ? { producer } : {}),
    ...extra,
  }));
}

const DEFS: PredicateDef[] = [
  ...domain("world", "integration", "axiom", [
    ["axiom", "The One Big Lie", "text", { aliases: ["theOneBigLie"] }],
    ["axiom_constraints[]", "What the lie forbids", "text[]"],
    ["present_epoch", "Present epoch", "scalar"],
    ["epoch_label", "Epoch label", "text"],
  ]),
  ...domain("galaxy", "physics", "signal", [
    ["civ_count", "Civilizations in the galaxy", "scalar"],
    ["contact_probability", "Contact probability", "scalar", { unit: "fraction" }],
    ["density_class", "Galactic density", "enum"],
  ]),
  ...domain("star", "physics", "orrery", [
    ["spectral_class", "Spectral class", "enum", { aliases: ["starType", "primaryStarClass"] }],
    ["mass", "Stellar mass", "scalar", { unit: "solar_masses" }],
    ["luminosity", "Stellar luminosity", "scalar", { unit: "solar_lum", aliases: ["stellarLuminosity"] }],
    ["temp_effective", "Effective temperature", "scalar", { unit: "K" }],
    ["age", "Stellar age", "scalar", { unit: "gyr" }],
    ["flare_activity", "Flare activity", "enum"],
  ]),
  ...domain("system", "physics", "orrery", [
    ["configuration", "Configuration", "enum", { aliases: ["configuration"] }],
    ["body_count", "Bodies in system", "scalar"],
    ["hz_inner", "Habitable zone inner edge", "scalar", { unit: "au", producer: "goldilocks" }],
    ["hz_outer", "Habitable zone outer edge", "scalar", { unit: "au", producer: "goldilocks" }],
    ["stability", "Orbital stability", "enum", { producer: "solaris" }],
    ["perturbation_events[]", "Perturbation events", "struct[]", { producer: "rogue" }],
  ]),
  ...domain("orbit", "physics", "orrery", [
    ["semi_major_axis", "Orbital distance", "scalar", { unit: "au", aliases: ["orbitalDistance"] }],
    ["eccentricity", "Eccentricity", "scalar"],
    ["period", "Orbital period", "scalar", { unit: "days" }],
    ["inclination", "Inclination", "scalar", { unit: "deg" }],
    ["tidally_locked", "Tidally locked", "bool"],
    ["resonance", "Resonance", "text"],
  ]),
  ...domain("planet", "environment", "genesis", [
    ["radius", "Radius", "scalar", { unit: "earth_radii", aliases: ["radius"] }],
    ["mass", "Mass", "scalar", { unit: "earth_masses", aliases: ["mass"] }],
    ["density", "Density", "scalar", { unit: "g_cm3", producer: "atlas" }],
    ["surface_gravity", "Surface gravity", "scalar", { unit: "g", producer: "atlas", aliases: ["surfaceGravity"] }],
    ["escape_velocity", "Escape velocity", "scalar", { unit: "km_s", producer: "atlas" }],
    ["rotation_period", "Day length", "scalar", { unit: "hours", aliases: ["dayLength"] }],
    ["obliquity", "Axial tilt", "scalar", { unit: "deg", aliases: ["axialTilt"] }],
    ["year_length", "Year length", "scalar", { unit: "local_days" }],
    ["atmo_pressure", "Atmospheric pressure", "scalar", { unit: "bar" }],
    ["atmo_composition", "Atmospheric composition", "text"],
    ["temp_mean", "Mean surface temperature", "scalar", { unit: "K", aliases: ["surfaceTemperature"] }],
    ["temp_gradient[]", "Temperature gradient", "range[]", { unit: "K", producer: "tidelock" }],
    ["hydrosphere_fraction", "Hydrosphere fraction", "scalar", { unit: "fraction" }],
    ["albedo", "Albedo", "scalar", { unit: "fraction" }],
    ["magnetosphere", "Magnetosphere", "enum"],
    ["terminator_band_width", "Terminator band width", "scalar", { unit: "km", producer: "tidelock" }],
    ["habitable_area", "Habitable area", "scalar", { unit: "km2" }],
    ["surface_type", "Surface type", "enum", { producer: "exoforge" }],
    ["composition", "Composition", "struct", { producer: "exoforge" }],
    ["hz_position", "Habitable zone position", "enum", { producer: "goldilocks" }],
    ["sky.visible_stars[]", "Visible stars", "ref[]", { producer: "exosky" }],
    ["sky.constellations[]", "Constellations", "text[]", { producer: "exosky" }],
    ["sky.daylight_colour", "Daylight colour", "text"],
  ]),
  ...domain("ecology", "biology", "symbiosis", [
    ["primary_productivity", "Primary productivity", "scalar", { unit: "kg_C_m2_yr" }],
    ["trophic_levels", "Trophic levels", "scalar"],
    ["relations[]", "Species relations", "struct[]"],
    ["carrying_capacity", "Carrying capacity", "scalar", { unit: "individuals" }],
    ["biome_set[]", "Biomes", "text[]"],
  ]),
  ...domain("place", "environment", "planet-cartographer", [
    ["height", "Height", "scalar", { unit: "m" }],
    ["coordinates", "Coordinates", "struct"],
    ["biome", "Biome", "ref"],
    ["g_profile", "Gravity profile", "scalar", { unit: "g", producer: "gravitas" }],
    ["settlement_type", "Settlement type", "enum"],
    ["population", "Population", "scalar", { unit: "individuals" }],
  ]),
  ...domain("species", "biology", "phylo", [
    ["biochemistry", "Biochemistry", "enum", { aliases: ["biochemicalBasis"] }],
    ["body_plan", "Body plan", "text", { aliases: ["bodyPlan"] }],
    ["mass_typical", "Typical mass", "scalar", { unit: "kg" }],
    ["height_typical", "Typical height", "scalar", { unit: "m" }],
    ["lifespan", "Lifespan", "scalar", { unit: "local_years" }],
    ["metabolic_rate", "Metabolic rate", "scalar", { unit: "w_kg" }],
    ["reproduction_mode", "Reproduction", "enum"],
    ["social_structure", "Social structure", "enum"],
    ["cognition_profile", "Cognition", "text", { aliases: ["cognitionType"] }],
    ["senses[]", "Senses", "struct[]", { producer: "sensorium" }],
    ["absent_modalities[]", "Absent senses", "enum[]", { producer: "sensorium" }],
    ["g_tolerance", "Gravity tolerance", "range", { unit: "g" }],
  ]),
  ...domain("character", "psychology", "dossier", [
    ["species", "Species", "ref"],
    ["polity", "Polity", "ref"],
    ["native_language", "Native language", "ref"],
    ["birth_epoch", "Born", "scalar"],
    ["height", "Height", "scalar", { unit: "m" }],
    ["mass", "Mass", "scalar", { unit: "kg" }],
    ["sensory_overrides[]", "Sensory overrides", "struct[]"],
    ["beliefs[]", "Beliefs", "ref[]"],
    ["relations[]", "Relations", "struct[]"],
    ["arc_beats[]", "Arc beats", "ref[]"],
  ]),
  ...domain("language", "culture", "lexdrift", [
    ["phonology", "Phonology", "struct"],
    ["drift_rate", "Drift rate", "scalar"],
    ["divergence", "Divergence", "scalar", { unit: "fraction" }],
    ["mutual_intelligibility[]", "Mutual intelligibility", "struct[]"],
  ]),
  ...domain("culture", "mythology", "mythos", [
    ["cosmology", "Cosmology", "text"],
    ["deities[]", "Deities", "text[]"],
    ["taboos[]", "Taboos", "text[]"],
    ["death_rites", "Death rites", "text"],
    ["calendar", "Calendar", "text"],
    ["oath_forms[]", "Oath forms", "text[]"],
    ["has_solar_deity", "Has a solar deity", "bool"],
  ]),
  ...domain("expansion", "culture", "exodus", [
    ["phase_timeline[]", "Expansion phases", "struct[]"],
    ["limiting_factor", "Limiting factor", "text"],
    // Added 2026-10-18 (/sf-fact, 1.5 item 10): what Exodus actually records.
    // Without them the Exodus manifest had nothing honest to produce.
    ["trajectory", "Expansion trajectory", "enum", { aliases: ["expansionTrajectory"] }],
    ["dominant_force", "Dominant force", "text", { aliases: ["dominantForce"] }],
  ]),
  ...domain("polity", "culture", "dominion", [
    ["governance", "Governance", "text", { aliases: ["governmentType"] }],
    ["factions[]", "Factions", "text[]"],
    ["succession", "Succession", "text"],
    ["legitimacy_source", "Legitimacy", "text"],
    ["cohesion_radius", "Cohesion radius", "scalar", { unit: "ly" }],
    ["energy_budget", "Energy budget", "scalar", { unit: "W", producer: "k-scale", aliases: ["energyOutput"] }],
    ["kardashev", "Kardashev rating", "scalar", { producer: "k-scale" }],
    ["territory[]", "Territory", "ref[]"],
    ["has_spaceflight", "Has spaceflight", "bool"],
  ]),
  ...domain("economy", "culture", "impulse", [
    ["transit_cost", "Transit cost", "text"],
    ["scarcity[]", "Scarcities", "text[]"],
    ["trade_lanes[]", "Trade lanes", "ref[]"],
  ]),
  ...domain("tech", "culture", "paradigm", [
    ["level", "Technology level", "text"],
    ["ai_capability", "AI capability", "text"],
    ["ai_autonomy", "AI autonomy", "text"],
    ["ai_relations", "AI relations", "text"],
    ["constraints[]", "Technology constraints", "text[]"],
  ]),
  ...domain("propulsion", "culture", "impulse", [
    ["type", "Propulsion type", "text", { aliases: ["propulsionType"] }],
    ["cruise_fraction_c", "Cruise velocity", "scalar", { unit: "c", aliases: ["cruiseVelocity"] }],
    ["delta_v", "Delta-v", "scalar", { unit: "km_s" }],
    ["exhaust_velocity", "Exhaust velocity", "scalar", { unit: "km_s" }],
  ]),
  ...domain("route", "culture", "cartographer", [
    ["origin", "Origin", "ref"],
    ["destination", "Destination", "ref"],
    ["distance_ly", "Distance", "scalar", { unit: "ly" }],
    ["proper_time", "Proper time", "scalar", { unit: "yr", producer: "paradox" }],
    ["coordinate_time", "Coordinate time", "scalar", { unit: "yr", producer: "paradox" }],
    ["dilation_factor", "Dilation factor", "scalar", { producer: "paradox" }],
  ]),
  ...domain("vessel", "culture", "vessel", [
    ["crew_size", "Crew size", "scalar", { aliases: ["crewSize"] }],
    ["life_support_type", "Life support", "text"],
    ["radius", "Spin radius", "scalar", { unit: "m", aliases: ["spinRadius"] }],
    ["spin_gravity", "Spin gravity", "scalar", { unit: "g", producer: "gravitas", aliases: ["targetGravity"] }],
    ["layout", "Layout", "text"],
    ["culture_aboard", "Culture aboard", "text"],
    ["closed_loop_efficiency", "Closed-loop efficiency", "scalar", { aliases: ["closedLoopEfficiency"] }],
    ["pop_genetics", "Population genetics", "struct"],
  ]),

  // ── Deprecated spellings already written by shipped code ──────────────
  // Solaris publish (src/lib/simulators/published-facts.ts) writes these.
  // Never renamed there; resolved here.
  {
    predicate: "planet.orbital_distance_au",
    label: "Orbital distance",
    kind: "scalar",
    unit: "au",
    layer: "physics",
    deprecated: true,
    aliasOf: "orbit.semi_major_axis",
  },
  {
    predicate: "planet.mass_earths",
    label: "Mass",
    kind: "scalar",
    unit: "earth_masses",
    layer: "environment",
    deprecated: true,
    aliasOf: "planet.mass",
  },
  {
    predicate: "star.luminosity_lsun",
    label: "Stellar luminosity",
    kind: "scalar",
    unit: "solar_lum",
    layer: "physics",
    deprecated: true,
    aliasOf: "star.luminosity",
  },

  // ── Provisional: written by shipped code, not a vocabulary decision ───
  {
    predicate: "planet.type",
    label: "Planet type",
    kind: "text",
    layer: "environment",
    provisional: "Solaris publish writes a display label (\"Super-Earth\"). Not planet.surface_type, whose enum it does not match. Needs /sf-fact.",
  },
  {
    predicate: "planet.name",
    label: "Planet name",
    kind: "text",
    layer: "environment",
    provisional: "Solaris publish writes it. Entity names are not predicates (03 Charter); belongs on the entity record.",
  },
  {
    predicate: "system.name",
    label: "System name",
    kind: "text",
    layer: "physics",
    provisional: "Solaris publish writes it. Entity names are not predicates (03 Charter); belongs on the entity record.",
  },
];

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

export const VOCABULARY: readonly PredicateDef[] = DEFS;

const BY_PREDICATE = new Map<string, PredicateDef>(DEFS.map((d) => [d.predicate, d]));

const BY_ALIAS = (() => {
  const m = new Map<string, PredicateDef>();
  for (const d of DEFS) {
    for (const a of d.aliases ?? []) {
      if (m.has(a)) throw new Error(`canon/vocabulary: alias "${a}" claimed twice`);
      m.set(a, d);
    }
  }
  return m;
})();

export function predicateDef(predicate: string): PredicateDef | undefined {
  return BY_PREDICATE.get(predicate);
}

export function isLegacyPredicate(predicate: string): boolean {
  return predicate.startsWith(LEGACY_PREFIX) && predicate.length > LEGACY_PREFIX.length;
}

/** Registered (incl. deprecated/provisional) or an open legacy.* name. */
export function isKnownPredicate(predicate: string): boolean {
  return BY_PREDICATE.has(predicate) || isLegacyPredicate(predicate);
}

export interface ResolvedPredicate {
  /** The canonical predicate this name or key means. */
  predicate: string;
  def: PredicateDef | null;
  via: "exact" | "deprecated" | "alias" | "legacy";
}

/**
 * What a stored predicate or a pipeline key means.
 *
 * Order matters: an exact predicate wins over everything (so an alias can
 * rescue an old spelling but never outrank the canonical name), then a
 * deprecated spelling follows its aliasOf, then a pipeline key, then the
 * legacy namespace. Always returns something: nothing is orphaned.
 */
export function resolvePredicate(nameOrKey: string): ResolvedPredicate {
  const exact = BY_PREDICATE.get(nameOrKey);
  if (exact) {
    if (exact.deprecated && exact.aliasOf) {
      const target = BY_PREDICATE.get(exact.aliasOf) ?? null;
      return { predicate: exact.aliasOf, def: target, via: "deprecated" };
    }
    return { predicate: exact.predicate, def: exact, via: "exact" };
  }
  const aliased = BY_ALIAS.get(nameOrKey);
  if (aliased) return { predicate: aliased.predicate, def: aliased, via: "alias" };
  if (isLegacyPredicate(nameOrKey)) return { predicate: nameOrKey, def: null, via: "legacy" };
  return { predicate: `${LEGACY_PREFIX}${nameOrKey}`, def: null, via: "legacy" };
}

/** Every spelling that means `predicate`: itself plus deprecated names. */
export function predicateSpellingsFor(predicate: string): string[] {
  const canonical = resolvePredicate(predicate).predicate;
  const out = [canonical];
  for (const d of DEFS) if (d.deprecated && d.aliasOf === canonical && !out.includes(d.predicate)) out.push(d.predicate);
  return out;
}

/** Human label for a predicate; legacy names fall back to the key. */
export function predicateLabel(predicate: string): string {
  const r = resolvePredicate(predicate);
  if (r.def) return r.def.label;
  return r.predicate.slice(LEGACY_PREFIX.length) || predicate;
}
