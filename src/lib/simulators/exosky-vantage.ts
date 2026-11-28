// ---------------------------------------------------------------------------
// exosky-vantage, one place to stand, resolved from everything that knows
// something about it (1.9, E10 / N1 / N2 / N8).
//
// A value comes from, in order: the writer's own setting in ExoSky, canon
// (the world's facts), a Solaris handoff, the HYG catalogue, the shipped
// preset, a derivation, and only then a default. Each resolved value carries
// its source, which the panel prints beside it, so "24 h (not set)" is never
// mistaken for a fact about the writer's world.
//
// 1.8 forced atmoType "none", ignored spectral class and tidal lock, and put
// handoffs at a fake galactic position (AU x 40 degrees, a flat 10 pc). Now an
// unplaced system is unplaced: position is null and the UI asks the writer to
// place it (star.galactic_position).
// ---------------------------------------------------------------------------

import {
  DEG,
  galToEq,
  raDecDistToXYZ,
  type Vec3,
} from "@/lib/simulators/astro";
import type { CatalogueStar } from "@/lib/simulators/exosky-catalogue";
import type { HandoffPayload } from "@/lib/simulators/handoff";
import {
  DISTANCE_OVERRIDES_PC,
  EARTH_LONGITUDE0,
  MOON,
  SOLAR_SYSTEM,
  hostFromCatalogue,
  type AtmoKey,
  type OrbitingBody,
  type VantagePreset,
} from "@/lib/simulators/exosky-systems";
import { defaultPrecessionYears, type ResolvedVantage, type Source, type Sourced } from "@/lib/simulators/exosky-sky";

/** Facts about one entity, by canonical predicate. */
export type FactMap = Record<string, number | string | boolean | Record<string, unknown> | undefined>;

export interface Placement {
  l: number;
  b: number;
  distPc: number;
  catalogueId?: string | null;
  source: Source;
}

export interface WriterOverrides {
  poleRa?: number;
  poleDec?: number;
  rotationHours?: number;
  obliquityDeg?: number;
  tidallyLocked?: boolean;
  precessionYears?: number;
  atmo?: AtmoKey;
}

export interface VantageInput {
  preset?: VantagePreset | null;
  catalogue: readonly CatalogueStar[] | null;
  catalogueById?: Map<string, CatalogueStar> | null;
  canon?: {
    label: string;
    planet: FactMap;
    star: FactMap;
    siblings: OrbitingBody[];
    moons: OrbitingBody[];
  } | null;
  handoff?: HandoffPayload | null;
  placement?: Placement | null;
  overrides?: WriterOverrides;
}

const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const boolOf = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (/^(true|yes|locked)$/i.test(v.trim())) return true;
    if (/^(false|no)$/i.test(v.trim())) return false;
  }
  return undefined;
};

function pick<T>(...cands: Array<[T | undefined, Source, string?]>): Sourced<T> | null {
  for (const [v, source, note] of cands) if (v !== undefined) return { value: v, source, note };
  return null;
}

/** Galactic (l, b, d) to a heliocentric J2000 position. */
export function placementToEq(p: Pick<Placement, "l" | "b" | "distPc">): Vec3 {
  const l = p.l * DEG, b = p.b * DEG, d = Math.max(0, p.distPc);
  return galToEq(d * Math.cos(b) * Math.cos(l), d * Math.cos(b) * Math.sin(l), d * Math.sin(b));
}

/** Read a star.galactic_position struct value. */
export function readGalacticPosition(v: unknown): Omit<Placement, "source"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const inner = (o.value && typeof o.value === "object" ? o.value : o) as Record<string, unknown>;
  const l = num(inner.l_deg), b = num(inner.b_deg), d = num(inner.distance_pc);
  if (l === undefined || b === undefined || d === undefined) return null;
  return { l, b, distPc: d, catalogueId: typeof inner.catalogue_id === "string" ? inner.catalogue_id : null };
}

/** Map a Solaris planet type key to an atmosphere model. */
export function atmoFromPlanetType(t: string | undefined): AtmoKey | undefined {
  if (!t) return undefined;
  const k = t.toLowerCase();
  if (/gasgiant|icegiant/.test(k)) return "gas_giant";
  if (/airless|barren|moonsized|rogue|comet|oort|scarred/.test(k)) return "none";
  if (/greenhouse/.test(k)) return "thick_co2";
  if (/magma|lava|volcanic/.test(k)) return "exotic";
  if (/arid|desert|glacial/.test(k)) return "thin_co2";
  if (/hycean|superearth|stormworld/.test(k)) return "thick_n2";
  if (/terrestrial|ocean|water|jungle|twilight|tidallocked|rocky/.test(k)) return "earth_like";
  return undefined;
}

/** Atmosphere from canon pressure (bar) and composition text. */
export function atmoFromCanon(pressure: number | undefined, composition: string | undefined): AtmoKey | undefined {
  if (pressure === undefined && !composition) return undefined;
  const co2 = composition ? /co2|co₂|carbon dioxide/i.test(composition) : false;
  const h2 = composition ? /\bh2\b|h₂|hydrogen|helium/i.test(composition) : false;
  if (h2) return "gas_giant";
  if (pressure !== undefined && pressure < 0.001) return "none";
  if (pressure !== undefined && pressure < 0.3) return co2 ? "thin_co2" : "thin_n2";
  if (pressure !== undefined && pressure > 3) return co2 ? "thick_co2" : "thick_n2";
  return co2 && (pressure ?? 1) > 1.5 ? "thick_co2" : "earth_like";
}

/** Apply later distance measurements to catalogue stars (one value, not two). */
export function applyCatalogueOverrides(stars: CatalogueStar[]): CatalogueStar[] {
  for (const s of stars) {
    const o = DISTANCE_OVERRIDES_PC[s.id];
    if (o && s.dist > 0) {
      const f = o.distPc / s.dist;
      s.x *= f; s.y *= f; s.z *= f; s.dist = o.distPc;
      // Brighter at the larger distance by the same light: absolute magnitude moves.
      s.absMag -= 5 * Math.log10(f);
    }
  }
  return stars;
}

/** The catalogue star within 0.05 pc of a position, if any. */
export function catalogueStarAt(stars: readonly CatalogueStar[] | null, pos: Vec3): CatalogueStar | null {
  if (!stars) return null;
  let best: CatalogueStar | null = null;
  let bestD = 0.05;
  for (const s of stars) {
    const d = Math.hypot(s.x - pos[0], s.y - pos[1], s.z - pos[2]);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

export interface Resolved extends ResolvedVantage {
  atmo: Sourced<AtmoKey>;
  status: VantagePreset["status"];
  note: string;
  source: string;
}

export function resolveVantage(input: VantageInput): Resolved {
  const { preset, catalogue, canon, handoff, placement } = input;
  const ov = input.overrides ?? {};
  const byId = input.catalogueById ?? null;
  const isEarth = preset?.key === "earth" && !canon && !handoff && !placement;
  const pf = canon?.planet ?? {};
  const sf = canon?.star ?? {};

  // ── Where ────────────────────────────────────────────────────────────
  let position: Sourced<Vec3> | null = null;
  let hostStar: CatalogueStar | null = null;
  if (placement) {
    const viaId = placement.catalogueId && byId ? byId.get(placement.catalogueId) ?? null : null;
    if (viaId) {
      hostStar = viaId;
      position = { value: [viaId.x, viaId.y, viaId.z], source: placement.source, note: `At ${placement.catalogueId}` };
    } else {
      position = { value: placementToEq(placement), source: placement.source };
      hostStar = catalogueStarAt(catalogue, position.value);
    }
  } else if (preset?.hostId && byId?.get(preset.hostId)) {
    hostStar = byId.get(preset.hostId)!;
    position = { value: [hostStar.x, hostStar.y, hostStar.z], source: "catalogue" };
  } else if (preset && preset.ra !== undefined && preset.dec !== undefined && preset.distPc !== undefined) {
    position = { value: raDecDistToXYZ(preset.ra, preset.dec, preset.distPc), source: "preset" };
    hostStar = catalogueStarAt(catalogue, position.value);
  } else if (preset?.key === "earth") {
    position = { value: [0, 0, 0], source: "preset" };
  }

  // ── The star ─────────────────────────────────────────────────────────
  const catHost = hostStar ? hostFromCatalogue(hostStar.absMag, hostStar.bv) : null;
  const handoffLum = handoff && handoff.starMassLum > 0 ? handoff.starMassLum : undefined;
  const lum = pick<number>(
    [num(sf["star.luminosity"]), "canon"],
    [handoffLum, "handoff"],
    [preset?.hostData?.lumSolar, "preset"],
    [catHost?.lumSolar, "catalogue", "from V, no bolometric correction"],
  ) ?? { value: 1, source: "default", note: "Sun-like (not set)" };
  const absMag = pick<number>(
    [num(sf["star.luminosity"]) !== undefined || handoffLum !== undefined ? 4.83 - 2.5 * Math.log10(lum.value) : undefined, lum.source === "canon" ? "canon" : "handoff", "from luminosity"],
    [catHost?.absMag, "catalogue"],
    [preset?.hostData?.absMag, "preset"],
  ) ?? { value: 4.83, source: "default", note: "Sun-like (not set)" };
  const teff = pick<number>(
    [num(sf["star.temp_effective"]), "canon"],
    [preset?.hostData?.teffK, "preset"],
    [catHost?.teffK, "catalogue", "from B-V"],
  ) ?? { value: 5772, source: "default", note: "Sun-like (not set)" };
  const mass = pick<number>(
    [num(sf["star.mass"]), "canon"],
    [preset?.hostData?.massSolar, "preset"],
    [catHost?.massSolar, "derived", "from luminosity, main sequence"],
  ) ?? { value: Math.pow(lum.value, 1 / 3.5), source: "derived", note: "from luminosity, main sequence" };

  // ── The planet ───────────────────────────────────────────────────────
  const presetAu = preset && Number.isFinite(preset.planetData.au) ? preset.planetData.au : undefined;
  const au = pick<number>(
    [num(pf["orbit.semi_major_axis"]), "canon"],
    [handoff?.planetAU, "handoff"],
    [presetAu, "preset"],
  ) ?? { value: Math.sqrt(lum.value), source: "derived", note: "Earth-equivalent light, √L AU" };
  const presetDays = presetAu !== undefined && au.source === "preset" ? preset!.planetData.orbitDays : undefined;
  const orbitDays = pick<number>(
    [num(pf["orbit.period"]), "canon"],
    [presetDays, "preset"],
  ) ?? { value: 365.256 * Math.sqrt(au.value ** 3 / Math.max(1e-6, mass.value)), source: "derived", note: "Kepler's third law" };
  const locked = pick<boolean>(
    [ov.tidallyLocked, "writer"],
    [boolOf(pf["orbit.tidally_locked"]), "canon"],
    [handoff?.planetType === "tidallocked" ? true : undefined, "handoff"],
    [preset?.planetData.tidallyLocked, "preset"],
  ) ?? { value: false, source: "default", note: "not set" };
  const rotation = locked.value
    ? { value: orbitDays.value * 24, source: "derived" as Source, note: "locked: one turn per orbit" }
    : pick<number>(
        [ov.rotationHours, "writer"],
        [num(pf["planet.rotation_period"]), "canon"],
        [preset?.planetData.rotationHours ?? undefined, "preset"],
      ) ?? { value: 24, source: "default", note: "not set" };
  const obliquity = locked.value
    ? { value: 0, source: "derived" as Source, note: "locked: spin aligned with orbit" }
    : pick<number>(
        [ov.obliquityDeg, "writer"],
        [num(pf["planet.obliquity"]), "canon"],
        [preset?.planetData.obliquityDeg ?? undefined, "preset"],
      ) ?? { value: 0, source: "default", note: "not set" };
  const poleRa = ov.poleRa ?? num(pf["planet.pole_ra"]);
  const poleDec = ov.poleDec ?? num(pf["planet.pole_dec"]);
  const pole: Sourced<{ ra: number; dec: number }> =
    poleRa !== undefined && poleDec !== undefined
      ? { value: { ra: poleRa, dec: poleDec }, source: ov.poleRa !== undefined ? "writer" : "canon" }
      : isEarth
        ? { value: { ra: 0, dec: 90 }, source: "preset" }
        : { value: { ra: 0, dec: 90 }, source: "default", note: "not set: parallel to Earth's axis" };
  const precession = locked.value
    ? { value: Infinity, source: "derived" as Source, note: "locked: the axis stays on the orbit normal" }
    : pick<number>(
    [ov.precessionYears, "writer"],
    [num(pf["planet.precession_period"]), "canon"],
  ) ?? {
    value: defaultPrecessionYears(isEarth, rotation.value, orbitDays.value, obliquity.value),
    source: isEarth ? ("preset" as Source) : ("derived" as Source),
    note: isEarth ? "IAU 2006, 25,772 yr" : "solar torque only; moons not modelled",
  };
  const albedo = pick<number>([num(pf["planet.albedo"]), "canon"]) ?? { value: 0.3, source: "default", note: "not set" };

  const atmo = pick<AtmoKey>(
    [ov.atmo, "writer"],
    [atmoFromCanon(num(pf["planet.atmo_pressure"]), typeof pf["planet.atmo_composition"] === "string" ? (pf["planet.atmo_composition"] as string) : undefined), "canon"],
    [atmoFromPlanetType(handoff?.planetType), "handoff"],
    [preset?.atmo, "preset"],
  ) ?? { value: "none" as AtmoKey, source: "default", note: "not set" };

  const presetSiblings = (preset?.siblings ?? []).filter((b) => Math.abs(b.au - au.value) > 1e-6);
  const siblings = canon?.siblings?.length ? canon.siblings : isEarth ? [...SOLAR_SYSTEM] : presetSiblings;
  const moons = canon?.moons?.length ? canon.moons : isEarth ? [MOON] : [];

  const label = canon?.label ?? (handoff ? handoff.planetName : preset?.planet ?? "Custom location");
  const hostName = hostStar?.name ?? (handoff ? `${handoff.starType} star` : preset?.host ?? "Unnamed star");

  return {
    label,
    hostName: canon ? (hostStar?.name ?? hostName) : hostName,
    position,
    hostId: hostStar?.id ?? null,
    host: { absMag, teffK: teff, lumSolar: lum, massSolar: mass },
    planet: {
      au,
      orbitDays,
      rotationHours: rotation,
      obliquityDeg: obliquity,
      tidallyLocked: locked,
      pole,
      precessionYears: precession,
      albedo,
    },
    siblings,
    moons,
    isEarth,
    hostLongitude0: isEarth ? EARTH_LONGITUDE0 + 180 : 0,
    atmo,
    status: canon ? "yours" : preset?.status ?? "yours",
    note: preset?.note ?? "",
    source: preset?.source ?? "",
  };
}

/** Deterministic starting longitude for a body whose real phase is unknown. */
export function longitudeFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 36000) / 100;
}
