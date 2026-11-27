/* ==========================================================================
   physics.js: the shared physics for the static simulators (window.SFPhysics).

   Plain-JS twin of src/lib/physics/ (constants.ts, mainSequence.ts,
   formulas.ts, and the Kopparapu table in src/lib/habitable-zone/
   kopparapu.ts). Same constants, same formulas, same function names.
   src/lib/physics/__tests__/parity.test.ts loads this file and fails on any
   drift, so change both or neither. Sources are cited in the TS module;
   short citations repeat here.

   No dependencies, no globals but SFPhysics.
   ========================================================================== */
(function () {
  'use strict';
  if (typeof window !== 'undefined' && window.SFPhysics) return;

  /* ── Constants (CODATA 2018, IAU 2015 B3, Kopp & Lean 2011) ── */
  var G = 6.6743e-11, SIGMA_SB = 5.670374419e-8, K_B = 1.380649e-23, AMU = 1.66053906660e-27;
  var AU_M = 1.495978707e11, M_SUN_KG = 1.98847e30, R_SUN_M = 6.957e8, L_SUN_W = 3.828e26, T_SUN_K = 5772;
  var M_EARTH_KG = 5.9722e24, R_EARTH_M = 6.371e6, M_EARTH_IN_SUN = M_EARTH_KG / M_SUN_KG;
  var S_EARTH_WM2 = 1361, G_EARTH = 9.80665, RHO_EARTH = 5.514, V_ESC_EARTH_KMS = 11.186;
  var DAYS_PER_YEAR = 365.25, SECONDS_PER_YEAR = DAYS_PER_YEAR * 86400;
  var MOLECULAR_MASS = { H2: 2.016, He: 4.003, CH4: 16.043, NH3: 17.031, H2O: 18.015, N2: 28.014, O2: 31.998, Ar: 39.948, CO2: 44.009 };
  var R_GAS = 8.314462618;

  /* ── Main sequence (Pecaut & Mamajek 2013, Mamajek 2022; L by Stefan–Boltzmann) ── */
  var MAIN_SEQUENCE = [
    { spt: 'M8V', teff: 2566, mass: 0.0898, radius: 0.1192 },
    { spt: 'M7V', teff: 2650, mass: 0.097, radius: 0.127 },
    { spt: 'M6V', teff: 2810, mass: 0.105, radius: 0.137 },
    { spt: 'M5V', teff: 3060, mass: 0.16, radius: 0.196 },
    { spt: 'M4V', teff: 3210, mass: 0.23, radius: 0.27 },
    { spt: 'M3V', teff: 3410, mass: 0.36, radius: 0.38 },
    { spt: 'M2V', teff: 3560, mass: 0.44, radius: 0.446 },
    { spt: 'M1V', teff: 3680, mass: 0.5, radius: 0.5 },
    { spt: 'M0V', teff: 3850, mass: 0.57, radius: 0.588 },
    { spt: 'K7V', teff: 4050, mass: 0.63, radius: 0.63 },
    { spt: 'K5V', teff: 4440, mass: 0.7, radius: 0.68 },
    { spt: 'K3V', teff: 4830, mass: 0.78, radius: 0.76 },
    { spt: 'K0V', teff: 5270, mass: 0.88, radius: 0.85 },
    { spt: 'G8V', teff: 5490, mass: 0.94, radius: 0.92 },
    { spt: 'G5V', teff: 5650, mass: 0.98, radius: 0.96 },
    { spt: 'G2V', teff: 5772, mass: 1.0, radius: 1.0 },
    { spt: 'G0V', teff: 5920, mass: 1.05, radius: 1.1 },
    { spt: 'F8V', teff: 6170, mass: 1.15, radius: 1.2 },
    { spt: 'F5V', teff: 6510, mass: 1.33, radius: 1.47 },
    { spt: 'F2V', teff: 6810, mass: 1.46, radius: 1.6 },
    { spt: 'F0V', teff: 7220, mass: 1.61, radius: 1.73 },
    { spt: 'A5V', teff: 8180, mass: 1.86, radius: 1.86 },
    { spt: 'A0V', teff: 9700, mass: 2.34, radius: 2.19 },
    { spt: 'B8V', teff: 12300, mass: 3.4, radius: 2.7 },
    { spt: 'B5V', teff: 15700, mass: 4.7, radius: 3.36 },
    { spt: 'B2V', teff: 20600, mass: 7.3, radius: 4.3 },
    { spt: 'B0V', teff: 31400, mass: 15, radius: 6.5 },
    { spt: 'O5V', teff: 41400, mass: 35, radius: 10 }
  ];

  function luminosityFromRadiusTeff(r, t) { return r * r * Math.pow(t / T_SUN_K, 4); }
  function radiusFromLuminosityTeff(l, t) { return Math.sqrt(Math.max(l, 0)) / Math.pow(t / T_SUN_K, 2); }
  function rowToStar(r, clamped) {
    return { spt: r.spt, mass: r.mass, radius: r.radius, teff: r.teff,
      luminosity: luminosityFromRadiusTeff(r.radius, r.teff), clamped: !!clamped };
  }
  function mainSequenceStar(m) {
    var rows = MAIN_SEQUENCE, first = rows[0], last = rows[rows.length - 1];
    if (!isFinite(m) || m <= first.mass) return rowToStar(first, m !== first.mass);
    if (m >= last.mass) return rowToStar(last, m !== last.mass);
    var i = 1;
    while (rows[i].mass < m) i++;
    var a = rows[i - 1], b = rows[i];
    var t = Math.log(m / a.mass) / Math.log(b.mass / a.mass);
    var teff = Math.exp(Math.log(a.teff) + t * Math.log(b.teff / a.teff));
    var radius = Math.exp(Math.log(a.radius) + t * Math.log(b.radius / a.radius));
    return { spt: t < 0.5 ? a.spt : b.spt, mass: m, radius: radius, teff: teff,
      luminosity: luminosityFromRadiusTeff(radius, teff), clamped: false };
  }
  function starFromSpectralType(spt) {
    var key = String(spt).trim().toUpperCase();
    for (var i = 0; i < MAIN_SEQUENCE.length; i++) if (MAIN_SEQUENCE[i].spt === key) return rowToStar(MAIN_SEQUENCE[i]);
    return null;
  }
  function mainSequenceLifetimeGyr(m, l) { return (10 * m) / Math.max(l, 1e-12); }

  /* ── Kopparapu et al. 2014 HZ (ApJ 787:L29, Table 1), Teff-corrected ── */
  var KOPPARAPU_2014 = {
    recentVenus: [1.776, 2.136e-4, 2.533e-8, -1.332e-11, -3.097e-15],
    runawayGreenhouse: [1.107, 1.332e-4, 1.58e-8, -8.308e-12, -1.931e-15],
    maxGreenhouse: [0.356, 6.171e-5, 1.698e-9, -3.198e-12, -5.575e-16],
    earlyMars: [0.32, 5.547e-5, 1.526e-9, -2.874e-12, -5.011e-16]
  };
  var KOP_T_MIN = 2600, KOP_T_MAX = 7200, KOP_T_SUN = 5780;
  function kopparapuSeff(teff, limit) {
    var c = KOPPARAPU_2014[limit];
    var tc = isFinite(teff) ? Math.max(KOP_T_MIN, Math.min(KOP_T_MAX, teff)) : KOP_T_SUN;
    var t = tc - KOP_T_SUN;
    return c[0] + c[1] * t + c[2] * t * t + c[3] * Math.pow(t, 3) + c[4] * Math.pow(t, 4);
  }
  function kopparapuEdges(teff, lum) {
    var L = Math.max(lum, 1e-10);
    var tc = isFinite(teff) ? Math.max(KOP_T_MIN, Math.min(KOP_T_MAX, teff)) : KOP_T_SUN;
    function d(limit) { return Math.sqrt(L / kopparapuSeff(teff, limit)); }
    return { recentVenus: d('recentVenus'), runawayGreenhouse: d('runawayGreenhouse'),
      maxGreenhouse: d('maxGreenhouse'), earlyMars: d('earlyMars'), teffClamped: !isFinite(teff) || tc !== teff };
  }

  /* ── Orbits (Kepler III in solar units) ── */
  function orbitalPeriodDays(a, mStar, mPlanetEarth) {
    var m = Math.max(mStar + (mPlanetEarth || 0) * M_EARTH_IN_SUN, 1e-12);
    return DAYS_PER_YEAR * Math.sqrt(Math.pow(Math.max(a, 0), 3) / m);
  }
  function semiMajorAxisAU(pDays, mStar, mPlanetEarth) {
    var m = mStar + (mPlanetEarth || 0) * M_EARTH_IN_SUN, p = pDays / DAYS_PER_YEAR;
    return Math.cbrt(Math.max(m, 0) * p * p);
  }
  function insolation(l, a) { return l / Math.max(a * a, 1e-12); }
  function distanceForInsolation(l, s) { return Math.sqrt(Math.max(l, 0) / Math.max(s, 1e-12)); }

  /* ── Temperatures (Cowan & Agol 2011, ApJ 729:54) ── */
  var REDISTRIBUTION = { SUBSTELLAR: 1, DAYSIDE: 0.5, FULL: 0.25 };
  function clamp01(x) { return Math.min(Math.max(x, 0), 1); }
  function irradiationTemperature(s) { return Math.pow((Math.max(s, 0) * S_EARTH_WM2) / SIGMA_SB, 0.25); }
  function equilibriumTemperature(s, albedo, f) {
    if (f === undefined) f = REDISTRIBUTION.FULL;
    return irradiationTemperature(s) * Math.pow((1 - clamp01(albedo)) * f, 0.25);
  }
  function substellarTemperature(s, albedo) { return equilibriumTemperature(s, albedo, REDISTRIBUTION.SUBSTELLAR); }
  /* Showman & Guillot 2002; Koll & Abbot 2016: ε = τ_rad / (τ_rad + τ_adv). */
  function redistributionEfficiency(o) {
    if (!(o.pressureBar > 0)) return 0;
    var cp = o.cpJkgK === undefined ? 1040 : o.cpJkgK;
    var u = o.windMs === undefined ? 20 : o.windMs;
    var T = Math.max(o.temperatureK, 1);
    var tauRad = ((o.pressureBar * 1e5) / Math.max(o.gravityMs2, 1e-6)) * cp / (4 * SIGMA_SB * Math.pow(T, 3));
    var tauAdv = o.radiusM / u;
    return tauRad / (tauRad + tauAdv);
  }
  /* σT(θ)⁴ = S(1−A)[(1−ε)max(cosθ,0) + ε/4]; energy-conserving, continuous. */
  function lockedSurfaceTemperature(s, albedo, eps, thetaDeg) {
    var a = clamp01(albedo), e = clamp01(eps);
    var mu = Math.max(Math.cos((thetaDeg * Math.PI) / 180), 0);
    var flux = Math.max(s, 0) * S_EARTH_WM2 * (1 - a) * ((1 - e) * mu + e / 4);
    return Math.pow(flux / SIGMA_SB, 0.25);
  }
  function lockedHemispheres(s, albedo, eps) {
    var a = clamp01(albedo), e = clamp01(eps);
    var base = (Math.max(s, 0) * S_EARTH_WM2 * (1 - a)) / SIGMA_SB;
    return { day: Math.pow(base * ((1 - e) / 2 + e / 4), 0.25), night: Math.pow(base * (e / 4), 0.25),
      substellar: lockedSurfaceTemperature(s, albedo, eps, 0), terminator: lockedSurfaceTemperature(s, albedo, eps, 90) };
  }

  /* ── Phase boundaries (Clausius–Clapeyron; NIST WebBook reference points) ── */
  function clausiusClapeyronT(p, tRef, pRef, latent) {
    return 1 / (1 / tRef - (R_GAS / latent) * Math.log(Math.max(p, 1e-12) / pRef));
  }
  var CONDENSABLE = { N2: { tRef: 77.36, pRef: 1.01325, latent: 5570 },
    CO2: { tRef: 194.7, pRef: 1.01325, latent: 25200 }, H2: { tRef: 20.3, pRef: 1.01325, latent: 900 } };
  function condensationTemperature(gas, p) { var c = CONDENSABLE[gas]; return clausiusClapeyronT(p, c.tRef, c.pRef, c.latent); }
  var WATER_TRIPLE_BAR = 0.00611;
  function waterBoilingPoint(p) { return clausiusClapeyronT(p, 373.15, 1.01325, 40650); }
  function liquidWaterBand(o) {
    var none = { widthDeg: 0, widthKm: 0, innerDeg: null, outerDeg: null };
    if (o.pressureBar < WATER_TRIPLE_BAR) return none;
    var tBoil = waterBoilingPoint(o.pressureBar), step = o.stepDeg || 0.1, inner = null, outer = null;
    for (var th = 0; th <= 180 + 1e-9; th += step) {
      var T = lockedSurfaceTemperature(o.sEarth, o.albedo, o.epsilon, th);
      if (T >= 273.15 && T <= tBoil) { if (inner === null) inner = th; outer = th; }
    }
    if (inner === null || outer === null) return none;
    var w = outer - inner;
    return { widthDeg: w, widthKm: (w * Math.PI / 180) * o.radiusKm, innerDeg: inner, outerDeg: outer };
  }

  /* ── Bulk planet ── */
  function surfaceGravity(m, r) { return m / Math.max(r * r, 1e-12); }
  function surfaceGravityMs2(m, r) { return surfaceGravity(m, r) * G_EARTH; }
  function bulkDensity(m, r) { return (RHO_EARTH * m) / Math.max(Math.pow(r, 3), 1e-12); }
  function escapeVelocityKms(m, r) { return V_ESC_EARTH_KMS * Math.sqrt(Math.max(m, 0) / Math.max(r, 1e-12)); }

  /* ── Retention (mean speed ≤ v_esc/6 retained, ≤ 0.2·v_esc marginal) ── */
  function meanThermalSpeedKms(T, mu) {
    var m = mu * AMU;
    return Math.sqrt((8 * K_B * Math.max(T, 0)) / (Math.PI * m)) / 1000;
  }
  function retention(vesc, T, mu) {
    var ratio = meanThermalSpeedKms(T, mu) / Math.max(vesc, 1e-9);
    return { ratio: ratio, verdict: ratio <= 1 / 6 ? 'retained' : ratio <= 0.2 ? 'marginal' : 'lost' };
  }

  /* ── Holman & Wiegert 1999, eqs. 1 and 3 ── */
  function holmanWiegertSType(mu, e) { return 0.464 - 0.38 * mu - 0.631 * e + 0.586 * mu * e + 0.15 * e * e - 0.198 * mu * e * e; }
  function holmanWiegertPType(mu, e) { return 1.6 + 5.1 * e - 2.22 * e * e + 4.12 * mu - 4.27 * e * mu - 5.09 * mu * mu + 4.61 * e * e * mu * mu; }

  /* ── Gladman et al. 1996 tidal-locking timescale (years) ── */
  function tidalLockTimescaleYears(o) {
    var a = o.aAU * AU_M, M = o.starMassMsun * M_SUN_KG, m = o.planetMassEarth * M_EARTH_KG, R = o.planetRadiusEarth * R_EARTH_M;
    var omega = (2 * Math.PI) / ((o.initialSpinHours === undefined ? 12 : o.initialSpinHours) * 3600);
    var Q = o.Q === undefined ? 100 : o.Q, mu = o.rigidity === undefined ? 3e10 : o.rigidity, alpha = o.alpha === undefined ? 0.4 : o.alpha;
    var rho = m / ((4 / 3) * Math.PI * Math.pow(R, 3)), g = (G * m) / (R * R);
    var k2 = 1.5 / (1 + (19 * mu) / (2 * rho * g * R)), I = alpha * m * R * R;
    return ((omega * Math.pow(a, 6) * I * Q) / (3 * G * M * M * k2 * Math.pow(R, 5))) / SECONDS_PER_YEAR;
  }

  /* ── Chen & Kipping 2017 mass–radius; Zeng et al. 2016 iron floor ── */
  var CK_T_BREAK = 2.04, CK_J_BREAK = 131.6, CK_C_T = 1.008, CK_S_T = 0.279, CK_S_N = 0.589, CK_S_J = -0.044;
  var CK_R_T_BREAK = CK_C_T * Math.pow(CK_T_BREAK, CK_S_T);
  var CK_R_J_BREAK = CK_R_T_BREAK * Math.pow(CK_J_BREAK / CK_T_BREAK, CK_S_N);
  var CHEN_KIPPING_SIGMA_DEX = { terran: 0.0403, neptunian: 0.146, jovian: 0.0737 };
  var IRON_FLOOR_TOLERANCE = 0.95;
  function chenKippingRegime(m) { return m < CK_T_BREAK ? 'terran' : m < CK_J_BREAK ? 'neptunian' : 'jovian'; }
  function radiusFromMass(mass) {
    var m = Math.max(mass, 1e-6);
    if (m < CK_T_BREAK) return CK_C_T * Math.pow(m, CK_S_T);
    if (m < CK_J_BREAK) return CK_R_T_BREAK * Math.pow(m / CK_T_BREAK, CK_S_N);
    return CK_R_J_BREAK * Math.pow(m / CK_J_BREAK, CK_S_J);
  }
  function massFromRadius(radius) {
    var r = Math.max(radius, 1e-6);
    if (r < CK_R_T_BREAK) return Math.pow(r / CK_C_T, 1 / CK_S_T);
    if (r < CK_R_J_BREAK) return CK_T_BREAK * Math.pow(r / CK_R_T_BREAK, 1 / CK_S_N);
    return null;
  }
  function ironPlanetRadius(m) { return (1.07 - 0.21) * Math.pow(Math.max(m, 0), 1 / 3.7); }
  function massRadiusCheck(m, r) {
    var regime = chenKippingRegime(m), expectedRadius = radiusFromMass(m), ironRadius = ironPlanetRadius(m);
    var density = bulkDensity(m, r);
    var z = Math.log10(Math.max(r, 1e-6) / expectedRadius) / CHEN_KIPPING_SIGMA_DEX[regime];
    var verdict = Math.abs(z) <= 2 ? 'consistent' : 'unusual';
    if (r < ironRadius * IRON_FLOOR_TOLERANCE || Math.abs(z) > 5) verdict = 'implausible';
    return { expectedRadius: expectedRadius, ironRadius: ironRadius, density: density, z: z, regime: regime, verdict: verdict };
  }

  var api = {
    G: G, SIGMA_SB: SIGMA_SB, K_B: K_B, AMU: AMU, AU_M: AU_M, M_SUN_KG: M_SUN_KG, R_SUN_M: R_SUN_M, L_SUN_W: L_SUN_W,
    T_SUN_K: T_SUN_K, M_EARTH_KG: M_EARTH_KG, R_EARTH_M: R_EARTH_M, M_EARTH_IN_SUN: M_EARTH_IN_SUN,
    S_EARTH_WM2: S_EARTH_WM2, G_EARTH: G_EARTH, RHO_EARTH: RHO_EARTH, V_ESC_EARTH_KMS: V_ESC_EARTH_KMS,
    DAYS_PER_YEAR: DAYS_PER_YEAR, SECONDS_PER_YEAR: SECONDS_PER_YEAR, MOLECULAR_MASS: MOLECULAR_MASS,
    MAIN_SEQUENCE: MAIN_SEQUENCE, luminosityFromRadiusTeff: luminosityFromRadiusTeff,
    radiusFromLuminosityTeff: radiusFromLuminosityTeff, mainSequenceStar: mainSequenceStar,
    starFromSpectralType: starFromSpectralType, mainSequenceLifetimeGyr: mainSequenceLifetimeGyr,
    KOPPARAPU_2014: KOPPARAPU_2014, kopparapuSeff: kopparapuSeff, kopparapuEdges: kopparapuEdges,
    orbitalPeriodDays: orbitalPeriodDays, semiMajorAxisAU: semiMajorAxisAU, insolation: insolation,
    distanceForInsolation: distanceForInsolation, REDISTRIBUTION: REDISTRIBUTION,
    irradiationTemperature: irradiationTemperature, equilibriumTemperature: equilibriumTemperature,
    substellarTemperature: substellarTemperature, redistributionEfficiency: redistributionEfficiency,
    lockedSurfaceTemperature: lockedSurfaceTemperature, lockedHemispheres: lockedHemispheres,
    clausiusClapeyronT: clausiusClapeyronT, CONDENSABLE: CONDENSABLE, condensationTemperature: condensationTemperature,
    WATER_TRIPLE_BAR: WATER_TRIPLE_BAR, waterBoilingPoint: waterBoilingPoint, liquidWaterBand: liquidWaterBand,
    surfaceGravity: surfaceGravity, surfaceGravityMs2: surfaceGravityMs2, bulkDensity: bulkDensity,
    escapeVelocityKms: escapeVelocityKms, meanThermalSpeedKms: meanThermalSpeedKms, retention: retention,
    holmanWiegertSType: holmanWiegertSType, holmanWiegertPType: holmanWiegertPType,
    tidalLockTimescaleYears: tidalLockTimescaleYears, CHEN_KIPPING_SIGMA_DEX: CHEN_KIPPING_SIGMA_DEX,
    IRON_FLOOR_TOLERANCE: IRON_FLOOR_TOLERANCE, chenKippingRegime: chenKippingRegime,
    radiusFromMass: radiusFromMass, massFromRadius: massFromRadius, ironPlanetRadius: ironPlanetRadius,
    massRadiusCheck: massRadiusCheck
  };
  if (typeof window !== 'undefined') window.SFPhysics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
