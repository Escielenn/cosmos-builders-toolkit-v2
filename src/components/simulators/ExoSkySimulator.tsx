import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useEntities, useUpdateEntity } from "@/hooks/use-entity-graph";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { toExoskyPayload, fromExoskySave } from "@/lib/simulators/exosky-save";
import { evaluateExoSkyFlags, flagDismissKey } from "@/sims/flags";
import { useDismissedFlags } from "@/hooks/use-dismissed-flags";

// ═══════════════════════════════════════════════════════════════
// EXOSKY v2, Alien Night Sky Simulator with Milky Way
// StellarForge.tools · © 2025–2026 Jason D. Batt, Ph.D.
//
// MATH VALIDATION (verified 2026-04-25):
// • IAU 1958 equatorial→galactic rotation matrix (NGP at α 192.859°,
//   δ +27.128°; l_NCP = 122.932°). Standard reference.
// • Heliocentric Cartesian conversion: (RA, Dec, dist) → (x,y,z) where
//   x = r·cos(Dec)·cos(RA), y = r·cos(Dec)·sin(RA), z = r·sin(Dec).
//   Right-handed equatorial frame.
// • Observer-frame parallax: stars at fixed heliocentric (RA, Dec, dist)
//   are translated by `pos - obs` and re-projected to (RA', Dec', dist').
// • Distance modulus: m = M + 5·log₁₀(d/10pc). Standard.
// • Gnomonic projection: x = (s·right)/(s·view), y = (s·up)/(s·view).
// • Stellar catalog: 178 named real stars from Hipparcos (public/exosky-
//   stars.json). Includes Sirius, Canopus, Arcturus, Vega, Polaris,
//   Betelgeuse, Rigel, Aldebaran, Antares, Spica, Deneb, Sol, etc.
//   Spot-checked: Sirius RA 101.287° / Dec −16.716° / 2.64 pc / Mv=−1.43
//   matches Hipparcos HIP 32349 exactly.
// • Proper motion (movement of stars over time) is NOT modeled, fine
//   for present-epoch sky views, drifts slightly over centuries.
// • Axial precession (the ~25,772-year wobble of an observer's rotational
//   axis) IS modeled via the EPOCH slider, see astro.ts's precessionMatrix
//   and applyPrecession. This changes which star sits near the pole; it
//   does not move any star relative to any other, which is what proper
//   motion (still unmodeled) would do.
// ═══════════════════════════════════════════════════════════════

const DEG = Math.PI / 180;
// ── ASTRONOMY MATHS ───────────────────────────────────────────
// Moved to lib/simulators/astro.ts and put under test. The header above claims
// this maths was validated; it now actually is, against the north galactic
// pole, Sagittarius A*, the distance modulus and known star separations.
// The duplicate definitions that used to sit here are gone, so there is one
// copy to be right rather than two to drift apart.
import {
  RAD,
  R_SUN,
  Z_SUN,
  DISK_SCALE_H,
  DISK_SCALE_Z,
  DUST_SCALE_Z,
  ARM_WIDTH,
  ARM_PITCH,
  BULGE_RADIUS,
  eqToGal,
  galToEq,
  raDecDistToXYZ,
  xyzToRaDec,
  eqXYZtoGalactocentric,
  apparentMag,
  bvToRGB,
  precessionMatrix,
} from "@/lib/simulators/astro";
import { describeHandoffPlanet, type HandoffPayload } from "@/lib/simulators/handoff";

// ── STAR CATALOG (lazy-loaded from /exosky-stars.json) ────────
// Format: [name, RA(°), Dec(°), dist(pc), absMag, B-V]
// ~180 brightest stars from Hipparcos, loaded lazily to reduce bundle size
// See public/exosky-stars.json (compact array format: [name,ra,dec,dist,absMag,bv])
let _starCatalogCache: Array<{name:string;ra:number;dec:number;dist:number;absMag:number;bv:number;isCatalog:true}> | null = null;
async function loadStarCatalog() {
  if (_starCatalogCache) return _starCatalogCache;
  const res = await fetch("/exosky-stars.json");
  const rows: [string,number,number,number,number,number][] = await res.json();
  _starCatalogCache = rows.map(([name,ra,dec,dist,absMag,bv]) => ({
    name, ra, dec, dist: Math.max(dist, 0.001), absMag, bv, isCatalog: true as const,
  }));
  return _starCatalogCache;
}

// Removed inline RAW_STARS + EXTRA_STARS (was ~7KB of template literals)
// ── SPIRAL ARM MODEL ──────────────────────────────────────────
// 4 logarithmic spiral arms + local spur
// Each arm defined by: initial angle (at reference radius), and color tint
const SPIRAL_ARMS = [
  { theta0: 0,      name: "Perseus",           boost: 1.0 },
  { theta0: Math.PI * 0.5,  name: "Sagittarius-Carina", boost: 1.2 },
  { theta0: Math.PI,       name: "Scutum-Centaurus",  boost: 1.1 },
  { theta0: Math.PI * 1.5, name: "Norma-Outer",       boost: 0.8 },
];
const REF_RADIUS = 4000; // Reference radius for spiral definition (pc)

function spiralArmAngle(R) {
  // Logarithmic spiral: theta = theta0 + ln(R/R_ref) / tan(pitch)
  return Math.log(Math.max(R, 100) / REF_RADIUS) / Math.tan(ARM_PITCH);
}

function nearestArmDistance(R, theta) {
  let minDist = Infinity;
  for (const arm of SPIRAL_ARMS) {
    const armAngle = arm.theta0 + spiralArmAngle(R);
    // Angular distance, wrapped
    let dTheta = theta - armAngle;
    dTheta = ((dTheta % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const arcDist = Math.abs(dTheta) * R; // Linear distance at this radius
    const weighted = arcDist / arm.boost;
    if (weighted < minDist) minDist = weighted;
  }
  return minDist;
}

// ── GALACTIC DENSITY MODEL ────────────────────────────────────
function galacticDensity(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;

  // Base exponential disk
  let density = Math.exp(-R / DISK_SCALE_H) * Math.exp(-Math.abs(z) / DISK_SCALE_Z);

  // Spiral arm enhancement
  const theta = Math.atan2(gcY, gcX);
  const armDist = nearestArmDistance(R, theta);
  const armFactor = 1.0 + 2.5 * Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 2));
  density *= armFactor;

  // Galactic bulge
  const bulgeR = Math.sqrt(R * R + z * z * 4); // Oblate
  density += 3.0 * Math.exp(-(bulgeR * bulgeR) / (BULGE_RADIUS * BULGE_RADIUS));

  return density;
}

function dustExtinction(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;
  return Math.exp(-R / (DISK_SCALE_H * 1.2)) * Math.exp(-Math.abs(z) / DUST_SCALE_Z) * 0.5;
}

// ── MILKY WAY BRIGHTNESS MAP ──────────────────────────────────
// Pre-compute brightness for each (l, b) direction from observer
// Returns Float32Array indexed by [l_index * B_STEPS + b_index]
const L_STEPS = 360; // 1° resolution in longitude
const B_STEPS = 180;  // 1° resolution in latitude
const RAY_STEPS = 40; // Integration steps per ray
const RAY_MAX = 15000; // Max distance (pc)

function computeMilkyWayMap(obsGCx, obsGCy, obsGCz) {
  const map = new Float32Array(L_STEPS * B_STEPS);
  const dustMap = new Float32Array(L_STEPS * B_STEPS);

  for (let li = 0; li < L_STEPS; li++) {
    const l = (li / L_STEPS) * 2 * Math.PI; // galactic longitude from observer
    for (let bi = 0; bi < B_STEPS; bi++) {
      const b = ((bi / B_STEPS) - 0.5) * Math.PI; // galactic latitude from observer

      const cosB = Math.cos(b);
      // Direction in galactocentric frame
      // From observer, l=0 points toward galactic center (approximately)
      // We need the actual direction. The observer's galactic longitude defines
      // the offset from the GC center direction.
      const obsR = Math.sqrt(obsGCx * obsGCx + obsGCy * obsGCy);
      const obsTheta = Math.atan2(obsGCy, obsGCx);

      // Direction in GC frame: l=0 should point toward GC center from observer
      // Radial inward direction from observer
      const dirTheta = obsTheta + Math.PI + l; // l=0 toward center, l increases CCW
      const dx = cosB * Math.cos(dirTheta);
      const dy = cosB * Math.sin(dirTheta);
      const dz = Math.sin(b);

      let brightness = 0;
      let cumDust = 0;

      for (let s = 1; s <= RAY_STEPS; s++) {
        const t = (s / RAY_STEPS) * RAY_MAX;
        const px = obsGCx + dx * t;
        const py = obsGCy + dy * t;
        const pz = obsGCz + dz * t;

        const R = Math.sqrt(px*px + py*py);
        if (R > 20000 || Math.abs(pz) > 5000) continue;

        const d = galacticDensity(px, py, pz);
        const dust = dustExtinction(px, py, pz);
        cumDust += dust * (RAY_MAX / RAY_STEPS) * 0.0001;

        const attenuation = Math.exp(-cumDust);
        brightness += d * attenuation * (RAY_MAX / RAY_STEPS) * 0.00004;
      }

      map[li * B_STEPS + bi] = Math.min(brightness, 1.0);
      dustMap[li * B_STEPS + bi] = Math.min(cumDust, 1.0);
    }
  }
  return { brightness: map, dust: dustMap };
}

// Bilinear interpolation for smooth MW map sampling
function sampleMWMap(map, l, b) {
  // l in [0, 2π), b in [-π/2, π/2]
  const lNorm = ((l % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const lf = (lNorm / (2 * Math.PI)) * L_STEPS;
  const bf = ((b / Math.PI) + 0.5) * B_STEPS;

  const l0 = Math.floor(lf) % L_STEPS;
  const l1 = (l0 + 1) % L_STEPS;
  const b0 = Math.max(0, Math.min(B_STEPS - 1, Math.floor(bf)));
  const b1 = Math.min(B_STEPS - 1, b0 + 1);

  const lt = lf - Math.floor(lf);
  const bt = bf - Math.floor(bf);

  const v00 = map[l0 * B_STEPS + b0];
  const v10 = map[l1 * B_STEPS + b0];
  const v01 = map[l0 * B_STEPS + b1];
  const v11 = map[l1 * B_STEPS + b1];

  return (v00 * (1 - lt) * (1 - bt) + v10 * lt * (1 - bt) +
          v01 * (1 - lt) * bt + v11 * lt * bt);
}

// ── PROCEDURAL GALACTIC STARS ─────────────────────────────────
function generateProceduralStars(count, seed) {
  const stars = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 7) % 2147483647; return s / 2147483647; };

  for (let i = 0; i < count; i++) {
    // Generate in galactocentric coordinates with realistic distribution
    const R = 1000 + rand() * 14000; // galactocentric radius
    const theta = rand() * 2 * Math.PI;

    // Prefer positions near spiral arms
    const armDist = nearestArmDistance(R, theta);
    const armProb = Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 4));
    if (rand() > 0.45 + 0.55 * armProb) { i--; continue; } // Rejection sampling (relaxed)

    const z = (rand() - 0.5) * 2 * DISK_SCALE_Z * (0.5 + rand()); // Vertical scatter
    const gcX = R * Math.cos(theta);
    const gcY = R * Math.sin(theta);
    const gcZ = z;

    // Convert to heliocentric equatorial
    const helioGalX = R_SUN - gcX; // Sun-centered galactic x (toward GC)
    const helioGalY = -gcY;
    const helioGalZ = gcZ - Z_SUN;
    const [eqX, eqY, eqZ] = galToEq(helioGalX, helioGalY, helioGalZ);

    const dist = Math.sqrt(eqX*eqX + eqY*eqY + eqZ*eqZ);
    if (dist < 3 || dist > 8000) continue; // Wider distance range

    const { ra, dec } = xyzToRaDec(eqX, eqY, eqZ);

    // Random stellar properties (weighted toward dimmer stars)
    const magRoll = rand();
    let absMag, bvColor;
    if (magRoll < 0.01)      { absMag = -4 + rand() * 3; bvColor = -0.2 + rand() * 0.3; }  // Bright giants
    else if (magRoll < 0.05) { absMag = -1 + rand() * 3; bvColor = -0.1 + rand() * 0.8; }  // Giants
    else if (magRoll < 0.15) { absMag = 1 + rand() * 3;  bvColor = 0.0 + rand() * 1.0; }   // Bright MS
    else if (magRoll < 0.40) { absMag = 3 + rand() * 3;  bvColor = 0.3 + rand() * 1.0; }   // Mid MS
    else                     { absMag = 5 + rand() * 5;  bvColor = 0.6 + rand() * 1.2; }    // Dim MS / red dwarfs

    const appMag = apparentMag(absMag, dist);
    if (appMag > 8.5) continue; // Relaxed filter - let more faint stars through

    stars.push({
      name: null,
      ra, dec, dist, absMag, bv: Math.min(2.0, bvColor),
      isCatalog: false,
    });
  }
  return stars;
}

// ── DENSE BACKGROUND STAR FIELD ───────────────────────────────
// These are NOT individually resolved, they're the "powdered sugar"
// of thousands of faint, distant stars that create sky density.
// Concentrated heavily along galactic plane for MW band reinforcement.
function generateBackgroundField(count, seed) {
  const points = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 7) % 2147483647; return s / 2147483647; };

  for (let i = 0; i < count; i++) {
    // Generate in galactic coordinates, heavily concentrated on plane
    // Galactic latitude: exponential concentration toward b=0
    const u = rand();
    const galB = (Math.random < 0.5 ? 1 : -1) * Math.pow(rand(), 0.3) * 90; // Degrees, concentrated near 0
    // Actually use a proper distribution:
    const bSign = rand() < 0.5 ? 1 : -1;
    // 70% within ±12° of plane, 20% within ±30°, 10% everywhere
    const bRoll = rand();
    let bDeg;
    if (bRoll < 0.50) bDeg = bSign * rand() * 8;          // Dense plane core
    else if (bRoll < 0.75) bDeg = bSign * (8 + rand() * 15); // Plane halo
    else if (bRoll < 0.90) bDeg = bSign * (15 + rand() * 25); // Scattered
    else bDeg = bSign * rand() * 85;                          // Everywhere (sparse)

    const galL = rand() * 360; // Uniform in longitude

    // Slight density boost toward galactic center (l ~ 0°)
    const lRad = galL * DEG;
    const centerBoost = 0.6 + 0.4 * Math.exp(-Math.pow(Math.min(galL, 360 - galL), 2) / (60 * 60));
    if (rand() > centerBoost) { i--; continue; }

    // Spiral arm boost for longitude: sample MW map if available
    // (We'll apply this at render time instead for observer-relativity)

    // Convert galactic (l, b) to equatorial (RA, Dec) for storage
    const bRad = bDeg * DEG;
    const cosB = Math.cos(bRad);
    const gx = cosB * Math.cos(lRad);
    const gy = cosB * Math.sin(lRad);
    const gz = Math.sin(bRad);
    const [eqX, eqY, eqZ] = galToEq(gx, gy, gz);
    const dec = Math.asin(Math.max(-1, Math.min(1, eqZ))) * RAD;
    let ra = Math.atan2(eqY, eqX) * RAD;
    if (ra < 0) ra += 360;

    // Brightness: mostly very faint, some moderate
    const magRoll = rand();
    let baseMag;
    if (magRoll < 0.05) baseMag = 3.5 + rand() * 1.5;       // Moderately bright
    else if (magRoll < 0.20) baseMag = 4.5 + rand() * 1.0;   // Faint-visible
    else if (magRoll < 0.50) baseMag = 5.2 + rand() * 1.0;   // Barely visible
    else baseMag = 5.8 + rand() * 1.5;                        // Sub-threshold shimmer

    // Color: slight warm bias along plane (more distant red giants mixed in)
    const bv = 0.2 + rand() * 1.3;

    points.push({ ra, dec, galL, galB: bDeg, baseMag, bv });
  }
  return points;
}

// ── EXOPLANET SYSTEMS ─────────────────────────────────────────
const EXOPLANET_SYSTEMS = [
  // ── CONFIRMED EXOPLANETS (nearby) ─────────────────────
  { star:"Proxima Centauri", planet:"Proxima Centauri b", ra:217.429, dec:-62.680, dist:1.301, atmoType:"thin_co2", atmoDesc:"Thin CO₂, possible N₂", note:"Nearest exoplanet. M-dwarf → red-tinted sky.", armNote:"Local Bubble / Orion Spur" },
  { star:"TRAPPIST-1", planet:"TRAPPIST-1e", ra:346.622, dec:-5.041, dist:12.43, atmoType:"earth_like", atmoDesc:"Possible N₂/O₂/H₂O", note:"Habitable zone, ultra-cool dwarf host.", armNote:"Local Bubble" },
  { star:"TRAPPIST-1", planet:"TRAPPIST-1f", ra:346.622, dec:-5.041, dist:12.43, atmoType:"thick_co2", atmoDesc:"Likely thicker CO₂-rich", note:"Outer HZ. Amber-hued skies.", armNote:"Local Bubble" },
  { star:"Tau Ceti", planet:"Tau Ceti e", ra:26.017, dec:-15.937, dist:3.65, atmoType:"earth_like", atmoDesc:"N₂/CO₂ mix, possible H₂O vapor", note:"Sun-like host. Familiar constellations slightly shifted.", armNote:"Local Bubble" },
  { star:"Ross 128", planet:"Ross 128 b", ra:176.937, dec:0.799, dist:3.37, atmoType:"thin_n2", atmoDesc:"Possibly thin N₂ envelope", note:"Quiet M-dwarf, low UV.", armNote:"Local Bubble" },
  { star:"Luyten's Star", planet:"Luyten b", ra:109.998, dec:5.228, dist:3.72, atmoType:"earth_like", atmoDesc:"Possible temperate atmosphere", note:"Red dwarf, 12 ly.", armNote:"Local Bubble" },
  { star:"Teegarden's Star", planet:"Teegarden b", ra:43.254, dec:16.878, dist:3.83, atmoType:"thin_co2", atmoDesc:"Possible thin CO₂/N₂ mix", note:"Ultracool dwarf. IR-dominated.", armNote:"Local Bubble" },
  { star:"GJ 1061", planet:"GJ 1061 d", ra:53.374, dec:-44.511, dist:3.67, atmoType:"thin_n2", atmoDesc:"Speculative thin atmosphere", note:"Faint M-dwarf, 12 ly.", armNote:"Local Bubble" },
  { star:"Kapteyn's Star", planet:"Kapteyn b", ra:77.898, dec:-44.960, dist:3.91, atmoType:"thin_co2", atmoDesc:"Ancient, minimal atmosphere", note:"~11 Gyr old system.", armNote:"Local Bubble" },
  { star:"Wolf 1061", planet:"Wolf 1061 c", ra:248.412, dec:-12.661, dist:4.31, atmoType:"thick_co2", atmoDesc:"Possibly thick CO₂ (super-Venus)", note:"Dense, hazy world.", armNote:"Local Bubble" },
  { star:"Gliese 667 C", planet:"Gliese 667 Cc", ra:259.755, dec:-34.995, dist:7.24, atmoType:"earth_like", atmoDesc:"Possible N₂/CO₂/H₂O mix", note:"Triple star system.", armNote:"Local Bubble" },
  { star:"HD 40307", planet:"HD 40307 g", ra:89.496, dec:-60.022, dist:12.83, atmoType:"thick_n2", atmoDesc:"Super-Earth, dense N₂/H₂O", note:"K-dwarf. Warm orange sun.", armNote:"Local Bubble" },
  { star:"55 Cancri", planet:"55 Cancri e", ra:133.149, dec:28.330, dist:12.34, atmoType:"exotic", atmoDesc:"Lava world, silicate vapor / Na", note:"Ultra-hot super-Earth.", armNote:"Local Bubble" },
  { star:"Epsilon Eridani", planet:"Epsilon Eridani b", ra:53.233, dec:-9.458, dist:3.22, atmoType:"gas_giant", atmoDesc:"H₂/He, viewing from moon", note:"Young system, 10.5 ly. Sol is bright.", armNote:"Local Bubble" },
  { star:"Barnard's Star", planet:"Barnard b (candidate)", ra:269.452, dec:4.693, dist:1.834, atmoType:"thin_n2", atmoDesc:"Speculative thin N₂", note:"Second-closest star system. 6 ly. High proper motion.", armNote:"Local Bubble" },
  { star:"Pollux", planet:"Pollux b (Thestias)", ra:116.329, dec:28.026, dist:10.36, atmoType:"gas_giant", atmoDesc:"H₂/He, viewing from moon", note:"Giant star with confirmed planet. 34 ly. Orange sky.", armNote:"Local Bubble" },
  { star:"51 Pegasi", planet:"51 Pegasi b (Dimidium)", ra:344.367, dec:20.769, dist:15.36, atmoType:"gas_giant", atmoDesc:"Hot Jupiter, viewing from orbit", note:"First confirmed exoplanet (1995). 50 ly.", armNote:"Local Bubble" },
  { star:"Beta Pictoris", planet:"Beta Pictoris b", ra:86.821, dec:-51.066, dist:19.44, atmoType:"gas_giant", atmoDesc:"Young gas giant, from moon", note:"Young system with debris disk. 63 ly.", armNote:"Local Bubble" },
  { star:"HR 8799", planet:"HR 8799 e", ra:346.870, dec:21.134, dist:39.4, atmoType:"gas_giant", atmoDesc:"Directly imaged giant, from moon", note:"4-planet system, directly imaged. 129 ly.", armNote:"Local Bubble" },
  // ── DISTANT CONFIRMED PLANETS ─────────────────────────
  { star:"Kepler-186", planet:"Kepler-186f", ra:295.015, dec:43.842, dist:178.5, atmoType:"earth_like", atmoDesc:"First Earth-sized HZ planet", note:"~580 ly. Constellations reshuffled.", armNote:"Orion Spur / Perseus edge" },
  { star:"Kepler-442", planet:"Kepler-442b", ra:294.164, dec:39.247, dist:342, atmoType:"earth_like", atmoDesc:"Possible thick N₂/O₂", note:"~1,100 ly. Deep in Perseus Arm.", armNote:"Perseus Arm" },
  { star:"Kepler-452", planet:"Kepler-452b", ra:286.803, dec:44.265, dist:556, atmoType:"thick_n2", atmoDesc:"Super-Earth, likely thick atmo", note:"\"Earth's cousin.\" 1,800 ly. Alien sky.", armNote:"Perseus Arm" },
  // ── FAMOUS STARS (hypothetical moon/planet) ───────────
  { star:"Canopus", planet:"Canopus (hypothetical)", ra:95.988, dec:-52.696, dist:95, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"F-type supergiant, 310 ly. Milky Way band shifted dramatically.", armNote:"Orion Spur" },
  { star:"Vega", planet:"Vega (hypothetical)", ra:279.235, dec:38.784, dist:7.68, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Young A-type star, 25 ly. Pole star ~12,000 AD from Earth.", armNote:"Local Bubble" },
  { star:"Sirius", planet:"Sirius (hypothetical)", ra:101.287, dec:-16.716, dist:2.64, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Brightest star from Earth, 8.6 ly. Sol still visible nearby.", armNote:"Local Bubble" },
  { star:"Betelgeuse", planet:"Betelgeuse (hypothetical)", ra:88.793, dec:7.407, dist:197, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Red supergiant, 643 ly. Deep in Orion Arm. Radically alien sky.", armNote:"Orion Arm" },
  { star:"Alpha Centauri A", planet:"α Centauri (hypothetical)", ra:219.902, dec:-60.834, dist:1.34, atmoType:"earth_like", atmoDesc:"Hypothetical Earth-like", note:"Closest Sun-like star, 4.37 ly. Nearly identical constellations.", armNote:"Local Bubble" },
  { star:"Fomalhaut", planet:"Fomalhaut (hypothetical)", ra:344.413, dec:-29.622, dist:7.70, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Young A-type star with debris ring, 25 ly.", armNote:"Local Bubble" },
  { star:"Deneb", planet:"Deneb (hypothetical)", ra:310.358, dec:45.280, dist:802, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Blue supergiant, ~2,600 ly. Deep Perseus Arm. Unrecognizable constellations.", armNote:"Perseus Arm" },
  { star:"Arcturus", planet:"Arcturus (hypothetical)", ra:213.915, dec:19.182, dist:11.26, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Red giant, 37 ly. Halo star on different galactic orbit.", armNote:"Local Bubble" },
  { star:"Antares", planet:"Antares (hypothetical)", ra:247.352, dec:-26.432, dist:169, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Red supergiant, 550 ly. Heart of Scorpius. Milky Way center closer.", armNote:"Sagittarius Arm edge" },
  { star:"Aldebaran", planet:"Aldebaran (hypothetical)", ra:68.980, dec:16.509, dist:20.43, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Orange giant, 65 ly. In the Hyades stream. Subtle constellation shifts.", armNote:"Local Bubble" },
  { star:"Rigel", planet:"Rigel (hypothetical)", ra:78.634, dec:-8.202, dist:264, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Blue supergiant, 860 ly. Orion Arm interior. Dramatic parallax.", armNote:"Orion Arm" },
  { star:"Spica", planet:"Spica (hypothetical)", ra:201.298, dec:-11.161, dist:77, atmoType:"none", atmoDesc:"No atmosphere, vacuum observation", note:"Binary blue giant, 250 ly. Virgo cluster foreground.", armNote:"Orion Spur" },
];

const ATMO_MODELS = {
  none:       { name:"No Atmosphere",    skyColor:[0,0,0],     extinction:0,    haze:0,    desc:"Vacuum, raw starlight" },
  thin_n2:    { name:"Thin N₂",          skyColor:[5,8,18],    extinction:0.08, haze:0.05, desc:"Faint indigo wash near horizon" },
  thin_co2:   { name:"Thin CO₂",         skyColor:[18,10,5],   extinction:0.12, haze:0.08, desc:"Pale butterscotch horizon glow" },
  earth_like: { name:"Earth-like N₂/O₂", skyColor:[8,14,32],   extinction:0.18, haze:0.12, desc:"Deep blue Rayleigh scattering" },
  thick_n2:   { name:"Dense N₂",         skyColor:[10,18,42],  extinction:0.30, haze:0.22, desc:"Deep azure, many dim stars lost" },
  thick_co2:  { name:"Dense CO₂",        skyColor:[35,20,8],   extinction:0.35, haze:0.28, desc:"Amber-orange haze, limited visibility" },
  gas_giant:  { name:"H₂/He (moon)",     skyColor:[12,15,22],  extinction:0.10, haze:0.06, desc:"Pale steel-blue, hydrogen scattering" },
  exotic:     { name:"Exotic/Silicate",   skyColor:[30,12,15],  extinction:0.45, haze:0.35, desc:"Ruddy haze, volcanic particulates" },
};

// ── CONSTELLATION LINES ───────────────────────────────────────
const CONSTELLATION_LINES = [
  ["Betelgeuse","Bellatrix"],["Betelgeuse","Alnilam"],["Bellatrix","Alnilam"],
  ["Alnilam","Alnitak"],["Alnilam","Mintaka"],["Alnitak","Saiph"],["Mintaka","Rigel"],
  ["Rigel","Saiph"],["Betelgeuse","Saiph"],["Bellatrix","Rigel"],
  ["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Alioth"],
  ["Alioth","Mizar"],["Mizar","Alkaid"],["Phecda","Dubhe"],
  ["Antares","Dschubba"],["Antares","Larawag"],["Antares","Shaula"],["Shaula","Girtab"],["Dschubba","Girtab"],
  ["Schedar","Ruchbah"],
  ["Regulus","Denebola"],["Regulus","Zosma"],["Zosma","Denebola"],
  ["Markab","Scheat"],["Scheat","Alpheratz"],["Alpheratz","Algenib"],["Algenib","Markab"],
  ["Vega","Deneb"],["Deneb","Altair"],["Altair","Vega"],
  ["Sirius","Adhara"],["Sirius","Mirzam"],["Adhara","Wezen"],
  ["Castor","Pollux"],["Castor","Alhena"],["Pollux","Alhena"],
  ["Acrux","Mimosa"],
  ["Spica","Arcturus"],
  ["Aldebaran","Elnath"],
  ["Capella","Menkalinan"],
  ["Polaris","Kochab"],
  ["Fomalhaut","Diphda"],
];

// ── PROJECTION ────────────────────────────────────────────────
function projectStar(ra, dec, viewRa, viewDec, fov, W, H, margin) {
  const m = margin !== undefined ? margin : 80;
  const sRa = ra * DEG, sDec = dec * DEG, vRa = viewRa * DEG, vDec = viewDec * DEG;
  const sx = Math.cos(sDec)*Math.cos(sRa), sy = Math.cos(sDec)*Math.sin(sRa), sz = Math.sin(sDec);
  const vx = Math.cos(vDec)*Math.cos(vRa), vy = Math.cos(vDec)*Math.sin(vRa), vz = Math.sin(vDec);
  const cosA = sx*vx + sy*vy + sz*vz;
  if (cosA < -0.05) return null;
  const ux = -Math.sin(vDec)*Math.cos(vRa), uy = -Math.sin(vDec)*Math.sin(vRa), uz = Math.cos(vDec);
  const rx = -Math.sin(vRa), ry = Math.cos(vRa), rz = 0;
  const dx = sx-vx, dy = sy-vy, dz = sz-vz;
  const lx = dx*rx + dy*ry + dz*rz;
  const ly = dx*ux + dy*uy + dz*uz;
  const scale = W / (2 * Math.tan(fov * DEG / 2));
  const px = lx / cosA * scale, py = -ly / cosA * scale;
  const screenX = W/2 + px, screenY = H/2 + py;
  if (screenX < -m || screenX > W+m || screenY < -m || screenY > H+m) return null;
  return { x: screenX, y: screenY };
}

// ── BACKGROUND FIELD SPATIAL BUCKET CONSTANTS ─────────────────
const BG_RA_BINS = 12;   // 30° per bin in RA
const BG_DEC_BINS = 6;   // 30° per bin in Dec

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
/** A vantage seeded from a Solaris handoff: the wrapper has already turned
    `planetAU` into a galactic l/b/distance (see ExoskySimulator.tsx's
    deriveExoskySeed), so this component only has to apply it. */
interface ExoSkyInitialHandoff {
  payload: HandoffPayload;
  galL: number;
  galB: number;
  distPc: number;
}

interface ExoSkyV2Props {
  /** When true, the wrapper page's NarrativeBridgePanel is open and
      occupies 320px of the right edge. The data readout slides left
      to avoid the overlap. Defaults to false. */
  narrativeBridgeOpen?: boolean;
  /** When the simulator is rendered inside a world context, planet/star/
      moon entities from that world become selectable as observation
      points (alongside the curated EXOPLANET_SYSTEMS list). */
  worldId?: string;
  /** Present when the page was opened via `?handoff=` from Solaris. Seeds
      the existing custom-coordinates vantage (the same one the "AUTHOR
      COORDINATES" button turns on) on first mount, rather than adding a
      second vantage mechanism next to it. */
  initialHandoff?: ExoSkyInitialHandoff | null;
  /** Called once the mount-time handoff seed above has actually been
      applied to state. The wrapper uses this to strip `?handoff=` from the
      URL only after the seed has landed, not before: clearing it earlier
      risks the wrapper re-rendering with a null `initialHandoff` prop before
      this (possibly still-loading, since it's lazy-imported) component ever
      reads the original value. */
  onHandoffConsumed?: () => void;
}

export default function ExoSkyV2({
  narrativeBridgeOpen = false,
  initialHandoff = null,
  worldId,
  onHandoffConsumed,
}: ExoSkyV2Props = {}) {
  const { toast } = useToast();
  const { data: worldEntities } = useEntities(worldId);
  const updateEntity = useUpdateEntity(worldId);

  // Filter to spatial entities (planet/star/moon), those are what an
  // observer can stand on or near. Each entity may have galactic
  // coordinates stashed in metadata.exoskyCoords; if missing we
  // surface a "Set coordinates" prompt.
  const worldObservationEntities = useMemo(() => {
    if (!worldEntities) return [];
    return worldEntities.filter(
      (e) => e.entity_type === "planet" || e.entity_type === "star" || e.entity_type === "moon",
    );
  }, [worldEntities]);
  const canvasRef = useRef(null);
  const mwOffscreenRef = useRef(null); // Offscreen MW canvas for pre-rendered band
  /**
   * What the cached Milky Way bitmap was drawn for.
   *
   * Typed explicitly because the inferred shape came from the initial value and
   * omitted every field the redraw check actually compares, so each one was a
   * type error that the baseline simply carried.
   */
  const mwParamsRef = useRef<{
    viewRa: number;
    viewDec: number;
    fov: number;
    planetKey: string;
    W?: number;
    H?: number;
    mwBrightness?: number;
    showAtmosphere?: boolean;
    atmoDensity?: number;
    /** Sample-step multiplier, so settling from a drag triggers the fine pass. */
    quality?: number;
    /** Epoch, so the band actually redraws when the precession slider moves. */
    epochYears?: number;
  }>({ viewRa: -1, viewDec: -1, fov: -1, planetKey: "" });
  const animRef = useRef(null);
  const [selectedPlanet, setSelectedPlanet] = useState(0);
  const [viewRa, setViewRa] = useState(180);
  const [viewDec, setViewDec] = useState(10);
  const [fov, setFov] = useState(90);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [showStarNames, setShowStarNames] = useState(false);
  const [showHorizon, setShowHorizon] = useState(true);
  const { dismissedIds: dismissedFlagIds, dismiss: dismissFlag } = useDismissedFlags();
  const [highlightSol, setHighlightSol] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [atmoDensity, setAtmoDensity] = useState(1.0);
  const [mwBrightness, setMwBrightness] = useState(1.0);
  /**
   * Years from J2000 (now), driving axial precession of the observer's own
   * sky. Zero is "now" and must be a true no-op (see astro.ts's
   * applyPrecession/precessionMatrix): the identity property is what keeps
   * this slider from being a silent regression for every writer who never
   * touches it. Range is a half-cycle either way (~25,772 yr full period),
   * enough to visibly move the pole without claiming precision this model
   * doesn't have at the tens-of-thousands-of-years scale.
   */
  const [epochYears, setEpochYears] = useState(0);
  /**
   * Two 272-320px panels, both defaulting open, were built for a wide screen.
   * At 390px they don't fit side by side (18+272 overlaps 390-18-320) and
   * together they measured covering 345% of the viewport by area, so the
   * simulation they control was invisible while using them. Collapsed by
   * default on mobile keeps the canvas visible on first load; the stacked,
   * height-capped positions below keep them apart if the writer opens both.
   */
  const isMobile = useIsMobile();
  const [panelOpen, setPanelOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);
  const mobileDefaultsApplied = useRef(false);
  useEffect(() => {
    if (isMobile && !mobileDefaultsApplied.current) {
      mobileDefaultsApplied.current = true;
      setPanelOpen(false);
      setDataOpen(false);
    }
  }, [isMobile]);
  const [mwReady, setMwReady] = useState(false);

  // ── Refs for view during drag (avoids re-renders per mousemove) ──
  const viewRaRef = useRef(180);
  const viewDecRef = useRef(10);
  const fovRef = useRef(90);

  // ── Refs for render toggle states (stabilises render callback) ──
  const showConstellationsRef = useRef(true);
  const showAtmosphereRef = useRef(true);
  const showGridRef = useRef(false);
  const showMilkyWayRef = useRef(true);
  const showStarNamesRef = useRef(false);
  const showHorizonRef = useRef(true);
  const highlightSolRef = useRef(true);
  const showCustomConstellationsRef = useRef(true);
  const atmoDensityRef = useRef(1.0);
  const mwBrightnessRef = useRef(1.0);
  const drawModeRef = useRef(false);
  const currentDrawingRef = useRef([]);
  const customConstellationsRef = useRef([]);
  const drawColorRef = useRef("#FFA500");
  const hoveredStarRef = useRef(null);
  const epochYearsRef = useRef(0);

  // ── Constellation Drawing State ─────────────────────
  const [drawMode, setDrawMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState([]); // Stars in current constellation being drawn
  const [customConstellations, setCustomConstellations] = useState([]); // Completed constellations
  const [showCustomConstellations, setShowCustomConstellations] = useState(true);
  const [drawColor, setDrawColor] = useState("#FFA500");
  const [namingMode, setNamingMode] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [consManagerOpen, setConsManagerOpen] = useState(false);
  const [showKbHelp, setShowKbHelp] = useState(false);

  // ── Lazy star catalog ──────────────────────────────
  const [starCatalog, setStarCatalog] = useState<typeof _starCatalogCache>([]);
  useEffect(() => { loadStarCatalog().then(setStarCatalog); }, []);

  // ── Custom Location State ─────────────────────────
  const [customMode, setCustomMode] = useState(false);
  const [customGalL, setCustomGalL] = useState(0);
  const [customGalB, setCustomGalB] = useState(0);
  const [customDistPc, setCustomDistPc] = useState(100);

  // Set only when the current custom-mode vantage came from a Solaris
  // handoff, so the "planet" derivation below can label and note it
  // honestly instead of showing the generic "Custom (l=..., b=...)" text.
  const [handoffPayload, setHandoffPayload] = useState<HandoffPayload | null>(null);

  // Seed the custom-coordinates vantage from a Solaris handoff on first
  // mount. This is the same mechanism the "AUTHOR COORDINATES" button
  // turns on (setCustomMode(true) + the three custom* sliders); a handoff
  // just sets those sliders programmatically instead of waiting for a click.
  useEffect(() => {
    if (!initialHandoff) return;
    setCustomMode(true);
    setCustomGalL(initialHandoff.galL);
    setCustomGalB(initialHandoff.galB);
    setCustomDistPc(initialHandoff.distPc);
    setHandoffPayload(initialHandoff.payload);
    onHandoffConsumed?.();
    // Mount-only: a handoff seeds the initial view once, it does not keep
    // re-applying itself if the writer then adjusts the sliders by hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── World-Entity Observation State ────────────────
  // When the user selects a planet/star/moon from their own world, we read
  // its metadata.exoskyCoords (if present) and put the simulator in
  // "world-entity mode". If the entity has no coords yet, we show a
  // hint to author them via the custom-coordinate UI; the user can then
  // press "Save to entity" to persist back via useUpdateEntity.
  const [worldEntityId, setWorldEntityId] = useState<string | null>(null);
  const worldEntity = useMemo(
    () => worldObservationEntities.find((e) => e.id === worldEntityId) ?? null,
    [worldObservationEntities, worldEntityId],
  );
  const worldEntityCoords = useMemo(() => {
    if (!worldEntity) return null;
    const meta = (worldEntity.metadata ?? {}) as Record<string, unknown>;
    const c = meta.exoskyCoords as { ra?: number; dec?: number; distancePc?: number } | undefined;
    if (!c || typeof c.ra !== "number" || typeof c.dec !== "number" || typeof c.distancePc !== "number") {
      return null;
    }
    return { ra: c.ra, dec: c.dec, distancePc: c.distancePc };
  }, [worldEntity]);

  // ── Hover detection throttle ref ──
  const lastHoverCheckRef = useRef(0);

  const DRAW_COLORS = [
    { hex:"#FFA500", name:"Amber" },
    { hex:"#FF6B8A", name:"Rose" },
    { hex:"#2ECC71", name:"Emerald" },
    { hex:"#9B59B6", name:"Violet" },
    { hex:"#FFD43B", name:"Gold" },
    { hex:"#E74C3C", name:"Coral" },
    { hex:"#1ABC9C", name:"Teal" },
    { hex:"#FFFFFF", name:"White" },
  ];

  const isDragging = useRef(false);
  const lastMouse = useRef({ x:0, y:0 });
  const pointerDownPos = useRef({ x:0, y:0 }); // For click detection
  const activePointers = useRef(new Map()); // For pinch-to-zoom
  const lastPinchDist = useRef(0);
  const starPositions = useRef([]);
  const mwMapRef = useRef(null);

  // ── Sync state → refs for render loop access ──────────
  viewRaRef.current = viewRa;
  viewDecRef.current = viewDec;
  fovRef.current = fov;
  showConstellationsRef.current = showConstellations;
  showAtmosphereRef.current = showAtmosphere;
  showGridRef.current = showGrid;
  showMilkyWayRef.current = showMilkyWay;
  showStarNamesRef.current = showStarNames;
  showHorizonRef.current = showHorizon;
  highlightSolRef.current = highlightSol;
  showCustomConstellationsRef.current = showCustomConstellations;
  atmoDensityRef.current = atmoDensity;
  mwBrightnessRef.current = mwBrightness;
  drawModeRef.current = drawMode;
  currentDrawingRef.current = currentDrawing;
  customConstellationsRef.current = customConstellations;
  drawColorRef.current = drawColor;
  hoveredStarRef.current = hoveredStar;
  epochYearsRef.current = epochYears;

  const planet = useMemo(() => {
    // World-entity mode: prefer this when an entity is picked AND has stored coords.
    if (worldEntity && worldEntityCoords) {
      return {
        star: worldEntity.name,
        planet: `${worldEntity.name} (from your world)`,
        ra: worldEntityCoords.ra,
        dec: worldEntityCoords.dec,
        dist: worldEntityCoords.distancePc,
        atmoType: "none",
        atmoDesc: "No atmosphere, vacuum observation",
        note: worldEntity.summary || `${worldEntity.entity_type} from your world. Coordinates stored on this entity.`,
        armNote: "Linked to your world",
      };
    }
    if (!customMode) return EXOPLANET_SYSTEMS[selectedPlanet];
    const l = customGalL * DEG, b = customGalB * DEG, dist = Math.max(0.01, customDistPc);
    const gx = dist * Math.cos(b) * Math.cos(l);
    const gy = dist * Math.cos(b) * Math.sin(l);
    const gz = dist * Math.sin(b);
    const [ex, ey, ez] = galToEq(gx, gy, gz);
    const rd = xyzToRaDec(ex, ey, ez);
    if (handoffPayload) {
      // Sibling vantages ("Custom", line below) capitalize; matching that so
      // describeHandoffPlanet's sentence, and this label, do not open mid-word.
      const starLabel = handoffPayload.starType.charAt(0).toUpperCase() + handoffPayload.starType.slice(1);
      return {
        star: starLabel,
        planet: `${handoffPayload.planetName} (from Solaris)`,
        ra: rd.ra, dec: rd.dec, dist,
        atmoType: "none", atmoDesc: "No atmosphere, vacuum observation",
        note: `${describeHandoffPlanet(handoffPayload)} Distance (${dist.toFixed(0)} pc) and galactic position shown here are synthesized placeholders spread across the sky so handoffs do not collide, not part of the handoff itself.`,
        armNote: "Handoff from Solaris",
      };
    }
    return {
      star: "Custom", planet: `Custom (l=${customGalL.toFixed(1)}°, b=${customGalB.toFixed(1)}°)`,
      ra: rd.ra, dec: rd.dec, dist,
      atmoType: "none", atmoDesc: "No atmosphere, vacuum observation",
      note: `Galactic coords: l=${customGalL.toFixed(1)}°, b=${customGalB.toFixed(1)}°, d=${dist.toFixed(1)} pc (${(dist*3.262).toFixed(1)} ly)`,
      armNote: "Custom location",
    };
  }, [customMode, selectedPlanet, customGalL, customGalB, customDistPc, worldEntity, worldEntityCoords, handoffPayload]);

  // ── Persistence bridge ──────────────────────────────────
  // The wrapper page speaks STELLARFORGE_* over window events for component
  // simulators (see useSimulationSave). Nothing here was listening, so Save,
  // Load and Publish were all silent no-ops: requestSave dispatched
  // REQUEST_STATE, no SAVE came back, and pendingPayload stayed null.
  useEffect(() => {
    const onRequestState = () => {
      const payload = toExoskyPayload({
        mode: worldEntity && worldEntityCoords ? "entity" : customMode ? "custom" : "catalog",
        starName: planet.star,
        planetName: planet.planet,
        distPc: planet.dist,
        armNote: planet.armNote,
        atmoDesc: planet.atmoDesc,
        galacticL: customMode ? customGalL : undefined,
        galacticB: customMode ? customGalB : undefined,
        viewRa, viewDec, fov,
        epochYears,
        showConstellations, showAtmosphere, showGrid,
        showMilkyWay, showStarNames, showHorizon,
        customConstellations,
      });
      window.postMessage({ type: "STELLARFORGE_SAVE", payload }, "*");
    };

    const onLoad = (event: Event) => {
      const save = fromExoskySave((event as CustomEvent).detail);
      if (!save) return;

      // A loaded save is never the original handoff, even when it happens to
      // restore custom-coordinate mode. Without this, a stale "(from
      // Solaris)" note describing an unrelated planet could reattach itself
      // to whatever coordinates this save carries.
      setHandoffPayload(null);

      // Restore the vantage first: constellations are drawn in that frame, so
      // applying them against the wrong sky would put the lines in the wrong place.
      const idx = EXOPLANET_SYSTEMS.findIndex((p) => p.planet === save.vantage.planetName);
      if (idx >= 0) {
        setCustomMode(false);
        setSelectedPlanet(idx);
      } else if (save.vantage.galacticL !== null && save.vantage.galacticB !== null) {
        setCustomMode(true);
        setCustomGalL(save.vantage.galacticL);
        setCustomGalB(save.vantage.galacticB);
        setCustomDistPc(save.vantage.distPc || 100);
      }

      setViewRa(save.view.ra);
      setViewDec(save.view.dec);
      setFov(save.view.fov);
      setEpochYears(save.view.epochYears);
      setShowConstellations(save.display.constellations);
      setShowAtmosphere(save.display.atmosphere);
      setShowGrid(save.display.grid);
      setShowMilkyWay(save.display.milkyWay);
      setShowStarNames(save.display.starNames);
      setShowHorizon(save.display.horizon);

      setCustomConstellations(
        save.constellations.map((c, i) => ({
          id: Date.now() + i,
          name: c.name,
          color: c.color,
          visible: true,
          // The render loop reads newRa/newDec; the payload stores ra/dec.
          stars: c.stars.map((s) => ({ ...s, newRa: s.ra, newDec: s.dec })),
          planetIndex: idx >= 0 ? idx : -1,
          planetName: c.fromPlanet,
          centRa: c.centRa,
          centDec: c.centDec,
        })),
      );
    };

    window.addEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
    window.addEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    return () => {
      window.removeEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
      window.removeEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    };
  }, [
    planet, customMode, customGalL, customGalB, worldEntity, worldEntityCoords,
    viewRa, viewDec, fov, epochYears, showConstellations, showAtmosphere, showGrid,
    showMilkyWay, showStarNames, showHorizon, customConstellations,
  ]);

  // Save the current custom coordinates back onto a selected world entity.
  const saveCoordsToEntity = useCallback(() => {
    if (!worldEntity) return;
    const l = customGalL * DEG, b = customGalB * DEG, dist = Math.max(0.01, customDistPc);
    const gx = dist * Math.cos(b) * Math.cos(l);
    const gy = dist * Math.cos(b) * Math.sin(l);
    const gz = dist * Math.sin(b);
    const [ex, ey, ez] = galToEq(gx, gy, gz);
    const rd = xyzToRaDec(ex, ey, ez);
    updateEntity.mutate({
      id: worldEntity.id,
      metadata: {
        ...(worldEntity.metadata ?? {}),
        exoskyCoords: { ra: rd.ra, dec: rd.dec, distancePc: dist, galacticL: customGalL, galacticB: customGalB },
      },
    } as Parameters<typeof updateEntity.mutate>[0], {
      onSuccess: () => {
        toast({ title: "COORDINATES SAVED.", description: `${worldEntity.name} now has galactic coordinates.` });
      },
    });
  }, [worldEntity, customGalL, customGalB, customDistPc, updateEntity, toast]);
  const atmo = ATMO_MODELS[planet.atmoType];

  // ── Procedural stars (memoized per session) ─────────
  const proceduralStars = useMemo(() => generateProceduralStars(25000, 31415), []);

  // ── Dense background field (20,000 points) ─────────
  const backgroundField = useMemo(() => generateBackgroundField(20000, 77777), []);

  // ── Spatial buckets for background field (by RA/Dec quadrant) ──
  // 12 RA bins (30 deg each) x 6 Dec bins (30 deg each) = 72 buckets
  const bgBuckets = useMemo(() => {
    const buckets = new Array(BG_RA_BINS * BG_DEC_BINS);
    for (let i = 0; i < buckets.length; i++) buckets[i] = [];
    for (let i = 0; i < backgroundField.length; i++) {
      const bg = backgroundField[i];
      const raBin = Math.min(BG_RA_BINS - 1, Math.floor((bg.ra / 360) * BG_RA_BINS));
      const decBin = Math.min(BG_DEC_BINS - 1, Math.floor(((bg.dec + 90) / 180) * BG_DEC_BINS));
      buckets[raBin * BG_DEC_BINS + decBin].push(bg);
    }
    return buckets;
  }, [backgroundField]);

  const allStars = useMemo(() => [...(starCatalog || []), ...proceduralStars], [starCatalog, proceduralStars]);

  // ── Observer's galactocentric position ──────────────
  const obsGC = useMemo(() => {
    const eqPos = raDecDistToXYZ(planet.ra, planet.dec, planet.dist);
    return eqXYZtoGalactocentric(eqPos[0], eqPos[1], eqPos[2]);
  }, [planet]);

  // ── Compute Milky Way map (async-ish) ────────��──────
  // ── Compute Milky Way map (Web Worker) ──────────────
  const mwWorkerRef = useRef(null);
  useEffect(() => {
    setMwReady(false);
    // Use Web Worker to avoid blocking the main thread
    if (!mwWorkerRef.current) {
      try {
        mwWorkerRef.current = new Worker("/exosky-mw-worker.js");
      } catch {
        // Fallback to main thread if Worker fails
        const timer = setTimeout(() => {
          mwMapRef.current = computeMilkyWayMap(obsGC[0], obsGC[1], obsGC[2]);
          setMwReady(true);
        }, 50);
        return () => clearTimeout(timer);
      }
    }
    const worker = mwWorkerRef.current;
    const handler = (e) => {
      mwMapRef.current = { brightness: e.data.brightness, dust: e.data.dust };
      setMwReady(true);
    };
    worker.onmessage = handler;
    worker.postMessage({ obsGCx: obsGC[0], obsGCy: obsGC[1], obsGCz: obsGC[2] });
    return () => { worker.onmessage = null; };
  }, [obsGC]);
  // Cleanup worker on unmount
  useEffect(() => {
    return () => { if (mwWorkerRef.current) { mwWorkerRef.current.terminate(); mwWorkerRef.current = null; } };
  }, []);

  // ── Transform stars to observer frame ───────────────
  const transformedStars = useMemo(() => {
    const obs = raDecDistToXYZ(planet.ra, planet.dec, planet.dist);
    /**
     * Axial precession, applied to the observer-frame vector (astro.ts's own
     * term for `rel` below) rather than per-star: the matrix is the same for
     * every star in a given render, so it's built once here instead of once
     * per star inside the map, which mattered at ~25,000 procedural stars.
     *
     * This is the one place precession belongs. It rotates every catalog and
     * procedural star's position relative to the observer's equatorial pole,
     * which is what actually changes "which star sits at the pole" as epoch
     * moves. The separate 20,000-star background field (generateBackgroundField)
     * is intentionally left untouched here, that's the Step 8 stretch scope,
     * not this one, and the observer's galactocentric position used to seed
     * the Milky Way structure map is a spatial fact about the observer, not
     * an artifact of their rotational axis, so precession does not apply there.
     */
    const pm = precessionMatrix(epochYears);
    return allStars.map(star => {
      const pos = raDecDistToXYZ(star.ra, star.dec, star.dist);
      const rel = [pos[0]-obs[0], pos[1]-obs[1], pos[2]-obs[2]];
      const px = pm[0][0]*rel[0] + pm[0][1]*rel[1] + pm[0][2]*rel[2];
      const py = pm[1][0]*rel[0] + pm[1][1]*rel[1] + pm[1][2]*rel[2];
      const pz = pm[2][0]*rel[0] + pm[2][1]*rel[1] + pm[2][2]*rel[2];
      const { ra, dec, dist } = xyzToRaDec(px, py, pz);
      const appMag = apparentMag(star.absMag, dist);
      const rgb = bvToRGB(star.bv);
      const isSol = star.name === "Sol";
      return { ...star, newRa:ra, newDec:dec, newDist:dist, appMag, rgb, isSol };
    }).filter(s => s.appMag < 8.5).sort((a,b) => a.appMag - b.appMag);
  }, [planet, allStars, epochYears]);
  const transformedStarsRef = useRef(transformedStars);
  transformedStarsRef.current = transformedStars;
  const bgBucketsRef = useRef(bgBuckets);
  bgBucketsRef.current = bgBuckets;
  const obsGCRef = useRef(obsGC);
  obsGCRef.current = obsGC;
  const mwReadyRef = useRef(mwReady);
  mwReadyRef.current = mwReady;
  const atmoRef = useRef(atmo);
  atmoRef.current = atmo;
  const planetRef = useRef(planet);
  planetRef.current = planet;

  /**
   * Per-stage render profiler, off unless asked for.
   *
   * The draw loop has eight distinct stages and the reported stutter could
   * plausibly come from any of them. Guessing which one costs the most is how a
   * rewrite ends up optimising the wrong thing: disabling the Milky Way band
   * recovered only about a quarter of the frame, so the rest is somewhere else.
   *
   * Enable with ?profile=1, then read window.__exoskyProfile for a rolling
   * median per stage. Costs one Boolean test per stage when off.
   */
  const profiling = useRef(
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("profile"),
  );
  const profileMark = useRef(0);
  const profileData = useRef<Record<string, number[]>>({});

  /**
   * Work counters, which milliseconds cannot answer honestly here.
   *
   * A headless browser's software rasteriser makes every ms figure suspect, and
   * this session already burned a diagnosis on numbers measured that way. How
   * many stars the spatial index actually walks is the same on any machine, so
   * it is the part of "why is backgroundField the dominant stage" that can be
   * settled without the owner's hardware.
   */
  const counters = useRef<Record<string, number>>({});
  const camSnapshot = useRef({ viewRa: 0, viewDec: 0, fov: 0, mwQuality: 0 });
  /** Last camera key and when it last changed, for progressive refinement. */
  const lastCamKey = useRef("");
  const lastCamMove = useRef(0);
  const tally = useCallback((name: string, n = 1) => {
    if (!profiling.current) return;
    counters.current[name] = (counters.current[name] ?? 0) + n;
  }, []);

  const stage = useCallback((name: string) => {
    if (!profiling.current) return;
    const now = performance.now();
    if (name !== "__start") {
      (profileData.current[name] ??= []).push(now - profileMark.current);
      // Rolling window, so a slow first frame does not dominate forever.
      if (profileData.current[name].length > 120) profileData.current[name].shift();
    }
    profileMark.current = now;
  }, []);

  useEffect(() => {
    if (!profiling.current) return;
    (window as unknown as { __exoskyProfile?: unknown }).__exoskyProfile = () => {
      const out: Record<string, { medianMs: number; samples: number }> = {};
      let total = 0;
      for (const [k, v] of Object.entries(profileData.current)) {
        const sorted = [...v].sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
        out[k] = { medianMs: +med.toFixed(2), samples: v.length };
        total += med;
      }
      return { stages: out, totalMedianMs: +total.toFixed(2) };
    };

    // Per-frame averages, so the numbers mean "per redraw" not "since load".
    (window as unknown as { __exoskyCounters?: unknown }).__exoskyCounters = () => {
      const frames = counters.current.frames || 1;
      const cam = camSnapshot.current;
      const per = (k: string) => +((counters.current[k] ?? 0) / frames).toFixed(1);
      const walked = per("bgWalked");
      return {
        frames,
        // Read this before and after a drag. If it is identical, the
        // measurement below is of an idle canvas and means nothing.
        camera: { ...cam },
        backgroundField: {
          fieldSize: 20000,
          bucketsVisited: per("bgBuckets"),
          starsWalked: walked,
          // How many of the walked stars were bright enough to pay for a
          // projectStar call. The gap between this and starsWalked is what
          // reordering the magnitude check ahead of projection now skips.
          starsProjected: per("bgProjected"),
          starsDrawn: per("bgDrawn"),
          // The number that decides whether the index is worth keeping.
          percentOfFieldWalked: +((walked / 20000) * 100).toFixed(1),
        },
      };
    };
  }, []);

  // ── Canvas render ───────────────────────────────────
  const render = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const t = time * 0.001;

    // Read all values from refs (avoids dependency on state for render loop)
    const _viewRa = viewRaRef.current;
    const _viewDec = viewDecRef.current;
    const _fov = fovRef.current;
    const _showMilkyWay = showMilkyWayRef.current;
    const _showConstellations = showConstellationsRef.current;
    const _showAtmosphere = showAtmosphereRef.current;
    const _showGrid = showGridRef.current;
    const _showStarNames = showStarNamesRef.current;
    const _showHorizon = showHorizonRef.current;
    const _highlightSol = highlightSolRef.current;
    const _showCustomConstellations = showCustomConstellationsRef.current;
    const _atmoDensity = atmoDensityRef.current;
    const _mwBrightness = mwBrightnessRef.current;
    const _drawMode = drawModeRef.current;
    const _currentDrawing = currentDrawingRef.current;
    const _customConstellations = customConstellationsRef.current;
    const _drawColor = drawColorRef.current;
    const _hoveredStar = hoveredStarRef.current;
    const _transformedStars = transformedStarsRef.current;
    const _epochYears = epochYearsRef.current;
    const _obsGC = obsGCRef.current;
    const _mwReady = mwReadyRef.current;
    const _atmo = atmoRef.current;
    const _planet = planetRef.current;
    const _bgBuckets = bgBucketsRef.current;

    stage("__start");
    ctx.fillStyle = "#09090B";
    ctx.fillRect(0, 0, W, H);
    stage("clear");

    // ── MILKY WAY BAND (offscreen canvas) ────────────
    if (_showMilkyWay && mwMapRef.current && _mwReady) {
      const mwMap = mwMapRef.current;

      /**
       * Progressive refinement: draw coarse while the camera moves.
       *
       * The Milky Way is the only stage whose redraw condition includes the
       * camera, so it recomputes on exactly the frames the user is dragging and
       * on no others. Measured at 32.8 ms per frame while dragging against
       * 0.1 ms idle, which is the reported stutter in one number.
       *
       * The sample step is quadratic in cost, so tripling it while the view is
       * in motion cuts the work by ~9x. A reader cannot resolve fine galactic
       * structure mid-drag, and the full-detail pass lands ~160 ms after they
       * let go, which is what makes map applications feel instant rather than
       * slow. Rewriting the loop to write pixels instead of rects was tried
       * first and measured *worse* (44 ms), so it is not the answer here.
       */
      // epochYears is included here (not just viewRa/viewDec/fov) because it
      // is also part of the redraw cache key below (mwParams.epochYears):
      // without it in camKey, an epoch-slider drag would still force a
      // needsRedraw every step but never trip cameraMoving, so it would
      // always ray-march at full quality instead of getting the same cheap
      // coarse pass a camera drag gets.
      const camKey = `${_viewRa},${_viewDec},${_fov},${_epochYears}`;
      if (camKey !== lastCamKey.current) {
        lastCamKey.current = camKey;
        lastCamMove.current = performance.now();
      }
      const cameraMoving = performance.now() - lastCamMove.current < 160;
      const mwQuality = cameraMoving ? 3 : 1;

      // Check if we need to re-render the MW offscreen canvas
      const mwParams = mwParamsRef.current;
      const planetKey = `${_planet.ra},${_planet.dec},${_planet.dist}`;
      const needsRedraw = mwParams.viewRa !== _viewRa || mwParams.viewDec !== _viewDec
        || mwParams.fov !== _fov || mwParams.planetKey !== planetKey
        || mwParams.W !== W || mwParams.H !== H
        || mwParams.mwBrightness !== _mwBrightness
        || mwParams.showAtmosphere !== _showAtmosphere
        || mwParams.atmoDensity !== _atmoDensity
        || mwParams.quality !== mwQuality
        || mwParams.epochYears !== _epochYears;

      if (needsRedraw) {
        // Create/resize offscreen canvas
        if (!mwOffscreenRef.current || mwOffscreenRef.current.width !== W || mwOffscreenRef.current.height !== H) {
          mwOffscreenRef.current = document.createElement("canvas");
          mwOffscreenRef.current.width = W;
          mwOffscreenRef.current.height = H;
        }
        const offCtx = mwOffscreenRef.current.getContext("2d");
        offCtx.clearRect(0, 0, W, H);

        // Pre-compute view basis vectors (hoisted out of the pixel loop)
        const vRa = _viewRa * DEG, vDec = _viewDec * DEG;
        const sinVRa = Math.sin(vRa), cosVRa = Math.cos(vRa);
        const sinVDec = Math.sin(vDec), cosVDec = Math.cos(vDec);
        const basis_rx = -sinVRa, basis_ry = cosVRa, basis_rz = 0;
        const basis_ux = -sinVDec*cosVRa, basis_uy = -sinVDec*sinVRa, basis_uz = cosVDec;
        const basis_vx = cosVDec*cosVRa, basis_vy = cosVDec*sinVRa, basis_vz = sinVDec;
        const projScale = W / (2 * Math.tan(_fov * DEG / 2));

        // Pre-compute observer l-correction (was inside the pixel loop before!)
        const eqObs = raDecDistToXYZ(_planet.ra, _planet.dec, _planet.dist);
        const [ogx, ogy] = eqToGal(eqObs[0], eqObs[1], eqObs[2]);
        const lCorrection = Math.atan2(ogy, R_SUN + ogx) || 0;

        /**
         * Axial precession, inverted. `dirX/dirY/dirZ` below is built straight
         * from `_viewRa`/`_viewDec`, the same raw camera numbers that
         * `transformedStars` compares its precessed `newRa`/`newDec` against,
         * i.e. this ray direction lives in the "display" frame, exactly like a
         * point star's post-precession position, not the real fixed frame
         * `eqToGal` expects (the galactic structure map does not itself move).
         *
         * `transformedStars` gets from the real frame to the display frame by
         * applying `precessionMatrix(epochYears)` forward. Going the other way
         * (display → real, which is what this block needs before eqToGal)
         * requires the inverse of that rotation. Precession is a pure rotation,
         * so its inverse is its transpose, which for this matrix equals
         * `precessionMatrix(-epochYears)` (both fromEcliptic/toEcliptic are
         * transposes of each other by construction, and negating epochYears
         * negates theta, which is exactly what transposing the spin block
         * does). Verified numerically: a fixed reference direction's galactic
         * latitude, recovered this way, stays constant at ~17.3° across every
         * tested epoch; applying the forward matrix instead swings it wildly
         * (58.7°, -15.1°, ...), which is the double-rotation this avoids.
         */
        const pmInv = precessionMatrix(-_epochYears);

        const step = Math.max(2, Math.floor(4 * (_fov / 90))) * mwQuality;

        for (let sx = 0; sx < W; sx += step) {
          for (let sy = 0; sy < H; sy += step) {
            const dx = (sx - W/2), dy = (sy - H/2);
            const localX = dx / projScale, localY = -dy / projScale;

            let dirX = basis_vx + localX * basis_rx + localY * basis_ux;
            let dirY = basis_vy + localX * basis_ry + localY * basis_uy;
            let dirZ = basis_vz + localX * basis_rz + localY * basis_uz;
            const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
            dirX /= len; dirY /= len; dirZ /= len;

            const precX = pmInv[0][0]*dirX + pmInv[0][1]*dirY + pmInv[0][2]*dirZ;
            const precY = pmInv[1][0]*dirX + pmInv[1][1]*dirY + pmInv[1][2]*dirZ;
            const precZ = pmInv[2][0]*dirX + pmInv[2][1]*dirY + pmInv[2][2]*dirZ;

            const [gx, gy, gz] = eqToGal(precX, precY, precZ);
            const galB = Math.asin(Math.max(-1, Math.min(1, gz)));
            const stdGalL = Math.atan2(gy, gx);
            const obsL = ((stdGalL - lCorrection) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);

            const brightness = sampleMWMap(mwMap.brightness, obsL, galB) * _mwBrightness;
            if (brightness < 0.003) continue;

            const centerWeight = Math.cos(obsL) * 0.3 + 0.5;
            const rCol = Math.floor(180 + 40 * centerWeight);
            const gCol = Math.floor(175 + 30 * centerWeight);
            const bCol = Math.floor(200 - 20 * centerWeight);

            let alpha = brightness * 0.45;
            if (_showAtmosphere) {
              alpha *= Math.max(0.05, 1 - _atmo.extinction * _atmoDensity * 1.5);
            }
            if (alpha < 0.002) continue;

            offCtx.fillStyle = `rgba(${rCol},${gCol},${bCol},${Math.min(alpha, 0.35)})`;
            offCtx.fillRect(sx - step/2, sy - step/2, step + 0.5, step + 0.5);
          }
        }

        // Update cached params
        mwParamsRef.current = { viewRa: _viewRa, viewDec: _viewDec, fov: _fov, planetKey, W, H, mwBrightness: _mwBrightness, showAtmosphere: _showAtmosphere, atmoDensity: _atmoDensity, quality: mwQuality, epochYears: _epochYears };
      }

      // Blit the cached MW offscreen canvas
      if (mwOffscreenRef.current) {
        ctx.drawImage(mwOffscreenRef.current, 0, 0);
      }
    }

    stage("milkyWay");
    // ── DENSE BACKGROUND STAR FIELD ─────────────────
    // Use spatial buckets to only iterate stars near the current view
    {
      const extinctionMod = _showAtmosphere ? _atmo.extinction * _atmoDensity * 2.5 : 0;
      let bgCount = 0;
      const bgMax = 12000;
      /**
       * Batched by quantised (colour, alpha) instead of drawn star-by-star.
       * Profiling (window.__exoskyProfile) showed this stage dominating the
       * frame even when nothing else was visibly costly — up to bgMax stars
       * each got their own `ctx.fillStyle = <fresh string>` before this fix,
       * and a fillStyle change is a colour-parse + canvas state change, not a
       * free assignment. Colour and twinkle-alpha are quantised into a small
       * number of buckets (invisible at 0.7-1.5px) so fillStyle changes a
       * few dozen times a frame instead of up to twelve thousand.
       */
      const bgBatches = new Map<string, { style: string; pts: number[] }>();

      // Determine which RA/Dec bins overlap the current view
      const halfFov = _fov * 0.6;
      const raMin = ((_viewRa - halfFov) + 360) % 360;
      const raMax = ((_viewRa + halfFov) + 360) % 360;
      const decMin = Math.max(-90, _viewDec - halfFov);
      const decMax = Math.min(90, _viewDec + halfFov);

      const raBinMin = Math.floor((raMin / 360) * BG_RA_BINS);
      const raBinMax = Math.floor((raMax / 360) * BG_RA_BINS);
      const decBinMin = Math.max(0, Math.floor(((decMin + 90) / 180) * BG_DEC_BINS));
      const decBinMax = Math.min(BG_DEC_BINS - 1, Math.floor(((decMax + 90) / 180) * BG_DEC_BINS));

      // Collect relevant bucket indices (handle RA wraparound)
      const raBins = [];
      if (raBinMin <= raBinMax) {
        for (let r = raBinMin; r <= raBinMax; r++) raBins.push(((r % BG_RA_BINS) + BG_RA_BINS) % BG_RA_BINS);
      } else {
        // Wraparound
        for (let r = raBinMin; r < BG_RA_BINS; r++) raBins.push(r);
        for (let r = 0; r <= raBinMax; r++) raBins.push(r);
      }

      for (const rBin of raBins) {
        for (let dBin = decBinMin; dBin <= decBinMax && bgCount < bgMax; dBin++) {
          const bucket = _bgBuckets[rBin * BG_DEC_BINS + dBin];
          tally("bgBuckets");
          tally("bgWalked", bucket.length);
          for (let i = 0; i < bucket.length && bgCount < bgMax; i++) {
            const bg = bucket[i];
            let useRa = bg.ra, useDec = bg.dec;

            // Quick visibility check
            let dRa = useRa - _viewRa;
            if (dRa > 180) dRa -= 360; if (dRa < -180) dRa += 360;
            if (Math.abs(dRa) > halfFov || Math.abs(useDec - _viewDec) > halfFov) continue;

            /**
             * Magnitude before projection, not after.
             *
             * eMag depends only on bg.baseMag, the precomputed galactic
             * coordinates, and the Milky Way lookup: nothing here reads the
             * projected screen point. projectStar is the expensive step in
             * this loop (a normalise, an eqToGal matrix multiply, an asin, an
             * atan2), and it used to run on every star inside the coarse box
             * before the cheap magnitude test that actually decides whether
             * most of them are visible. A background star field skews heavily
             * toward dim stars by design, so most candidates fail this test;
             * checking it first means projectStar is only paid for on the
             * stars that stood a chance of being drawn.
             */
            let eMag = bg.baseMag + extinctionMod;

            if (mwMapRef.current && _mwReady) {
              const lNorm = ((bg.galL / 360) * L_STEPS) | 0;
              const bNorm = (((bg.galB + 90) / 180) * B_STEPS) | 0;
              if (lNorm >= 0 && lNorm < L_STEPS && bNorm >= 0 && bNorm < B_STEPS) {
                const mwDensity = mwMapRef.current.brightness[lNorm * B_STEPS + bNorm];
                eMag -= mwDensity * 1.5;
              }
            }

            if (eMag > 7.5) continue;

            tally("bgProjected");
            const p = projectStar(useRa, useDec, _viewRa, _viewDec, _fov, W, H);
            if (!p) continue;

            const alpha = Math.min(0.8, Math.max(0.04, (7.5 - eMag) / 7.0));
            const [r, g, b] = bvToRGB(bg.bv);

            const tw = ((Math.sin(t * 0.7 + i * 0.37) * 0.5 + 0.5) * 0.3 + 0.7);
            const finalAlpha = alpha * tw;

            if (finalAlpha < 0.02) continue;

            const size = eMag < 4.5 ? 1.5 : eMag < 5.5 ? 1.0 : 0.7;

            const qr = Math.round(r / 16) * 16;
            const qg = Math.round(g / 16) * 16;
            const qb = Math.round(b / 16) * 16;
            const qa = Math.round(finalAlpha / 0.04) * 0.04;
            const key = `${qr},${qg},${qb},${qa}`;
            let batch = bgBatches.get(key);
            if (!batch) {
              batch = { style: `rgba(${qr},${qg},${qb},${qa})`, pts: [] };
              bgBatches.set(key, batch);
            }
            batch.pts.push(p.x - size * 0.5, p.y - size * 0.5, size);
            bgCount++;
          }
        }
      }

      for (const { style, pts } of bgBatches.values()) {
        ctx.fillStyle = style;
        for (let k = 0; k < pts.length; k += 3) {
          const s = pts[k + 2];
          ctx.fillRect(pts[k], pts[k + 1], s, s);
        }
      }

      tally("bgDrawn", bgCount);
      tally("frames");
      // The camera, recorded with the counters. Any claim about "while
      // dragging" is worthless unless the view provably moved, and this
      // session has already produced one diagnosis that did not.
      if (profiling.current) {
        camSnapshot.current = { viewRa: _viewRa, viewDec: _viewDec, fov: _fov,
          mwQuality: mwParamsRef.current.quality ?? 0 };
      }
    }

    stage("backgroundField");
    // ── ATMOSPHERIC SKY GRADIENT ────────────────────
    if (_showAtmosphere && _atmo.extinction > 0) {
      const [sr, sg, sb] = _atmo.skyColor;
      const d = _atmoDensity;
      const grad = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, Math.max(W,H)*0.7);
      grad.addColorStop(0, `rgba(${sr},${sg},${sb},${0.02*d})`);
      grad.addColorStop(0.6, `rgba(${sr},${sg},${sb},${0.06*d})`);
      grad.addColorStop(1, `rgba(${sr},${sg},${sb},${0.15*d})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);
      if (_atmo.haze > 0) {
        const hg = ctx.createLinearGradient(0,H*0.5,0,H);
        hg.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
        hg.addColorStop(1, `rgba(${sr},${sg},${sb},${_atmo.haze*d*0.5})`);
        ctx.fillStyle = hg;
        ctx.fillRect(0,0,W,H);
      }
    }

    stage("skyGradient");
    // ── HORIZON LINE & GROUND PLANE ────────────────
    if (_showHorizon) {
      const horizonDec = 0;
      const horizPts = [];
      for (let ra = _viewRa - _fov * 0.8; ra <= _viewRa + _fov * 0.8; ra += _fov / 60) {
        const p = projectStar(((ra % 360) + 360) % 360, horizonDec, _viewRa, _viewDec, _fov, W, H);
        if (p) horizPts.push(p);
      }

      if (horizPts.length > 1) {
        const lowestY = Math.max(...horizPts.map(p => p.y));
        if (lowestY < H) {
          const [sr, sg, sb] = _showAtmosphere ? _atmo.skyColor : [20, 18, 15];
          const groundGrad = ctx.createLinearGradient(0, Math.min(...horizPts.map(p => p.y)), 0, H);
          groundGrad.addColorStop(0, `rgba(${Math.floor(sr*0.15)},${Math.floor(sg*0.12)},${Math.floor(sb*0.1)},0.7)`);
          groundGrad.addColorStop(0.3, `rgba(${Math.floor(sr*0.08)},${Math.floor(sg*0.06)},${Math.floor(sb*0.04)},0.85)`);
          groundGrad.addColorStop(1, `rgba(6,5,4,0.95)`);

          ctx.beginPath();
          ctx.moveTo(horizPts[0].x, horizPts[0].y);
          for (let i = 1; i < horizPts.length; i++) ctx.lineTo(horizPts[i].x, horizPts[i].y);
          ctx.lineTo(W + 10, horizPts[horizPts.length - 1].y);
          ctx.lineTo(W + 10, H + 10);
          ctx.lineTo(-10, H + 10);
          ctx.lineTo(-10, horizPts[0].y);
          ctx.closePath();
          ctx.fillStyle = groundGrad;
          ctx.fill();
        }

        if (_showAtmosphere && _atmo.extinction > 0) {
          const [sr, sg, sb] = _atmo.skyColor;
          const d = _atmoDensity;
          for (let i = 0; i < horizPts.length - 1; i++) {
            const x1 = horizPts[i].x, y1 = horizPts[i].y;
            const x2 = horizPts[i + 1].x, y2 = horizPts[i + 1].y;
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;

            const glowH = 30 * d;
            const glow = ctx.createLinearGradient(mx, my - glowH, mx, my + 4);
            glow.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
            glow.addColorStop(0.6, `rgba(${sr},${sg},${sb},${0.03 * d})`);
            glow.addColorStop(1, `rgba(${sr},${sg},${sb},${0.08 * d})`);
            ctx.fillStyle = glow;
            ctx.fillRect(Math.min(x1, x2) - 2, my - glowH, Math.abs(x2 - x1) + 4, glowH + 4);
          }
        }

        ctx.beginPath();
        ctx.moveTo(horizPts[0].x, horizPts[0].y);
        for (let i = 1; i < horizPts.length; i++) {
          if (i < horizPts.length - 1) {
            const xc = (horizPts[i].x + horizPts[i + 1].x) / 2;
            const yc = (horizPts[i].y + horizPts[i + 1].y) / 2;
            ctx.quadraticCurveTo(horizPts[i].x, horizPts[i].y, xc, yc);
          } else {
            ctx.lineTo(horizPts[i].x, horizPts[i].y);
          }
        }
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const centerIdx = Math.floor(horizPts.length / 2);
        const spread = Math.floor(horizPts.length * 0.3);
        ctx.beginPath();
        const startI = Math.max(0, centerIdx - spread);
        const endI = Math.min(horizPts.length - 1, centerIdx + spread);
        ctx.moveTo(horizPts[startI].x, horizPts[startI].y);
        for (let i = startI + 1; i <= endI; i++) ctx.lineTo(horizPts[i].x, horizPts[i].y);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 3;
        ctx.stroke();

        if (_fov < 120) {
          const labelPt = horizPts[Math.floor(horizPts.length * 0.85)];
          if (labelPt && labelPt.y > 20 && labelPt.y < H - 20) {
            ctx.font = '11px "MD Nichrome", "Jura", sans-serif';
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.textAlign = "center";
            ctx.letterSpacing = "3px";
            ctx.fillText("H O R I Z O N", labelPt.x, labelPt.y - 6);
            ctx.letterSpacing = "0px";
          }
        }
      }
    }

    stage("horizon");
    // ── COORDINATE GRID ─────────────────────────────
    if (_showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      for (let ra = 0; ra < 360; ra += 30) {
        const pts = [];
        for (let dec = -80; dec <= 80; dec += 5) {
          const p = projectStar(ra, dec, _viewRa, _viewDec, _fov, W, H);
          if (p) pts.push(p);
        }
        if (pts.length > 1) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
      }
      for (let dec = -60; dec <= 60; dec += 30) {
        const pts = [];
        for (let ra = 0; ra <= 360; ra += 5) {
          const p = projectStar(ra, dec, _viewRa, _viewDec, _fov, W, H);
          if (p) pts.push(p);
        }
        if (pts.length > 1) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
      }
    }

    stage("grid");
    // ── CONSTELLATION LINES ─────────────────────────
    if (_showConstellations) {
      const starMap = {};
      _transformedStars.forEach(s => { if (s.name) starMap[s.name] = s; });
      ctx.strokeStyle = "rgba(21,193,123,0.05)";
      ctx.lineWidth = 0.7;
      ctx.setLineDash([3,5]);
      CONSTELLATION_LINES.forEach(([a,b]) => {
        const sa = starMap[a], sb = starMap[b];
        if (!sa || !sb) return;
        const pa = projectStar(sa.newRa, sa.newDec, _viewRa, _viewDec, _fov, W, H, 500);
        const pb = projectStar(sb.newRa, sb.newDec, _viewRa, _viewDec, _fov, W, H, 500);
        if (!pa || !pb) return;
        if (Math.sqrt((pa.x-pb.x)**2+(pa.y-pb.y)**2) > W*0.8) return;
        ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y); ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    stage("constellations");
    // ── STARS ────────────────────────────────────────
    const positions = [];
    const maxStars = 8000; // Performance cap
    let count = 0;

    for (const s of _transformedStars) {
      if (count >= maxStars) break;
      const p = projectStar(s.newRa, s.newDec, _viewRa, _viewDec, _fov, W, H);
      if (!p) continue;

      let eMag = s.appMag;
      if (_showAtmosphere) eMag += _atmo.extinction * _atmoDensity * 2.5;
      if (eMag > 7.2) continue;

      const [r,g,b] = s.rgb;

      // ── FAST PATH for dim procedural stars ──────
      if (!s.isCatalog && eMag > 4.0) {
        const alpha = Math.min(0.7, Math.max(0.06, (7.2 - eMag) / 5.0));
        const sz = eMag < 5.0 ? 1.4 : eMag < 6.0 ? 1.0 : 0.7;
        const tw = Math.sin(t*1.1 + s.newRa*0.13) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * tw})`;
        ctx.fillRect(p.x - sz*0.5, p.y - sz*0.5, sz, sz);
        count++;
        continue;
      }

      const magScale = Math.max(0.4, 4.5 - eMag * 0.5);
      const tw = Math.sin(t*1.3 + s.newRa*0.1 + (s.newDec||0)*0.05) * 0.15 + 0.85;
      const radius = magScale * tw * (s.isCatalog ? 1 : 0.85);
      const alpha = Math.min(1, Math.max(0.15, 1 - eMag/7));

      // Glow for bright stars
      if (eMag < 2.0 && s.isCatalog) {
        const glowR = radius * (eMag < 0 ? 14 : 7);
        const glow = ctx.createRadialGradient(p.x,p.y,radius, p.x,p.y,glowR);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.12*alpha})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,glowR,0,Math.PI*2); ctx.fillStyle=glow; ctx.fill();
      }

      // Sol highlight
      if (s.isSol && _highlightSol) {
        const pr = 8 + Math.sin(t*2)*3;
        ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,Math.PI*2);
        ctx.strokeStyle = `rgba(255,215,59,${0.25+Math.sin(t*2)*0.1})`;
        ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '11px "MD Nichrome", "Jura", sans-serif';
        ctx.fillStyle = "rgba(255,215,59,0.6)";
        ctx.textAlign = "center";
        ctx.fillText("SOL", p.x, p.y-14);
      }

      // Star point
      ctx.beginPath(); ctx.arc(p.x,p.y,radius,0,Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      // Diffraction spikes
      if (eMag < 0.5 && s.isCatalog) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.1*alpha})`;
        ctx.lineWidth = 0.5;
        const sl = radius*4;
        ctx.beginPath();
        ctx.moveTo(p.x-sl,p.y); ctx.lineTo(p.x+sl,p.y);
        ctx.moveTo(p.x,p.y-sl); ctx.lineTo(p.x,p.y+sl);
        ctx.stroke();
      }

      // Labels
      if (_showStarNames && s.name && eMag < 5.5 && _fov < 140 && s.isCatalog) {
        const labelAlpha = eMag < 2 ? 0.7 : eMag < 3.5 ? 0.55 : 0.35;
        ctx.font = '12px "MD Nichrome", "Jura", sans-serif';
        ctx.fillStyle = `rgba(${r},${g},${b},${labelAlpha})`;
        ctx.textAlign = "center";
        ctx.fillText(s.name, p.x, p.y + radius + 12);
      }

      if (s.isCatalog || (_drawMode && eMag < 5.5)) positions.push({ ...s, screenX:p.x, screenY:p.y, effectiveMag:eMag });
      count++;
    }
    starPositions.current = positions;

    stage("stars");
    // ── DRAW MODE HOVER INDICATOR ─────────────────
    if (_drawMode && _hoveredStar) {
      const hp = projectStar(_hoveredStar.newRa, _hoveredStar.newDec, _viewRa, _viewDec, _fov, W, H, 500);
      if (hp) {
        const pulse = Math.sin(t * 4) * 0.3 + 0.7;
        // Outer ring
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 10 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = _drawColor + "66";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Inner target
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 3, 0, Math.PI * 2);
        ctx.strokeStyle = _drawColor + "AA";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Preview line from last drawn star
        if (_currentDrawing.length > 0) {
          const lastStar = _currentDrawing[_currentDrawing.length - 1];
          const lp = projectStar(lastStar.newRa, lastStar.newDec, _viewRa, _viewDec, _fov, W, H, 500);
          if (lp) {
            ctx.beginPath();
            ctx.moveTo(lp.x, lp.y);
            ctx.lineTo(hp.x, hp.y);
            ctx.strokeStyle = _drawColor + "33";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // ── CUSTOM CONSTELLATIONS ───────────────────────
    if (_showCustomConstellations) {
      for (const cons of _customConstellations) {
        if (!cons.visible) continue;
        const pts = cons.stars.map(s => projectStar(s.newRa, s.newDec, _viewRa, _viewDec, _fov, W, H, 500)).filter(Boolean);
        if (pts.length < 2) continue;

        const cc = cons.color;

        // Lines
        ctx.strokeStyle = cc + "55";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const dist = Math.sqrt((pts[i].x-pts[i-1].x)**2 + (pts[i].y-pts[i-1].y)**2);
          if (dist > W * 0.8) continue;
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Star nodes
        for (const pt of pts) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = cc + "44";
          ctx.fill();
          ctx.strokeStyle = cc + "88";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Label at centroid
        const centP = projectStar(cons.centRa, cons.centDec, _viewRa, _viewDec, _fov, W, H, 500);
        if (centP && _fov < 130) {
          ctx.font = '12px "MD Nichrome", "Jura", sans-serif';
          ctx.fillStyle = cc + "66";
          ctx.textAlign = "center";
          ctx.fillText(cons.name.toUpperCase(), centP.x, centP.y - 16);
        }
      }
    }

    // ── IN-PROGRESS DRAWING ─────────────────────────
    if (_drawMode && _currentDrawing.length > 0) {
      const pts = _currentDrawing.map(s => projectStar(s.newRa, s.newDec, _viewRa, _viewDec, _fov, W, H, 500)).filter(Boolean);

      if (pts.length >= 2) {
        ctx.strokeStyle = _drawColor + "77";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nodes with pulsing rings
      for (let i = 0; i < pts.length; i++) {
        if (!pts[i]) continue;
        const pulse = Math.sin(t * 3 + i * 0.5) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 6 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = _drawColor + "55";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = _drawColor + "AA";
        ctx.fill();
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = _drawColor + "88";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, pts[i].x, pts[i].y - 10);
      }

      ctx.font = '12px "MD Nichrome", "Jura", sans-serif';
      ctx.fillStyle = _drawColor + "88";
      ctx.textAlign = "center";
      ctx.fillText(`DRAWING: ${_currentDrawing.length} STAR${_currentDrawing.length !== 1 ? 'S' : ''} SELECTED`, W / 2, 24);
      ctx.font = '11px "DM Sans", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("Click stars to connect · Esc to cancel", W / 2, 38);
    } else if (_drawMode) {
      ctx.font = '12px "MD Nichrome", "Jura", sans-serif';
      ctx.fillStyle = _drawColor + "88";
      ctx.textAlign = "center";
      ctx.fillText("CONSTELLATION DRAWING MODE", W / 2, 24);
      ctx.font = '11px "DM Sans", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("Click a star to begin", W / 2, 38);
    }

    // ── HUD OVERLAYS ────────────────────────────────
    ctx.font = '16px "MD Nichrome", "Jura", sans-serif';
    ctx.fillStyle = "rgba(21,193,123,0.3)";
    ctx.textAlign = "right";
    ctx.fillText(`${_fov}°`, W-18, H-30);
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText("FIELD OF VIEW", W-18, H-18);

    ctx.textAlign = "left";
    ctx.font = '11px "MD Nichrome", "Jura", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillText(`${count} STARS IN VIEW`, 18, H-18);

    if (_showMilkyWay && !_mwReady) {
      ctx.font = '12px "MD Nichrome", "Jura", sans-serif';
      ctx.fillStyle = "rgba(255,165,0,0.5)";
      ctx.textAlign = "center";
      ctx.fillText("COMPUTING GALACTIC STRUCTURE...", W/2, H-18);
    }

    animRef.current = requestAnimationFrame(render);
    // `stage` is a useCallback with an empty dep list, so it is stable for the
    // life of the component. Naming it here would re-create this deliberately
    // stable render callback for no benefit, so the rule is silenced instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable callback, reads all values from refs

  // ── Canvas setup ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(render);
    return () => { window.removeEventListener("resize", resize); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [render]); // render is now stable ([] deps) so this effect runs once

  // ── Keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '?') { setShowKbHelp(prev => !prev); return; }
      if (e.key === 'Escape') {
        if (showKbHelp) { setShowKbHelp(false); return; }
        if (namingMode) { setNamingMode(false); setConstellationName(""); }
        else if (drawMode) cancelDrawing();
      }
      if (e.key === 'Enter' && namingMode && constellationName.trim()) saveConstellation();
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && drawMode && !namingMode) { e.preventDefault(); undoLastStar(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawMode, namingMode, constellationName, currentDrawing, showKbHelp]);

  // ── Mouse & touch interaction ──────────────────────
  // During drag, update refs directly (no re-render) and batch state sync on pointerUp
  // Pinch-to-zoom: track two active pointers and adjust FOV based on distance change
  const getPinchDist = () => {
    const pts = [...activePointers.current.values()];
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onDown = e => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
      isDragging.current = true;
      lastMouse.current = {x:e.clientX,y:e.clientY};
      pointerDownPos.current = {x:e.clientX,y:e.clientY};
    } else if (activePointers.current.size === 2) {
      isDragging.current = false; // Cancel drag when pinching
      lastPinchDist.current = getPinchDist();
    }
  };
  const onMove = e => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const mx = e.clientX, my = e.clientY;

    // Pinch-to-zoom with two active pointers
    if (activePointers.current.size >= 2) {
      const dist = getPinchDist();
      if (lastPinchDist.current > 0 && dist > 0) {
        const ratio = lastPinchDist.current / dist;
        const newFov = Math.max(12, Math.min(160, fovRef.current * ratio));
        fovRef.current = newFov;
        setFov(newFov);
      }
      lastPinchDist.current = dist;
      return;
    }

    // ── Throttled hover detection with squared distance (no sqrt) ──
    const now = performance.now();
    if (now - lastHoverCheckRef.current > 100) {
      lastHoverCheckRef.current = now;
      let cl = null, cdSq = 28 * 28; // squared threshold (28px)
      const positions = starPositions.current;
      for (let i = 0; i < positions.length; i++) {
        const s = positions[i];
        const dxS = s.screenX - mx, dyS = s.screenY - my;
        const dSq = dxS * dxS + dyS * dyS;
        if (dSq < cdSq) { cl = s; cdSq = dSq; }
      }
      setHoveredStar(cl);
    }

    if (!isDragging.current) return;
    const dx = mx - lastMouse.current.x, dy = my - lastMouse.current.y;
    lastMouse.current = {x:mx,y:my};
    const totalDist = Math.sqrt((mx-pointerDownPos.current.x)**2 + (my-pointerDownPos.current.y)**2);
    if (drawMode && totalDist < 8) return; // Don't drag yet in draw mode until threshold
    const sens = fovRef.current / 800;
    // Update refs directly during drag, no state updates, no re-renders
    viewRaRef.current = ((viewRaRef.current - dx*sens) % 360 + 360) % 360;
    viewDecRef.current = Math.max(-89, Math.min(89, viewDecRef.current + dy*sens));
  };
  const onUp = e => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) lastPinchDist.current = 0;

    const mx = e.clientX, my = e.clientY;
    const totalDist = Math.sqrt((mx-pointerDownPos.current.x)**2 + (my-pointerDownPos.current.y)**2);

    // Sync ref values back to state on pointer up (single batched update)
    if (isDragging.current) {
      setViewRa(viewRaRef.current);
      setViewDec(viewDecRef.current);
    }

    // If in draw mode and this was a click (not a drag), add star to constellation
    if (drawMode && totalDist < 8 && !namingMode) {
      let closest = null, closestDistSq = 45 * 45; // Squared threshold
      starPositions.current.forEach(s => {
        const dxS = s.screenX-mx, dyS = s.screenY-my;
        const dSq = dxS*dxS + dyS*dyS;
        if(dSq<closestDistSq){closest=s;closestDistSq=dSq;}
      });
      if (closest) {
        const last = currentDrawing[currentDrawing.length - 1];
        if (!last || last.newRa !== closest.newRa || last.newDec !== closest.newDec) {
          setCurrentDrawing(prev => [...prev, {
            name: closest.name || `Star (${closest.newRa.toFixed(1)}°, ${closest.newDec.toFixed(1)}°)`,
            newRa: closest.newRa,
            newDec: closest.newDec,
            appMag: closest.appMag,
            rgb: closest.rgb,
          }]);
        }
      }
    }

    isDragging.current = false;
  };
  const onWheel = e => { e.preventDefault(); setFov(p => Math.max(12, Math.min(160, p + (e.deltaY > 0 ? 5 : -5)))); };

  // ── Constellation drawing actions ───────────────────
  const undoLastStar = () => setCurrentDrawing(prev => prev.slice(0, -1));

  const cancelDrawing = () => {
    setCurrentDrawing([]);
    setDrawMode(false);
    setNamingMode(false);
    setConstellationName("");
  };

  const finishDrawing = () => {
    if (currentDrawing.length < 2) return;
    setNamingMode(true);
    setConstellationName("");
  };

  const saveConstellation = () => {
    if (!constellationName.trim() || currentDrawing.length < 2) return;
    const centRa = currentDrawing.reduce((s,c) => s+c.newRa, 0) / currentDrawing.length;
    const centDec = currentDrawing.reduce((s,c) => s+c.newDec, 0) / currentDrawing.length;
    setCustomConstellations(prev => [...prev, {
      id: Date.now(),
      name: constellationName.trim(),
      stars: [...currentDrawing],
      color: drawColor,
      visible: true,
      planetIndex: customMode ? -1 : selectedPlanet,
      planetName: planet.planet,
      centRa, centDec,
    }]);
    setCurrentDrawing([]);
    setNamingMode(false);
    setConstellationName("");
    setDrawMode(false);
  };

  const deleteConstellation = (id) => setCustomConstellations(prev => prev.filter(c => c.id !== id));
  const toggleConstellation = (id) => setCustomConstellations(prev => prev.map(c => c.id === id ? {...c, visible: !c.visible} : c));

  const exportConstellations = () => {
    const data = customConstellations.map(c => ({
      name: c.name,
      color: c.color,
      planet: c.planetName || EXOPLANET_SYSTEMS[c.planetIndex]?.planet || "Unknown",
      stars: c.stars.map(s => ({ name: s.name, ra: s.newRa, dec: s.newDec, appMag: s.appMag })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `exosky-constellations-${EXOPLANET_SYSTEMS[selectedPlanet].planet.replace(/\s+/g,'-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const findSol = () => {
    const sol = transformedStars.find(s => s.isSol);
    if (sol) { setViewRa(sol.newRa); setViewDec(sol.newDec); setFov(40); }
  };

  const solData = useMemo(() => transformedStars.find(s => s.isSol), [transformedStars]);
  const visibleCount = useMemo(() => {
    const lim = showAtmosphere ? 6.5 - atmo.extinction*atmoDensity*2.5 : 6.5;
    return transformedStars.filter(s => s.appMag < lim).length + backgroundField.filter(s => s.baseMag < lim).length;
  }, [transformedStars, backgroundField, showAtmosphere, atmo, atmoDensity]);

  // Consequence flag (Brief S4, 11-SIMULATOR-CONSTELLATION.md §2) — a pure
  // predicate over the readout above, not a separate data source.
  const simFlags = useMemo(() => evaluateExoSkyFlags({ visibleCount }), [visibleCount]);

  // ── Galactic arm info ───────────────────────────────
  const armInfo = useMemo(() => {
    const R = Math.sqrt(obsGC[0]**2 + obsGC[1]**2);
    const theta = Math.atan2(obsGC[1], obsGC[0]);
    let closestArm = "Inter-arm region";
    let minD = Infinity;
    for (const arm of SPIRAL_ARMS) {
      const armAngle = arm.theta0 + spiralArmAngle(R);
      let dT = theta - armAngle;
      dT = ((dT % (2*Math.PI)) + 3*Math.PI) % (2*Math.PI) - Math.PI;
      const d = Math.abs(dT) * R;
      if (d < minD) { minD = d; closestArm = arm.name; }
    }
    const inArm = minD < ARM_WIDTH * 1.5;
    return {
      R: R.toFixed(0),
      closestArm,
      inArm,
      distToArm: minD.toFixed(0),
      z: obsGC[2].toFixed(0),
    };
  }, [obsGC]);

  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="exosky-root" style={{ width:"100%", height:"100%", overflow:"hidden", background:"#09090B", position:"relative", cursor: drawMode ? "crosshair" : isDragging.current?"grabbing":"grab", fontFamily:"'DM Sans',sans-serif" }}>
      <canvas ref={canvasRef} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel} />

      {/* ── TITLE ── */}
      <div style={{ position:"absolute",top:16,left:18,zIndex:10,pointerEvents:"none" }}>
        <div style={{ fontFamily:"'MD Nichrome','Jura',sans-serif",fontWeight:300,fontSize:26,letterSpacing:6,textTransform:"uppercase",color:"#FAFAFA" }}>EXOSKY</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(21,193,123,0.6)",marginTop:4 }}>{planet.planet}</div>
        <div style={{ display:"inline-block",marginTop:8,padding:"6px 14px",fontSize:12,fontFamily:"'MD Nichrome','Jura',sans-serif",fontWeight:300,letterSpacing:2,textTransform:"uppercase",borderRadius:0,
          background: mwReady ? "rgba(21,193,123,0.08)" : "rgba(255,165,0,0.08)",
          border: mwReady ? "1px solid rgba(21,193,123,0.2)" : "1px solid rgba(255,165,0,0.2)",
          color: mwReady ? "#15C17B" : "#FFA500",
          transition:"all 0.5s",
        }}>{mwReady ? "OBSERVING" : "COMPUTING"}</div>
      </div>

      {/* ── CONTROL PANEL ── */}
      <div style={{ position:"absolute",top:120,left:18,
        width: isMobile ? undefined : 272,
        right: isMobile ? 18 : undefined,
        zIndex:10,
        maxHeight: isMobile ? "30vh" : "calc(100% - 150px)",
        overflowY:"auto",
        background: panelOpen?"rgba(15,15,16,0.92)":"rgba(15,15,16,0.7)", border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(16px)",borderRadius:0,padding:panelOpen?"14px 18px":"8px 14px",transition:"all 0.3s" }}>
        <div onClick={()=>setPanelOpen(!panelOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={SH}>OBSERVATION POINT</span>
          <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>{panelOpen?"▾":"▸"}</span>
        </div>
        {panelOpen && <>
          <select value={worldEntityId ? `world:${worldEntityId}` : (customMode ? "custom" : String(selectedPlanet))} onChange={e=>{
            const val = e.target.value;
            // A <select> only fires onChange when the value actually
            // changes, so reaching this handler always means the writer
            // picked something other than whatever was already showing.
            // That is never the original handoff, so its stale note (wrong
            // planet type, wrong AU, wrong star) should not follow them to
            // wherever they picked next.
            setHandoffPayload(null);
            if (val === "custom") {
              setCustomMode(true); setWorldEntityId(null);
            } else if (val.startsWith("world:")) {
              setWorldEntityId(val.slice(6));
              setCustomMode(false);
            } else {
              setCustomMode(false); setWorldEntityId(null); setSelectedPlanet(Number(val));
            }
            setViewRa(180);setViewDec(10);}} style={SEL}>
            {EXOPLANET_SYSTEMS.map((p,i) => <option key={i} value={String(i)}>{p.planet} ({(p.dist*3.262).toFixed(1)} ly)</option>)}
            <option value="custom">── Custom Coordinates ──</option>
            {worldId && worldObservationEntities.length > 0 && (
              <optgroup label="── From Your World ──">
                {worldObservationEntities.map((e) => {
                  const meta = (e.metadata ?? {}) as Record<string, unknown>;
                  const c = meta.exoskyCoords as { distancePc?: number } | undefined;
                  const lyTag = c?.distancePc ? ` (${(c.distancePc*3.262).toFixed(1)} ly)` : ", needs coords";
                  return <option key={e.id} value={`world:${e.id}`}>{e.name}{lyTag}</option>;
                })}
              </optgroup>
            )}
          </select>
          {worldEntity && !worldEntityCoords && (
            <div style={{marginTop:10,padding:"10px 12px",background:"rgba(255,184,0,0.06)",border:"1px solid rgba(255,184,0,0.2)",borderRadius:0}}>
              <div style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,textTransform:"uppercase",color:"#FFB800",marginBottom:4}}>
                // COORDINATES NOT SET
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5,marginBottom:8}}>
                <strong style={{color:"rgba(255,255,255,0.85)"}}>{worldEntity.name}</strong> has no galactic coordinates yet. Use the sliders below to set them, then save back to the entity.
              </div>
              <button
                onClick={() => setCustomMode(true)}
                style={{...BTN,width:"100%",fontSize:12,padding:"6px 10px",background:"rgba(255,184,0,0.08)",borderColor:"rgba(255,184,0,0.25)",color:"#FFB800"}}
              >
                ✦ AUTHOR COORDINATES
              </button>
            </div>
          )}
          {worldEntity && worldEntityCoords && (
            <div style={{marginTop:10,padding:"8px 10px",background:"rgba(21,193,123,0.04)",border:"1px solid rgba(21,193,123,0.15)",borderRadius:0}}>
              <div style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,textTransform:"uppercase",color:"#15C17B",marginBottom:4}}>
                // FROM YOUR WORLD
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>
                Stored: RA {worldEntityCoords.ra.toFixed(2)}° · Dec {worldEntityCoords.dec.toFixed(2)}° · {worldEntityCoords.distancePc.toFixed(1)} pc
              </div>
            </div>
          )}
          {customMode && (
            <div style={{marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={LBL}>Galactic l (°)</span>
                <input type="number" value={customGalL} onChange={e=>setCustomGalL(Math.max(0, Math.min(360,Number(e.target.value)||0)))}
                  min={0} max={360} step={0.1} style={NUM_INPUT} />
              </div>
              <input type="range" min="0" max="360" step="0.5" value={customGalL} onChange={e=>setCustomGalL(Number(e.target.value))} style={{width:"100%"}} />

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,marginBottom:4}}>
                <span style={LBL}>Galactic b (°)</span>
                <input type="number" value={customGalB} onChange={e=>setCustomGalB(Math.max(-90,Math.min(90,Number(e.target.value)||0)))}
                  min={-90} max={90} step={0.1} style={NUM_INPUT} />
              </div>
              <input type="range" min="-90" max="90" step="0.5" value={customGalB} onChange={e=>setCustomGalB(Number(e.target.value))} style={{width:"100%"}} />

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,marginBottom:4}}>
                <span style={LBL}>Distance (pc)</span>
                <input type="number" value={customDistPc} onChange={e=>setCustomDistPc(Math.max(0.1,Number(e.target.value)||0.1))}
                  min={0.1} max={10000} step={1} style={NUM_INPUT} />
              </div>
              <input type="range" min="1" max="5000" step="1" value={Math.min(5000,customDistPc)} onChange={e=>setCustomDistPc(Number(e.target.value))} style={{width:"100%"}} />

              <div style={{marginTop:6,padding:"6px 8px",background:"rgba(21,193,123,0.04)",borderRadius:0,border:"1px solid rgba(21,193,123,0.08)"}}>
                <div style={{fontSize:11,color:"rgba(21,193,123,0.3)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.7}}>
                  RA {planet.ra.toFixed(2)}° · Dec {planet.dec.toFixed(2)}°<br/>
                  {(customDistPc*3.262).toFixed(1)} ly from Sol
                </div>
              </div>

              <div style={{marginTop:6,fontSize:11,color:"rgba(255,255,255,0.2)",lineHeight:1.6}}>
                l=0° → Galactic center · b=0° → Galactic plane<br/>
                Distance is from Sol (heliocentric)
              </div>

              {worldEntity && (
                <button
                  onClick={saveCoordsToEntity}
                  disabled={updateEntity.isPending}
                  style={{
                    ...BTN,
                    marginTop:10,
                    width:"100%",
                    fontSize:12,
                    padding:"7px 10px",
                    background:"rgba(21,193,123,0.10)",
                    borderColor:"rgba(21,193,123,0.30)",
                    color:"#15C17B",
                    opacity: updateEntity.isPending ? 0.5 : 1,
                  }}
                  title="Persist these coordinates onto the world entity (saved to metadata.exoskyCoords)"
                >
                  {updateEntity.isPending ? "SAVING…" : `↳ SAVE TO ${worldEntity.name.toUpperCase()}`}
                </button>
              )}
            </div>
          )}
          <div style={{marginTop:8,fontSize:8.5,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{planet.note}</div>
          <div style={{marginTop:4,fontSize:12,color:"rgba(21,193,123,0.35)",fontFamily:"'JetBrains Mono',monospace"}}>{planet.armNote}</div>

          <div style={{...SH,marginTop:14}}>ATMOSPHERE</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <span style={LBL}>Type</span><span style={VAL}>{atmo.name}</span>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>{atmo.desc}</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,alignItems:"center"}}>
            <span style={LBL}>Density</span><span style={VAL}>{atmoDensity.toFixed(1)}×</span>
          </div>
          <input type="range" min="0" max="3" step="0.1" value={atmoDensity} onChange={e=>setAtmoDensity(Number(e.target.value))} style={{width:"100%",marginTop:4}} />

          <div style={{...SH,marginTop:14}}>MILKY WAY</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,alignItems:"center"}}>
            <span style={LBL}>Brightness</span><span style={VAL}>{mwBrightness.toFixed(1)}×</span>
          </div>
          <input type="range" min="0" max="3" step="0.1" value={mwBrightness} onChange={e=>setMwBrightness(Number(e.target.value))} style={{width:"100%",marginTop:4}} />

          <div style={{...SH,marginTop:14}}>EPOCH</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,alignItems:"center"}}>
            <span style={LBL}>Years From Now</span>
            <span style={VAL}>{epochYears===0 ? "NOW" : `${epochYears>0?"+":""}${epochYears.toLocaleString()}`}</span>
          </div>
          <input type="range" min="-13000" max="13000" step="50" value={epochYears} onChange={e=>setEpochYears(Number(e.target.value))} style={{width:"100%",marginTop:4}} />
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4,lineHeight:1.5}}>
            Axial precession slowly turns which star sits near the pole. Real stars do not move on this timeline, only which direction the observer's pole points.
          </div>

          <div style={{...SH,marginTop:14}}>DISPLAY</div>
          {[
            ["Milky Way Band", showMilkyWay, setShowMilkyWay],
            ["Atmosphere Effects", showAtmosphere, setShowAtmosphere],
            ["Horizon Line", showHorizon, setShowHorizon],
            ["Star Names", showStarNames, setShowStarNames],
            ["Earth Constellations", showConstellations, setShowConstellations],
            ["Coordinate Grid", showGrid, setShowGrid],
            ["Highlight Sol", highlightSol, setHighlightSol],
          ].map(([label, val, set]) => (
            <label key={label} style={CKL}>
              <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} style={CK} />{label}
            </label>
          ))}

          <button onClick={findSol} style={{...BTN,marginTop:12,width:"100%"}}>☉ FIND OUR SUN</button>

          <div style={{...SH,marginTop:14}}>CONSTELLATION DRAWER</div>
          {!drawMode ? (
            <button onClick={() => setDrawMode(true)} style={{...BTN,marginTop:8,width:"100%",background:"rgba(255,165,0,0.08)",borderColor:"rgba(255,165,0,0.25)",color:"#FFA500"}}>
              ✦ DRAW CONSTELLATION
            </button>
          ) : (
            <div style={{marginTop:6}}>
              {/* Color picker */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                {DRAW_COLORS.map(c => (
                  <div key={c.hex} onClick={() => setDrawColor(c.hex)}
                    style={{width:18,height:18,borderRadius:0,background:c.hex,cursor:"pointer",
                      border: drawColor === c.hex ? "2px solid #fff" : "2px solid transparent",
                      opacity: drawColor === c.hex ? 1 : 0.5, transition:"all 0.15s"}} 
                    title={c.name} />
                ))}
              </div>

              {/* Star count */}
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8}}>
                {currentDrawing.length === 0 ? "Click stars to connect them" :
                 `${currentDrawing.length} star${currentDrawing.length !== 1 ? 's' : ''} selected`}
              </div>

              {/* Star list */}
              {currentDrawing.length > 0 && (
                <div style={{maxHeight:80,overflowY:"auto",marginBottom:8,padding:"4px 0"}}>
                  {currentDrawing.map((s, i) => (
                    <div key={i} style={{fontSize:12,color:"rgba(255,255,255,0.35)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.8}}>
                      <span style={{color:drawColor,marginRight:6}}>{i+1}.</span>{s.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {currentDrawing.length > 0 && (
                  <button onClick={undoLastStar} style={{...BTN,flex:1,fontSize:11,padding:"5px 6px",background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>
                    ↩ UNDO
                  </button>
                )}
                {currentDrawing.length >= 2 && (
                  <button onClick={finishDrawing} style={{...BTN,flex:1,fontSize:11,padding:"5px 6px",background:"rgba(46,204,113,0.1)",borderColor:"rgba(46,204,113,0.3)",color:"#2ECC71"}}>
                    ✓ NAME IT
                  </button>
                )}
                <button onClick={cancelDrawing} style={{...BTN,flex:1,fontSize:11,padding:"5px 6px",background:"rgba(231,76,60,0.08)",borderColor:"rgba(231,76,60,0.2)",color:"#E74C3C"}}>
                  ✕ CANCEL
                </button>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.15)",marginTop:6}}>Esc to cancel · Ctrl+Z to undo</div>
            </div>
          )}

          {/* Saved constellations count */}
          {customConstellations.length > 0 && (
            <div style={{marginTop:8}}>
              <label style={CKL}>
                <input type="checkbox" checked={showCustomConstellations} onChange={e=>setShowCustomConstellations(e.target.checked)} style={CK} />
                Custom Constellations ({customConstellations.length})
              </label>
              <button onClick={() => setConsManagerOpen(!consManagerOpen)} style={{...BTN,marginTop:6,width:"100%",fontSize:11,padding:"4px 8px",background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)"}}>
                {consManagerOpen ? "▾" : "▸"} MANAGE
              </button>
            </div>
          )}

          <div style={{...SH,marginTop:14}}>NAVIGATION</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.7}}>
            Drag to look around · Scroll to zoom<br/>Hover stars for data
          </div>
        </>}
      </div>

      {/* ── DATA READOUT ── (slides left when NarrativeBridge is open so it doesn't overlap) */}
      <div style={{
        position:"absolute",
        // On mobile the panel is full-width, so it stacks below the control
        // panel instead of sitting beside it. The offset is computed from the
        // control panel's own top (120) and cap (30vh) rather than a fixed
        // px or vh guess, so the gap holds on any phone height.
        top: isMobile ? "calc(120px + 30vh + 12px)" : 16,
        right: isMobile ? 18 : (narrativeBridgeOpen ? 18 + 320 + 12 : 18),
        left: isMobile ? 18 : undefined,
        width: isMobile ? undefined : 320,
        zIndex:10,
        maxHeight: isMobile ? "26vh" : "calc(100% - 80px)",
        overflowY:"auto",
        background:"rgba(15,15,16,0.92)",
        border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(16px)",
        borderRadius:0,
        padding:"16px 20px",
        transition:"right 280ms cubic-bezier(0.2, 0, 0, 1)",
      }}>
        <div onClick={()=>setDataOpen(!dataOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
          <span style={SH}>SYSTEM DATA</span>
          <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>{dataOpen?"▾":"▸"}</span>
        </div>
        {dataOpen && <>
          <DR l="Host Star" v={planet.star} vc="#FFD43B" />
          <DR l="Distance" v={`${(planet.dist*3.262).toFixed(1)} ly`} />
          <DR l="RA / Dec" v={`${planet.ra.toFixed(1)}° / ${planet.dec.toFixed(1)}°`} />

          <div style={{...SH,marginTop:12}}>GALACTIC POSITION</div>
          <DR l="Galactocentric R" v={`${armInfo.R} pc`} />
          <DR l="Height (z)" v={`${armInfo.z} pc`} />
          <DR l="Nearest Arm" v={armInfo.closestArm} vc={armInfo.inArm?"#2ECC71":"rgba(255,255,255,0.5)"} />
          <DR l="Arm Distance" v={`${armInfo.distToArm} pc`} />
          <DR l="In Arm?" v={armInfo.inArm?"Yes":"No"} vc={armInfo.inArm?"#2ECC71":"#E74C3C"} />

          <div style={{...SH,marginTop:12}}>SOL FROM HERE</div>
          {solData && <>
            <DR l="Apparent Mag" v={solData.appMag.toFixed(2)} vc="#FFD43B" />
            <DR l="Distance" v={`${(solData.newDist*3.262).toFixed(2)} ly`} />
            <DR l="Visibility" v={solData.appMag<1?"Bright star":solData.appMag<3?"Visible":solData.appMag<6?"Faint":"Invisible"} vc={solData.appMag<6?"#2ECC71":"#E74C3C"} />
          </>}

          <div style={{...SH,marginTop:12}}>SKY STATISTICS</div>
          <DR l="Catalog Stars" v={`${(starCatalog || []).length}`} />
          <DR l="Galactic Stars" v={`${transformedStars.length}`} />
          <DR l="Background Field" v={`${backgroundField.length}`} />
          <DR l="Naked Eye" v={`${visibleCount}`} />
          {simFlags.filter(f => !dismissedFlagIds.has(flagDismissKey(f))).map(f => (
            <div key={f.id} style={{borderLeft:"2px solid #FFB800",background:"rgba(255,184,0,0.06)",padding:"6px 8px",margin:"6px 0",position:"relative"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:1.2,textTransform:"uppercase",color:"#FFB800"}}>{f.title}</div>
              <div style={{fontFamily:"'DM Sans',serif",fontStyle:"italic",fontSize:12,lineHeight:1.5,color:"rgba(255,255,255,0.7)",marginTop:4,paddingRight:16}}>{f.body}</div>
              <button
                type="button"
                onClick={() => dismissFlag(flagDismissKey(f))}
                aria-label={`Dismiss: ${f.title}`}
                style={{position:"absolute",top:6,right:6,background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,lineHeight:1,padding:4}}
              >
                ×
              </button>
            </div>
          ))}
          <DR l="Custom Constellations" v={`${customConstellations.length}`} />
          <DR l="Extinction" v={`${(atmo.extinction*atmoDensity).toFixed(2)} mag`} />

          <div style={{...SH,marginTop:12}}>VIEW</div>
          <DR l="RA / Dec" v={`${viewRa.toFixed(1)}° / ${viewDec.toFixed(1)}°`} />
          <DR l="FOV" v={`${fov}°`} />
          <DR l="Epoch" v={epochYears===0 ? "Now (J2000)" : `${epochYears>0?"+":""}${epochYears.toLocaleString()} yr`} vc={epochYears!==0?"#FFD43B":undefined} />

          {hoveredStar && <>
            <div style={{...SH,marginTop:12,color:"rgba(21,193,123,0.5)"}}>SELECTED STAR</div>
            <DR l="Name" v={hoveredStar.name || "Unnamed"} vc={`rgb(${hoveredStar.rgb.join(",")})`} />
            <DR l="Mag (here)" v={hoveredStar.appMag.toFixed(2)} />
            <DR l="Mag (Earth)" v={apparentMag(hoveredStar.absMag, hoveredStar.dist).toFixed(2)} />
            <DR l="Distance" v={`${(hoveredStar.newDist*3.262).toFixed(2)} ly`} />
            <DR l="B-V Index" v={hoveredStar.bv.toFixed(2)} />
          </>}
        </>}
      </div>

      {/* ── NAMING MODAL ── */}
      {namingMode && (
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}}>
          <div style={{background:"rgba(15,15,16,0.96)",border:"1px solid rgba(0,229,160,0.08)",borderRadius:0,padding:"28px 32px",width:340,maxWidth:"90vw"}}>
            <div style={{...SH,marginBottom:12,fontSize:12,borderBottom:"1px solid rgba(21,193,123,0.1)",paddingBottom:8}}>NAME YOUR CONSTELLATION</div>
            
            {/* Preview line */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
              <div style={{width:40,height:2,background:drawColor,borderRadius:1}} />
              <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{currentDrawing.length} stars connected</span>
            </div>

            <input
              type="text"
              value={constellationName}
              onChange={e => setConstellationName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveConstellation(); }}
              placeholder="e.g. The Wanderer, Kzinti Claw..."
              autoFocus
              maxLength={40}
              style={{
                width:"100%",fontFamily:"'MD Nichrome','Jura',sans-serif",fontSize:14,fontWeight:300,
                letterSpacing:2,textTransform:"uppercase",
                background:"rgba(255,255,255,0.04)",color:"#FAFAFA",
                border:`1px solid ${drawColor}44`,borderRadius:0,
                padding:"12px 14px",outline:"none",
                transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = drawColor + "88"}
              onBlur={e => e.target.style.borderColor = drawColor + "44"}
            />

            {/* Color adjustment */}
            <div style={{display:"flex",gap:5,marginTop:14,alignItems:"center"}}>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginRight:4}}>COLOR</span>
              {DRAW_COLORS.map(c => (
                <div key={c.hex} onClick={() => setDrawColor(c.hex)}
                  style={{width:16,height:16,borderRadius:0,background:c.hex,cursor:"pointer",
                    border: drawColor === c.hex ? "2px solid #fff" : "2px solid transparent",
                    opacity: drawColor === c.hex ? 1 : 0.4, transition:"all 0.15s"}} />
              ))}
            </div>

            {/* Star list preview */}
            <div style={{marginTop:14,maxHeight:100,overflowY:"auto",padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              {currentDrawing.map((s, i) => (
                <div key={i} style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.9}}>
                  <span style={{color:drawColor+"88",marginRight:6}}>{i+1}.</span>
                  {s.name}
                  <span style={{color:"rgba(255,255,255,0.15)",marginLeft:6}}>mag {s.appMag.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={() => { setNamingMode(false); setConstellationName(""); }}
                style={{...BTN,flex:1,background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>
                ← BACK
              </button>
              <button onClick={saveConstellation}
                disabled={!constellationName.trim()}
                style={{...BTN,flex:2,
                  background: constellationName.trim() ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.02)",
                  borderColor: constellationName.trim() ? "rgba(46,204,113,0.3)" : "rgba(255,255,255,0.05)",
                  color: constellationName.trim() ? "#2ECC71" : "rgba(255,255,255,0.2)",
                  cursor: constellationName.trim() ? "pointer" : "not-allowed",
                }}>
                ✦ SAVE CONSTELLATION
              </button>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.15)",marginTop:10,textAlign:"center"}}>Press Enter to save · Esc to go back</div>
          </div>
        </div>
      )}

      {/* ── CONSTELLATION MANAGER ── */}
      {consManagerOpen && customConstellations.length > 0 && (
        <div style={{position:"absolute",bottom:40,left:18,
          width: isMobile ? undefined : 260,
          right: isMobile ? 18 : undefined,
          zIndex:20,
          background:"rgba(15,15,16,0.94)",border:"1px solid rgba(255,255,255,0.08)",
          backdropFilter:"blur(16px)",borderRadius:0,padding:"14px 18px",maxHeight:"40vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={SH}>YOUR CONSTELLATIONS</span>
            <span onClick={() => setConsManagerOpen(false)} style={{cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:12}}>✕</span>
          </div>
          {customConstellations.map(cons => (
            <div key={cons.id} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                <div style={{width:10,height:10,borderRadius:0,background:cons.color,flexShrink:0,opacity:cons.visible?1:0.3}} />
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,color:cons.visible?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.25)",fontFamily:"'MD Nichrome','Jura',sans-serif",fontWeight:300,letterSpacing:1,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {cons.name}
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace"}}>
                    {cons.stars.length} stars · {cons.planetName || EXOPLANET_SYSTEMS[cons.planetIndex]?.planet || "?"}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {/* Navigate to constellation */}
                <button onClick={() => { setViewRa(cons.centRa); setViewDec(cons.centDec); }}
                  style={{...MINI_BTN}} title="Navigate to">⌖</button>
                {/* Toggle visibility */}
                <button onClick={() => toggleConstellation(cons.id)}
                  style={{...MINI_BTN,opacity:cons.visible?1:0.4}} title={cons.visible?"Hide":"Show"}>
                  {cons.visible ? "◉" : "○"}
                </button>
                {/* Delete */}
                <button onClick={() => deleteConstellation(cons.id)}
                  style={{...MINI_BTN,color:"#E74C3C"}} title="Delete">✕</button>
              </div>
            </div>
          ))}
          {customConstellations.length > 0 && (
            <button onClick={exportConstellations} style={{...BTN,marginTop:12,width:"100%",fontSize:11,padding:"5px 10px"}}>
              ↓ EXPORT ALL (JSON)
            </button>
          )}
        </div>
      )}

      {/* ── KEYBOARD HELP ── (sits left of data panel; further left when bridge is open) */}
      {showKbHelp && (
        <div style={{
          position:"absolute",
          top: isMobile ? 16 : 16,
          // The desktop formula chains off the data panel's fixed 320px width;
          // on mobile that panel has no fixed width, so the same sum would
          // place this off the right edge of a 390px screen entirely.
          right: isMobile ? 18 : (narrativeBridgeOpen ? 18 + 320 + 12 + 320 + 12 : 18 + 320 + 12),
          left: isMobile ? 18 : undefined,
          zIndex:50,
          width: isMobile ? undefined : 210,
          maxHeight: isMobile ? "60vh" : undefined,
          overflowY: isMobile ? "auto" : undefined,
          background:"rgba(15,15,16,0.92)",
          border:"1px solid rgba(255,255,255,0.08)",
          WebkitBackdropFilter:"blur(16px)",
          backdropFilter:"blur(16px)",
          borderRadius:0,
          padding:"14px 18px",
          transition:"right 280ms cubic-bezier(0.2, 0, 0, 1)",
        }}>
          <div style={{fontSize:7.5,fontFamily:"'MD Nichrome','Jura',sans-serif",fontWeight:300,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(0,229,160,0.55)",marginBottom:8,paddingBottom:3,borderBottom:"1px solid rgba(0,229,160,0.1)"}}>Keyboard Shortcuts</div>
          {[["Drag","Pan sky"],["Scroll / Pinch","Zoom FOV"],["Esc","Cancel / Close"],["Ctrl+Z","Undo star (draw)"],["Enter","Save constellation"],["?","Toggle this help"]].map(([key,desc])=>(
            <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",lineHeight:"2"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#15C17B",fontWeight:400,minWidth:56}}>{key}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8.5,color:"rgba(255,255,255,0.55)",textAlign:"right"}}>{desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── CREDITS ── */}
      <div style={{ position:"absolute",bottom:14,left:18,zIndex:10,fontFamily:"'DM Sans',sans-serif",fontSize:11,letterSpacing:1,color:"rgba(255,255,255,0.12)",pointerEvents:"none" }}>
        © 2025–2026 JASON D. BATT, PH.D. · <span style={{color:"rgba(21,193,123,0.25)"}}>STELLARFORGE.TOOLS</span> · <a href="/tools/exosky/science" style={{color:"rgba(21,193,123,0.25)",textDecoration:"none",pointerEvents:"auto"}}>The Science</a>
      </div>

      <style>{`
        .exosky-root ::-webkit-scrollbar{width:3px}.exosky-root ::-webkit-scrollbar-track{background:transparent}.exosky-root ::-webkit-scrollbar-thumb{background:rgba(21,193,123,0.12)}
        .exosky-root input[type=range]{-webkit-appearance:none;width:100%;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;outline:none}
        .exosky-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;background:#15C17B;cursor:pointer;border:2px solid rgba(0,0,0,0.5)}
        .exosky-root input[type=checkbox]{accent-color:#15C17B;width:11px;height:11px}
        .exosky-root input[type=number]{-moz-appearance:textfield}.exosky-root input[type=number]::-webkit-outer-spin-button,.exosky-root input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        .exosky-root select option{background:#0F0F10;color:#C8C8C8}
      `}</style>
    </div>
  );
}

// ── DATA ROW COMPONENT ────────────────────────────────────────
function DR({ l, v, vc }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",lineHeight:1.9,alignItems:"baseline"}}>
      <span style={{color:"rgba(255,255,255,0.55)",fontWeight:300,fontFamily:"'DM Sans',sans-serif",fontSize:12}}>{l}</span>
      <span style={{color:vc||"rgba(255,255,255,0.85)",fontWeight:500,fontFamily:"'JetBrains Mono',monospace",fontSize:14}}>{v}</span>
    </div>
  );
}

// ── STYLE TOKENS ──────────────────────────────────────────────
const SH = { fontSize:12,fontFamily:"'MD Nichrome','Jura',sans-serif",fontWeight:300,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(0,229,160,0.5)",marginTop:0,marginBottom:2,paddingBottom:3,borderBottom:"1px solid rgba(0,229,160,0.1)",width:"100%" } as const;
const LBL = { fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:300,color:"rgba(255,255,255,0.55)" };
const VAL = { fontSize:14,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,color:"rgba(255,255,255,0.85)" };
const SEL = { width:"100%",marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:12,background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.78)",border:"1px solid rgba(255,255,255,0.1)",padding:"7px 10px",borderRadius:0,outline:"none" };
const BTN = { fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:400,letterSpacing:1.5,textTransform:"uppercase",padding:"7px 12px",border:"1px solid rgba(21,193,123,0.2)",background:"rgba(21,193,123,0.08)",color:"#15C17B",cursor:"pointer",borderRadius:0,transition:"all 0.2s" } as const;
const CKL = { display:"flex",alignItems:"center",gap:8,marginTop:6,fontSize:12,color:"rgba(255,255,255,0.5)",cursor:"pointer" };
const CK = { accentColor:"#15C17B",width:11,height:11 };
const NUM_INPUT = { width:55,fontFamily:"'JetBrains Mono',monospace",fontSize:12,background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.08)",padding:"3px 5px",borderRadius:0,outline:"none",textAlign:"right" } as const;
const MINI_BTN = { background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:0,padding:"2px 6px",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1,transition:"all 0.15s" };
