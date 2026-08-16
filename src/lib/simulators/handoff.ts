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
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeHandoff(searchParams: URLSearchParams): HandoffPayload | null {
  const raw = searchParams.get("handoff");
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
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
