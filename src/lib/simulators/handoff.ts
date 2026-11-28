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
  /** The star's luminosity in L☉ (Solaris's `lum`). Absolute, not a class. */
  starMassLum: number;
  /** Orbital distance in AU. */
  planetAU: number;
  planetName: string;
  planetType: string;
  /** Present on STELLARFORGE_PUBLISH_PLANET messages; absent from the URL handoff. */
  systemName?: string;
  /**
   * 1.9 X4: absolute star numbers, so the receiver never has to guess a star
   * from a colour word. Optional: Solaris (lane S) adds them; older links
   * without them still decode.
   */
  starTeffK?: number;
  starMassMsun?: number;
}

/**
 * Where to put a handed-off planet in a tool whose star is not the sender's,
 * so it receives the SAME starlight (1.9 audit X4).
 *
 * Insolation S = L / a² (L☉, AU; Earth = 1). Keeping S fixed around a star of
 * luminosity L' gives a' = √(L' / S) = √L' · (a / √L). So the number to send
 * is a / √L, the planet's "Earth-equivalent distance": 1.0 means Earth's
 * sunlight. Tidelock multiplies it by its star table's `hz` column, which is
 * √L to the table's precision (M3V 0.013 L☉ → 0.114, F0V 6.5 L☉ → 2.55), so
 * the received planet keeps its insolation whichever star Tidelock picks.
 *
 * This replaces SOLARIS_HZ_MID, a five-row table of habitable-zone midpoints
 * that disagreed with Solaris's own Kopparapu zone (yellow 1.6 to 3.0 AU
 * against 0.95 to 1.68): a 1.3 AU world arrived at 0.5 AU and 419 K.
 */
export function insolationEquivalentAU(planetAU: number, luminosityLsun: number): number | null {
  if (!(planetAU > 0) || !(luminosityLsun > 0) || !Number.isFinite(planetAU) || !Number.isFinite(luminosityLsun)) return null;
  return planetAU / Math.sqrt(luminosityLsun);
}

/** Insolation in Earth units, S = L / a². */
export function insolationOf(planetAU: number, luminosityLsun: number): number | null {
  const d = insolationEquivalentAU(planetAU, luminosityLsun);
  return d === null ? null : 1 / (d * d);
}

const STAR_TYPES: readonly SolarisStarType[] = ["blue", "white", "yellow", "orange", "red"];

export function isSolarisStarType(v: unknown): v is SolarisStarType {
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

/**
 * Structural validation shared by decodeHandoff (URL, base64-wrapped) and
 * the direct STELLARFORGE_PUBLISH_PLANET postMessage listener (SolarisSimulator.tsx)
 * — same untrusted-shape checks either way, written once.
 */
export function isHandoffPayload(data: unknown): data is HandoffPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.from !== "solaris") return false;
  if (!isSolarisStarType(d.starType)) return false;
  if (typeof d.starMassLum !== "number" || !Number.isFinite(d.starMassLum)) return false;
  if (typeof d.planetAU !== "number" || !Number.isFinite(d.planetAU) || d.planetAU <= 0) return false;
  if (typeof d.planetName !== "string" || !d.planetName) return false;
  if (typeof d.planetType !== "string" || !d.planetType) return false;
  if (d.systemName !== undefined && typeof d.systemName !== "string") return false;
  for (const k of ["starTeffK", "starMassMsun"] as const) {
    if (d[k] !== undefined && (typeof d[k] !== "number" || !Number.isFinite(d[k] as number) || (d[k] as number) <= 0)) return false;
  }
  return true;
}

export function decodeHandoff(searchParams: URLSearchParams): HandoffPayload | null {
  const raw = searchParams.get("handoff");
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json) as unknown;
    if (!isHandoffPayload(data)) return null;
    return data;
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
  // Own-property check only: typeKey comes from decodeHandoff's untrusted URL
  // param, validated only as "a non-empty string". A plain object lookup
  // (SOLARIS_PLANET_TYPE_LABELS[typeKey]) falls through to Object.prototype
  // for keys like "constructor" or "toString", returning a function rather
  // than undefined; `?? typeKey` never fires (a function isn't nullish), and
  // the .toLowerCase() below throws. hasOwnProperty keeps the lookup to the
  // map's own entries only, so an unrecognised key (including a prototype
  // name) falls back to the raw key exactly as before.
  const label = Object.prototype.hasOwnProperty.call(SOLARIS_PLANET_TYPE_LABELS, typeKey)
    ? SOLARIS_PLANET_TYPE_LABELS[typeKey]
    : typeKey;
  return label.toLowerCase();
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
