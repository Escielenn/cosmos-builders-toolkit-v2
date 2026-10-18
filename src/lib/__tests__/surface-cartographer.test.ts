import { describe, it, expect } from "vitest";
import {
  EARTH_RADIUS_KM,
  angularDistanceDeg,
  compassPoint,
  formatDuration,
  formatLatLon,
  greatCircleKm,
  initialBearingDeg,
  isValidLatLon,
  latLonToSheet,
  mercatorLatLimit,
  sheetToLatLon,
  travelHours,
  wrapLon,
} from "@/lib/surface-cartographer/geo";
import {
  EARTH_TILT_DEG,
  climateBand,
  daylightProfile,
  declinationDeg,
  lockedIllumination,
  placeSky,
  polesOutheatEquator,
  terminatorHalfWidthFromHabitable,
} from "@/lib/surface-cartographer/illumination";
import {
  bodyRadiusKm,
  findStarFor,
  parseFraction,
  parseTemperatureC,
  parseTidalLock,
  resolveBodyFacts,
} from "@/lib/surface-cartographer/body";
import {
  INITIAL_STATE,
  buildGazetteerMarkdown,
  gazetteerSnapshot,
  placeMetadataPatch,
  placesOnBody,
  readPlace,
  readState,
} from "@/lib/surface-cartographer/places";
import { checkSheet } from "@/lib/surface-cartographer/sheet";
import { biomeAt, buildSurfaceModel, hashSeed, renderBaseMap } from "@/lib/surface-cartographer/basemap";
import { extractSurfaceMapFacts } from "@/lib/surface-cartographer/facts";
import { extractWorksheetFacts, hasFactMapping } from "@/lib/worksheet-facts";
import type { Entity } from "@/services/entity-graph-types";

function ent(over: Partial<Entity>): Entity {
  return {
    id: "e",
    world_id: "w",
    user_id: "u",
    name: "Kellis",
    entity_type: "planet",
    custom_type_label: null,
    cascade_stage: "physics",
    color: null,
    icon: null,
    summary: null,
    image_url: null,
    description: null,
    notes: null,
    parent_entity_id: null,
    sort_order: 0,
    tags: [],
    graph_x: null,
    graph_y: null,
    pinned: false,
    metadata: {},
    created_at: "",
    updated_at: "",
    ...over,
  };
}

// ---------------------------------------------------------------------------
// geo
// ---------------------------------------------------------------------------

describe("geo", () => {
  it("wraps longitude into [-180, 180)", () => {
    expect(wrapLon(190)).toBe(-170);
    expect(wrapLon(-190)).toBe(170);
    expect(wrapLon(180)).toBe(-180);
    expect(wrapLon(-0)).toBe(0);
  });

  it("measures a quarter of Earth's circumference pole to equator", () => {
    const km = greatCircleKm({ lat: 0, lon: 0 }, { lat: 90, lon: 0 }, EARTH_RADIUS_KM);
    expect(km).toBeCloseTo((Math.PI / 2) * EARTH_RADIUS_KM, 3);
  });

  it("matches a known city pair within 1% (London to New York ≈ 5,570 km)", () => {
    const km = greatCircleKm({ lat: 51.5074, lon: -0.1278 }, { lat: 40.7128, lon: -74.006 }, EARTH_RADIUS_KM);
    expect(km).toBeGreaterThan(5514);
    expect(km).toBeLessThan(5626);
  });

  it("scales distance with the body's radius, never Earth's by default", () => {
    const a = { lat: 0, lon: 0 };
    const b = { lat: 0, lon: 90 };
    expect(greatCircleKm(a, b, 1000)).toBeCloseTo((Math.PI / 2) * 1000, 6);
    expect(greatCircleKm(a, b, 0)).toBeNaN();
  });

  it("gives bearings and compass points", () => {
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: 10, lon: 0 })).toBeCloseTo(0, 6);
    expect(initialBearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 10 })).toBeCloseTo(90, 6);
    expect(compassPoint(225)).toBe("SW");
    expect(compassPoint(359)).toBe("N");
  });

  it("computes travel time and phrases it as a writer would", () => {
    expect(travelHours(100, 5)).toBe(20);
    expect(travelHours(100, 0)).toBeNaN();
    expect(formatDuration(0.25)).toBe("15 min");
    expect(formatDuration(20)).toBe("20 h");
    expect(formatDuration(24 * 9.4)).toBe("9.4 days");
    expect(formatDuration(24 * 800)).toBe("2.2 years");
  });

  it("round-trips equirectangular sheet coordinates", () => {
    const p = { lat: 33.3, lon: -71.2 };
    const s = latLonToSheet(p, "equirectangular");
    expect(s.x).toBeCloseTo((180 - 71.2) / 360, 9);
    expect(s.y).toBeCloseTo((90 - 33.3) / 180, 9);
    const back = sheetToLatLon(s, "equirectangular");
    expect(back.lat).toBeCloseTo(p.lat, 9);
    expect(back.lon).toBeCloseTo(p.lon, 9);
  });

  it("round-trips Mercator and reaches 85.05° on a square sheet", () => {
    expect(mercatorLatLimit(1)).toBeCloseTo(85.0511, 3);
    const p = { lat: 60, lon: 45 };
    const s = latLonToSheet(p, "mercator", 1);
    expect(s.y).toBeGreaterThan(0);
    expect(s.y).toBeLessThan(0.5);
    const back = sheetToLatLon(s, "mercator", 1);
    expect(back.lat).toBeCloseTo(60, 6);
    expect(back.lon).toBeCloseTo(45, 6);
    // The edge of a square sheet is the limit latitude.
    expect(sheetToLatLon({ x: 0.5, y: 0 }, "mercator", 1).lat).toBeCloseTo(85.0511, 3);
  });

  it("rejects out-of-range coordinates instead of clamping them", () => {
    expect(isValidLatLon(91, 0)).toBe(false);
    expect(isValidLatLon(0, 181)).toBe(false);
    expect(isValidLatLon("1", 0)).toBe(false);
    expect(isValidLatLon(-90, 180)).toBe(true);
  });

  it("formats a gazetteer coordinate", () => {
    expect(formatLatLon({ lat: 12.44, lon: -33.06 })).toBe("12.4°N 33.1°W");
    expect(formatLatLon({ lat: -5, lon: 120 })).toBe("5.0°S 120.0°E");
  });
});

// ---------------------------------------------------------------------------
// illumination
// ---------------------------------------------------------------------------

describe("daylight", () => {
  it("puts the solstice declination at the tilt", () => {
    expect(declinationDeg(23.44, 0.25)).toBeCloseTo(23.44, 6);
    expect(declinationDeg(23.44, 0)).toBeCloseTo(0, 9);
  });

  it("gives Earth's equator ~12 h all year and London a long summer day", () => {
    const eq = daylightProfile(0, EARTH_TILT_DEG, 24);
    expect(eq.summerHours).toBeCloseTo(12, 5);
    expect(eq.winterHours).toBeCloseTo(12, 5);
    const london = daylightProfile(51.5, EARTH_TILT_DEG, 24);
    // Geometric (no refraction): ~16.3 h and ~7.7 h.
    expect(london.summerHours).toBeGreaterThan(16);
    expect(london.summerHours).toBeLessThan(16.6);
    expect(london.winterHours).toBeGreaterThan(7.4);
    expect(london.winterHours).toBeLessThan(8);
    expect(london.equinoxHours).toBeCloseTo(12, 5);
  });

  it("finds polar day and polar night inside the polar circle", () => {
    const p = daylightProfile(80, EARTH_TILT_DEG, 24);
    expect(p.polarDay).toBe(true);
    expect(p.polarNight).toBe(true);
    expect(daylightProfile(60, EARTH_TILT_DEG, 24).polarDay).toBe(false);
  });

  it("scales to the body's own day and treats the southern summer as local", () => {
    const north = daylightProfile(40, 30, 10);
    const south = daylightProfile(-40, 30, 10);
    expect(north.summerHours).toBeCloseTo(south.summerHours, 9);
    expect(north.summerHours).toBeLessThan(10);
    expect(north.summerHours).toBeGreaterThan(5);
  });
});

describe("climate bands", () => {
  it("reproduces Earth's bands at Earth's tilt", () => {
    expect(climateBand(5, EARTH_TILT_DEG)).toBe("equatorial");
    expect(climateBand(22, EARTH_TILT_DEG)).toBe("tropical");
    expect(climateBand(45, EARTH_TILT_DEG)).toBe("temperate");
    expect(climateBand(62, EARTH_TILT_DEG)).toBe("subpolar");
    expect(climateBand(-80, EARTH_TILT_DEG)).toBe("polar");
  });

  it("notices when high obliquity makes the poles out-heat the equator", () => {
    expect(polesOutheatEquator(EARTH_TILT_DEG)).toBe(false);
    expect(polesOutheatEquator(70)).toBe(true);
  });
});

describe("tidally locked sky", () => {
  it("is permanent day under the star and permanent night opposite it", () => {
    expect(lockedIllumination({ lat: 0, lon: 30 }, 30).regime).toBe("day");
    expect(lockedIllumination({ lat: 0, lon: 30 }, 30).starElevationDeg).toBeCloseTo(90, 6);
    expect(lockedIllumination({ lat: 0, lon: -150 }, 30).regime).toBe("night");
    expect(lockedIllumination({ lat: 0, lon: -150 }, 30).zone).toBe("antistellar");
  });

  it("puts the poles and the ±90° meridians on the terminator", () => {
    expect(lockedIllumination({ lat: 89, lon: 0 }, 0).regime).toBe("terminator");
    expect(lockedIllumination({ lat: 10, lon: 95 }, 5).regime).toBe("terminator");
  });

  it("widens the band from Tidelock's habitable share", () => {
    expect(terminatorHalfWidthFromHabitable(null)).toBe(15);
    expect(terminatorHalfWidthFromHabitable(50)).toBeCloseTo(30, 6);
  });

  it("narrates a place without inventing a day length", () => {
    const sky = placeSky({ lat: 10, lon: 0 }, {
      tiltDeg: 10,
      dayLengthHours: null,
      tidallyLocked: false,
      substellarLon: 0,
    });
    expect(sky.daylight).toBeNull();
    expect(sky.narrative).toMatch(/NOT ON FILE/);
    const locked = placeSky({ lat: 0, lon: 0 }, { tiltDeg: 0, dayLengthHours: 24, tidallyLocked: true, substellarLon: 0 });
    expect(locked.narrative).toMatch(/PERMANENT DAY/);
    expect(locked.narrative).not.toMatch(/!/);
  });
});

// ---------------------------------------------------------------------------
// body
// ---------------------------------------------------------------------------

describe("resolveBodyFacts", () => {
  const genesis = {
    id: "ws1",
    title: "Kellis profile",
    data: {
      stellarEnvironment: { tidalLocking: "locked", starType: "K4V" },
      physicalCharacteristics: { planetaryRadius: "1.2", axialTilt: "3", dayLength: "", surfaceGravity: "1.1 g" },
      hydrosphere: { waterPresence: "partial-ocean", oceanCoverage: "" },
      temperatureProfile: { averageSurfaceTemp: "288 K" },
      atmosphericComposition: { atmosphericPressure: "0.6 bar", primaryGases: ["nitrogen", "carbon-dioxide"] },
    },
  };

  it("reads Genesis when nothing else says, with a path back to it", () => {
    const f = resolveBodyFacts({ worldId: "w", entity: null, profile: genesis, tidelock: null, star: null });
    expect(f.radiusEarth?.value).toBe(1.2);
    expect(f.radiusEarth?.source.kind).toBe("worksheet");
    expect(f.radiusEarth?.source.href).toBe("/tools/planetary-profile?worldId=w&worksheetId=ws1");
    expect(f.tidallyLocked?.value).toBe(true);
    expect(f.meanTempC?.value).toBeCloseTo(14.85, 6);
    expect(f.oceanFraction?.value).toBe(0.7);
    expect(f.atmoPressureBar?.value).toBe(0.6);
    expect(f.atmoComposition?.value).toBe("nitrogen, carbon dioxide");
    expect(f.starClass?.value).toBe("K4V");
    // An empty day length is unknown, never zero.
    expect(f.dayLengthHours).toBeNull();
  });

  it("prefers the entity's own facts and links to its Codex page", () => {
    const e = ent({
      id: "p1",
      metadata: {
        radius: 0.9,
        axialTilt: 27,
        _published_facts: [{ predicate: "orbit.tidally_locked", label: "Locked", value: "false" }],
      },
    });
    const f = resolveBodyFacts({ worldId: "w", entity: e, profile: genesis, tidelock: null, star: null });
    expect(f.radiusEarth?.value).toBe(0.9);
    expect(f.radiusEarth?.source.href).toBe("/worlds/w/codex/p1");
    expect(f.tiltDeg?.value).toBe(27);
    expect(f.tidallyLocked?.value).toBe(false);
    expect(bodyRadiusKm(f)).toBeCloseTo(0.9 * EARTH_RADIUS_KM, 6);
  });

  it("falls back to Tidelock for lock state and habitable band", () => {
    const f = resolveBodyFacts({
      worldId: "w",
      entity: null,
      profile: null,
      tidelock: { id: "s1", name: "Run 3", data: { results: { tidalLock: "Tidally locked", habPct: 22.5 } } },
      star: null,
    });
    expect(f.tidallyLocked?.value).toBe(true);
    expect(f.tidallyLocked?.source.kind).toBe("tidelock");
    expect(f.habitablePercent?.value).toBe(22.5);
  });

  it("reads the star class from the star the body orbits", () => {
    const sys = ent({ id: "s", entity_type: "star_system", name: "Kel", metadata: {} });
    const star = ent({
      id: "st",
      entity_type: "star",
      name: "Kel A",
      parent_entity_id: "s",
      metadata: { _published_facts: [{ predicate: "star.spectral_class", label: "Class", value: "M3V" }] },
    });
    const planet = ent({ id: "p", parent_entity_id: "s" });
    const found = findStarFor(planet, [sys, star, planet]);
    expect(found?.id).toBe("st");
    const f = resolveBodyFacts({ worldId: "w", entity: planet, profile: null, tidelock: null, star: found });
    expect(f.starClass?.value).toBe("M3V");
  });

  it("parses what writers actually type", () => {
    expect(parseTemperatureC("15°C")).toBe(15);
    expect(parseTemperatureC("-40 F")).toBeCloseTo(-40, 6);
    expect(parseTemperatureC("288 K")).toBeCloseTo(14.85, 6);
    expect(parseFraction("70%")).toBe(0.7);
    expect(parseFraction("0.3")).toBe(0.3);
    expect(parseFraction("140%")).toBeNull();
    expect(parseTidalLock("free")).toBe(false);
    expect(parseTidalLock("resonance")).toBe(false);
    expect(parseTidalLock("Possibly tidally locked")).toBeNull();
    expect(parseTidalLock("Synchronous")).toBe(true);
    expect(parseTidalLock("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// places + state
// ---------------------------------------------------------------------------

describe("places", () => {
  it("reads a placed location and leaves a bad coordinate unplaced", () => {
    const ok = readPlace(ent({ entity_type: "location", metadata: { lat: 12, lon: 30, placeType: "port" } }));
    expect(ok.at).toEqual({ lat: 12, lon: 30 });
    expect(ok.placeType).toBe("port");
    const bad = readPlace(ent({ entity_type: "location", metadata: { lat: 120, lon: 30 } }));
    expect(bad.at).toBeNull();
    expect(bad.placeType).toBe("landmark");
  });

  it("lists only locations filed under the body", () => {
    const all = [
      ent({ id: "a", entity_type: "location", parent_entity_id: "p", name: "B" }),
      ent({ id: "b", entity_type: "location", parent_entity_id: "q", name: "A" }),
      ent({ id: "c", entity_type: "character", parent_entity_id: "p", name: "C" }),
    ];
    expect(placesOnBody(all, "p").map((p) => p.id)).toEqual(["a"]);
    expect(placesOnBody(all, null)).toEqual([]);
  });

  it("writes coordinates and the Atlas's sheet position from one source", () => {
    const patch = placeMetadataPatch({ lat: 45.12345, lon: -90 }, "p", "city");
    expect(patch.lat).toBe(45.123);
    expect(patch.atlas_x).toBeCloseTo(0.25, 6);
    expect(patch.atlas_y).toBeCloseTo((90 - 45.123) / 180, 5);
    expect(patch.bodyEntityId).toBe("p");
    // Beyond a Mercator sheet's edge: coordinates kept, no picture position.
    const polar = placeMetadataPatch({ lat: 89, lon: 0 }, "p", "station", { projection: "mercator", aspect: 1 });
    expect(polar.lat).toBe(89);
    expect(polar.atlas_x).toBeNull();
  });

  it("loads older or junk worksheet data without throwing", () => {
    expect(readState(null)).toEqual(INITIAL_STATE);
    const s = readState({ substellarLon: 400, travelKmh: -3, mapSource: "sheet", gazetteer: [{ id: "x" }, { id: "y", name: "Y", lat: 1, lon: 2 }] });
    expect(s.substellarLon).toBe(180);
    expect(s.travelKmh).toBe(0.1);
    expect(s.mapSource).toBe("sheet");
    expect(s.gazetteer).toHaveLength(1);
  });

  it("snapshots placed places only, and exports a grouped gazetteer", () => {
    const places = [
      { id: "1", name: "Vel Haran", placeType: "city" as const, description: "Salt city.\nOld.", at: { lat: 10, lon: 20 } },
      { id: "2", name: "The Glass", placeType: "hazard" as const, description: "", at: null },
    ];
    expect(gazetteerSnapshot(places).map((g) => g.id)).toEqual(["1"]);
    const md = buildGazetteerMarkdown("Kellis", places.map((p) => ({ place: p, band: "Tropical" })), {
      radiusKm: 7000,
      locked: false,
      substellarLon: 0,
    });
    expect(md).toContain("# Kellis — Gazetteer");
    expect(md).toContain("## City");
    expect(md).toContain("**Vel Haran** (10.0°N 20.0°E · Tropical)");
    expect(md).toContain("Salt city. Old.");
    expect(md).toContain("## Unplaced");
  });
});

// ---------------------------------------------------------------------------
// sheets
// ---------------------------------------------------------------------------

describe("checkSheet", () => {
  it("accepts 2:1 equirect and warns otherwise without blocking", () => {
    expect(checkSheet(4096, 2048, "equirectangular").ok).toBe(true);
    const off = checkSheet(3000, 2000, "equirectangular");
    expect(off.ok).toBe(false);
    expect(off.warning).toMatch(/^ASPECT 1\.50:1/);
  });

  it("reads a Mercator sheet's reach from its shape", () => {
    const sq = checkSheet(2048, 2048, "mercator");
    expect(sq.ok).toBe(true);
    expect(sq.latLimit).toBeCloseTo(85.05, 1);
    expect(checkSheet(1000, 2000, "mercator").ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generated base map
// ---------------------------------------------------------------------------

describe("generated base map", () => {
  const params = { seed: "kellis", oceanFraction: 0.7, meanTempC: 14, tiltDeg: 23, locked: false, substellarLon: 0 };

  it("is deterministic for a seed", () => {
    expect(hashSeed("kellis")).toBe(hashSeed("kellis"));
    expect(hashSeed("kellis")).not.toBe(hashSeed("kellis2"));
    const a = renderBaseMap(buildSurfaceModel(params), 32, 16);
    const b = renderBaseMap(buildSurfaceModel(params), 32, 16);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("puts the stated share of the surface under water", () => {
    const model = buildSurfaceModel(params);
    let wet = 0;
    let total = 0;
    // Area-weighted grid sample.
    for (let lat = -87.5; lat < 90; lat += 5) {
      const w = Math.cos((lat * Math.PI) / 180);
      for (let lon = -177.5; lon < 180; lon += 5) {
        const b = biomeAt(model, lat, lon);
        if (b === "deep_ocean" || b === "shallow_ocean" || b === "sea_ice") wet += w;
        total += w;
      }
    }
    expect(wet / total).toBeGreaterThan(0.62);
    expect(wet / total).toBeLessThan(0.78);
  });

  it("freezes a cold world and dries an oceanless one", () => {
    const cold = buildSurfaceModel({ ...params, meanTempC: -60 });
    expect(["ice_sheet", "sea_ice"]).toContain(biomeAt(cold, 0, 0));
    const dry = buildSurfaceModel({ ...params, oceanFraction: 0 });
    const wet = ["deep_ocean", "shallow_ocean", "sea_ice"];
    for (const lon of [-120, -40, 30, 100]) expect(wet).not.toContain(biomeAt(dry, 10, lon));
  });

  it("bands a locked world around its substellar point", () => {
    const locked = buildSurfaceModel({ ...params, meanTempC: -10, locked: true, substellarLon: 0 });
    // The antistellar point is deep in the night: ice.
    expect(["ice_sheet", "sea_ice"]).toContain(biomeAt(locked, 0, 180));
  });
});

// ---------------------------------------------------------------------------
// facts reach the writing surface
// ---------------------------------------------------------------------------

describe("surface map facts", () => {
  const data = {
    ...INITIAL_STATE,
    bodyName: "Kellis",
    gazetteer: [{ id: "1", name: "Vel Haran", placeType: "city", lat: 10, lon: 20 }],
  };

  it("emits the body and one fact per placed location, inserting the name", () => {
    const facts = extractSurfaceMapFacts(data);
    const place = facts.find((f) => f.label === "Vel Haran");
    expect(place?.value).toBe("10.0°N 20.0°E · city");
    expect(place?.insert).toBe("Vel Haran");
    expect(facts.find((f) => f.key === "surfaceMap.body")?.value).toBe("Kellis");
  });

  it("is registered with worksheet-facts so the Studio Refs tab can read it", () => {
    expect(hasFactMapping("surface-cartographer")).toBe(true);
    const viaRegistry = extractWorksheetFacts("surface-cartographer", data, "planet-1");
    expect(viaRegistry.some((f) => f.insert === "Vel Haran" && f.subject_id === "planet-1")).toBe(true);
  });

  it("returns nothing for an empty or junk save", () => {
    expect(extractSurfaceMapFacts(null)).toEqual([]);
    expect(extractSurfaceMapFacts(INITIAL_STATE)).toEqual([]);
  });
});
