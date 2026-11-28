import { describe, it, expect } from "vitest";
import {
  EARTH_POLE,
  EARTH_ORBIT_NORMAL,
  altAz,
  horizonFrame,
  planetEquatorialFrame,
  unitFromRaDec,
} from "@/lib/simulators/astro";
import { makeCamera, project, unproject } from "@/lib/simulators/exosky-projection";
import { chartPoint } from "@/lib/simulators/exosky-chart";

// E1: the sky is seen from inside the sphere. Facing south, east is on the
// LEFT. These pin it with stars everyone can check on a winter night.
const BETELGEUSE = unitFromRaDec(88.793, 7.407);
const RIGEL = unitFromRaDec(78.634, -8.202);
const ALDEBARAN = unitFromRaDec(68.98, 16.509);
const SIRIUS = unitFromRaDec(101.287, -16.716);

const eq = planetEquatorialFrame(EARTH_POLE, EARTH_ORBIT_NORMAL);

describe("orientation: Orion from 40°N, facing south", () => {
  // Local sidereal time 5h30m: Orion on the meridian.
  const h = horizonFrame(eq, 40, 82.5);
  // Display longitude runs north -> west, so due south (azimuth 180) is lon 180.
  const cam = makeCamera(h, 180, 30, 90, 1000, 700);
  const b = project(cam, BETELGEUSE)!;
  const r = project(cam, RIGEL)!;
  const a = project(cam, ALDEBARAN)!;
  const s = project(cam, SIRIUS)!;

  it("has Orion in view, south of the zenith", () => {
    expect(b && r && a && s).toBeTruthy();
    expect(altAz(h, BETELGEUSE).az).toBeGreaterThan(150);
    expect(altAz(h, BETELGEUSE).az).toBeLessThan(210);
  });
  it("puts Betelgeuse upper-left of Rigel", () => {
    expect(b.x).toBeLessThan(r.x);
    expect(b.y).toBeLessThan(r.y);
  });
  it("puts Aldebaran to Orion's right (west) and Sirius to its lower left (east)", () => {
    expect(a.x).toBeGreaterThan(b.x);
    expect(s.x).toBeLessThan(r.x);
    expect(s.y).toBeGreaterThan(b.y);
  });
});

describe("orientation: the equatorial view", () => {
  it("puts higher right ascension (east) on the left", () => {
    const cam = makeCamera(eq, 83, 0, 60, 1000, 700);
    expect(project(cam, BETELGEUSE)!.x).toBeLessThan(project(cam, RIGEL)!.x);
  });
  it("puts north up", () => {
    const cam = makeCamera(eq, 83, 0, 60, 1000, 700);
    expect(project(cam, BETELGEUSE)!.y).toBeLessThan(project(cam, RIGEL)!.y);
  });
});

describe("projection round-trips", () => {
  it("unproject inverts project", () => {
    const cam = makeCamera(eq, 40, 20, 120, 900, 600);
    const p = project(cam, ALDEBARAN)!;
    const d = unproject(cam, p.x, p.y);
    expect(d[0]).toBeCloseTo(ALDEBARAN[0], 6);
    expect(d[1]).toBeCloseTo(ALDEBARAN[1], 6);
    expect(d[2]).toBeCloseTo(ALDEBARAN[2], 6);
  });
  it("looks straight up without degenerating", () => {
    const h = horizonFrame(eq, 40, 0);
    const cam = makeCamera(h, 0, 90, 120, 800, 800);
    const z = project(cam, h[2])!;
    expect(z.x).toBeCloseTo(400, 6);
    expect(z.y).toBeCloseTo(400, 6);
  });
});

describe("orientation: the printed horizon chart", () => {
  const h = horizonFrame(eq, 40, 82.5);
  // A point low in the east and one low in the north, built in the horizon frame.
  const east = [-h[1][0], -h[1][1], -h[1][2]] as [number, number, number];
  const north = h[0];
  it("has east on the left and north at the top, as held overhead", () => {
    const c = chartPoint({ layout: "horizon", frame: h }, h[2])!;
    const e = chartPoint({ layout: "horizon", frame: h }, east)!;
    const n = chartPoint({ layout: "horizon", frame: h }, north)!;
    expect(e.x).toBeLessThan(c.x);
    expect(n.y).toBeLessThan(c.y);
  });
});
