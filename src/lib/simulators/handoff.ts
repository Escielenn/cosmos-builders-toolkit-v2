// ---------------------------------------------------------------------------
// handoff, passing one generated planet from one simulator into another.
//
// Solaris generates systems; ExoSky and Tidelock each want a single planet's
// worth of context (its star, its orbital distance) to open pre-loaded rather
// than at their own defaults. This is not the STELLARFORGE_SAVE/PUBLISH
// envelope: that carries a whole simulation's state to Supabase. A handoff is
// smaller, lives entirely in the URL, and exists only to seed a fresh session
// in a *different* tool. Nothing here is persisted.
// ---------------------------------------------------------------------------

export type SolarisStarType = "blue" | "white" | "yellow" | "orange" | "red";

export interface HandoffPayload {
  from: "solaris";
  starType: SolarisStarType;
  /** Solaris's own `lum` value for the star, e.g. 0.42 for an orange star. */
  starMassLum: number;
  /** Orbital distance in AU. */
  planetAU: number;
  planetName: string;
  planetType: string;
}

const STAR_TYPES: readonly SolarisStarType[] = ["blue", "white", "yellow", "orange", "red"];

function isSolarisStarType(v: unknown): v is SolarisStarType {
  return typeof v === "string" && (STAR_TYPES as readonly string[]).includes(v);
}

export function encodeHandoff(payload: HandoffPayload): string {
  const json = JSON.stringify(payload);
  // btoa/atob, matching the same base64-in-URL approach Rogue's own
  // share-by-URL already ships (public/rogue/sim.html saveToURL/loadFromURL),
  // so a reader who has seen one has seen both.
  const b64 = btoa(unescape(encodeURIComponent(json)));
  // Standard base64's `+`, `/` and `=` are not safe to drop straight into a
  // query string: a caller that forgets encodeURIComponent (SolarisSimulator.tsx
  // did, until this was caught) gets `+` silently read back as a space by
  // URLSearchParams, which corrupts the value and sends decodeHandoff into its
  // catch block with no visible error. Planet names are free-text and
  // user-edited, so this isn't a hypothetical: non-ASCII content raises the
  // odds of hitting one of these bytes. Make the output URL-safe by
  // construction instead of relying on every call site to remember to escape it.
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeHandoff(searchParams: URLSearchParams): HandoffPayload | null {
  const raw = searchParams.get("handoff");
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json) as Record<string, unknown>;
    if (data.from !== "solaris") return null;
    if (!isSolarisStarType(data.starType)) return null;
    if (typeof data.starMassLum !== "number" || !Number.isFinite(data.starMassLum)) return null;
    if (typeof data.planetAU !== "number" || !Number.isFinite(data.planetAU) || data.planetAU <= 0) return null;
    if (typeof data.planetName !== "string" || !data.planetName) return null;
    if (typeof data.planetType !== "string" || !data.planetType) return null;
    return {
      from: "solaris",
      starType: data.starType,
      starMassLum: data.starMassLum,
      planetAU: data.planetAU,
      planetName: data.planetName,
      planetType: data.planetType,
    };
  } catch {
    return null;
  }
}

/**
 * Solaris's PTYPES display names (public/tools/solaris/sim.html:437-467),
 * duplicated only as far as needed to turn a handoff's raw `typeKey` (its
 * `planetType` field, e.g. "gasgiant", "tidallocked", "waterworld") into the
 * same human-readable label Solaris's own planet panel shows. Without this,
 * prose built from the raw key reads as broken concatenated words instead of
 * a sentence. Falls back to the raw key for anything not listed, rather than
 * throwing if Solaris adds a type this list hasn't caught up to yet.
 */
const SOLARIS_PLANET_TYPE_LABELS: Record<string, string> = {
  magma: "Magma",
  arid: "Arid",
  desert: "Desert",
  scarred: "Scarred",
  lavaocean: "Lava Ocean",
  ironfist: "Iron World",
  volcanic: "Volcanic",
  terrestrial: "Terrestrial",
  ocean: "Ocean World",
  superearth: "Super-Earth",
  jungle: "Jungle",
  tidallocked: "Tidal Lock",
  greenhouse: "Greenhouse",
  twilight: "Twilight",
  crystalline: "Crystalline",
  waterworld: "Water World",
  hycean: "Hycean",
  gasgiant: "Gas Giant",
  icegiant: "Ice Giant",
  rocky: "Rocky",
  barren: "Barren",
  stormworld: "Storm World",
  diamond: "Carbon World",
  binarycomp: "Companion",
  glacial: "Glacial",
  airless: "Airless",
  rogue: "Rogue World",
  comet: "Comet Body",
  oortbody: "Oort Body",
  protoplanet: "Protoplanet",
  moonsized: "Moon-Sized",
};

/** Lower-cased so it drops straight into mid-sentence prose, e.g. "gas giant". */
export function solarisPlanetTypeLabel(typeKey: string): string {
  return (SOLARIS_PLANET_TYPE_LABELS[typeKey] ?? typeKey).toLowerCase();
}

/**
 * One sentence describing a handed-off planet, for the receiving simulator's
 * note field. Centralised (rather than built inline at each call site) so the
 * a/an article agreement and the typeKey-to-label mapping are each written,
 * and tested, exactly once.
 */
export function describeHandoffPlanet(payload: HandoffPayload): string {
  const starArticle = /^[aeiou]/i.test(payload.starType) ? "an" : "a";
  const typeLabel = solarisPlanetTypeLabel(payload.planetType);
  return `${typeLabel} planet, ${payload.planetAU.toFixed(2)} AU from ${starArticle} ${payload.starType} star.`;
}
