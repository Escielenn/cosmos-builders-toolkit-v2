/* ==========================================================================
   sf-astro.js: the star and orbit physics Solaris and Rogue share.

   Classic script, no dependencies; defines window.SFAstro (globalThis in
   tests, which load this exact file, so the numbers the tests check are the
   numbers the simulators show).

   TODO(1.9 merge): lane T publishes the shared physics module under
   public/tools/_shared/. When it lands, point Solaris and Rogue at it and
   delete this file. The formulas and sources below are the same ones.

   Sources
   - Main sequence: E. Mamajek, "A Modern Mean Dwarf Stellar Color and
     Effective Temperature Sequence", version 2022.04.16
     (pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt), after
     Pecaut & Mamajek 2013, ApJS 208, 9. Teff, log L, R and M copied verbatim.
   - Habitable zone: Kopparapu et al. 2014, ApJL 787, L29, Table 1 (1 M⊕):
     S_eff = S_eff☉ + a·T + b·T² + c·T³ + d·T⁴, T = Teff − 5780 K, fitted
     for 2600 ≤ Teff ≤ 7200 K. d = √(L / S_eff).
   - Kepler's third law, P[yr] = √(a[AU]³ / M[M☉]) (planet mass neglected).
   - Insolation S = Σ L_i / d_i² in Earth units (L☉ at 1 AU = 1 S⊕).
   - Equilibrium temperature, full redistribution:
     T_eq = T☉ √(R☉ / 2 AU) (1 − A)^¼ S^¼ = 278.3 K · S^¼ (1 − A)^¼
     (T☉ = 5772 K, R☉ = 6.957e8 m, AU = 1.496e11 m). Earth, A = 0.306: 254 K.
   - Holman & Wiegert 1999, AJ 117, 621 (astro-ph/9809315): critical
     semi-major axis for S-type (eq. 1) and P-type (eq. 3) orbits.
   ========================================================================== */
(function (root) {
  'use strict';

  // ── Main sequence (Mamajek 2022) ──────────────────────────────────────
  // [spectral type, Teff K, log10 L/L☉, R/R☉, M/M☉]
  var MS = [
    ['B3V', 17000, 2.99, 3.61, 5.4],
    ['B5V', 15700, 2.77, 3.36, 4.7],
    ['B8V', 12300, 2.19, 2.86, 3.38],
    ['A0V', 9700, 1.58, 2.193, 2.18],
    ['A5V', 8100, 1.09, 1.785, 1.88],
    ['F0V', 7220, 0.86, 1.728, 1.61],
    ['F5V', 6550, 0.56, 1.473, 1.33],
    ['G0V', 5930, 0.13, 1.100, 1.06],
    ['G2V', 5770, 0.01, 1.012, 1.00],
    ['G5V', 5660, -0.05, 0.977, 0.98],
    ['G8V', 5480, -0.17, 0.914, 0.94],
    ['K0V', 5270, -0.34, 0.813, 0.88],
    ['K2V', 5100, -0.43, 0.783, 0.82],
    ['K5V', 4440, -0.76, 0.701, 0.70],
    ['K7V', 4100, -1.00, 0.630, 0.64],
    ['M0V', 3850, -1.16, 0.588, 0.57],
    ['M2V', 3560, -1.54, 0.446, 0.44],
    ['M4V', 3210, -2.14, 0.274, 0.23],
    ['M5V', 3060, -2.52, 0.196, 0.162],
    ['M6V', 2810, -2.98, 0.137, 0.102],
    ['M8V', 2570, -3.28, 0.114, 0.085]
  ].map(function (r) {
    return { spt: r[0], cls: r[0].charAt(0), teffK: r[1], lum: Math.pow(10, r[2]), radius: r[3], mass: r[4] };
  });

  function msRow(spt) {
    for (var i = 0; i < MS.length; i++) if (MS[i].spt === spt) return MS[i];
    return null;
  }

  /** Main-sequence star of mass m (M☉), log-interpolated in the table. */
  function msFromMass(m) {
    var rows = MS; // descending mass
    if (!(m > 0)) m = 1;
    if (m >= rows[0].mass) return Object.assign({}, rows[0], { mass: m });
    if (m <= rows[rows.length - 1].mass) return Object.assign({}, rows[rows.length - 1], { mass: m });
    for (var i = 0; i < rows.length - 1; i++) {
      var hi = rows[i], lo = rows[i + 1];
      if (m <= hi.mass && m >= lo.mass) {
        var f = (Math.log(m) - Math.log(lo.mass)) / (Math.log(hi.mass) - Math.log(lo.mass));
        var lerpLog = function (a, b) { return Math.exp(Math.log(a) + f * (Math.log(b) - Math.log(a))); };
        return {
          spt: (f > 0.5 ? hi : lo).spt, cls: (f > 0.5 ? hi : lo).cls, mass: m,
          teffK: lerpLog(lo.teffK, hi.teffK), lum: lerpLog(lo.lum, hi.lum), radius: lerpLog(lo.radius, hi.radius)
        };
      }
    }
    return Object.assign({}, msRow('G2V'));
  }

  // ── Habitable zone (Kopparapu et al. 2014, Table 1, 1 M⊕) ─────────────
  var KOP = {
    recentVenus: [1.776, 2.136e-4, 2.533e-8, -1.332e-11, -3.097e-15],
    runaway:     [1.107, 1.332e-4, 1.580e-8, -8.308e-12, -1.931e-15],
    maxGH:       [0.356, 6.171e-5, 1.698e-9, -3.198e-12, -5.575e-16],
    earlyMars:   [0.320, 5.547e-5, 1.526e-9, -2.874e-12, -5.011e-16]
  };
  var KOP_TMIN = 2600, KOP_TMAX = 7200;

  function seff(teffK, limit) {
    var c = KOP[limit];
    var t = Math.max(KOP_TMIN, Math.min(KOP_TMAX, teffK)) - 5780;
    return c[0] + c[1] * t + c[2] * t * t + c[3] * t * t * t + c[4] * t * t * t * t;
  }
  /** Conservative HZ [runaway greenhouse, maximum greenhouse] in AU. */
  function hz(L, teffK) {
    var l = Math.max(L, 1e-10);
    return [Math.sqrt(l / seff(teffK, 'runaway')), Math.sqrt(l / seff(teffK, 'maxGH'))];
  }
  /** Optimistic HZ [recent Venus, early Mars] in AU. */
  function hzOptimistic(L, teffK) {
    var l = Math.max(L, 1e-10);
    return [Math.sqrt(l / seff(teffK, 'recentVenus')), Math.sqrt(l / seff(teffK, 'earlyMars'))];
  }
  /** True when Teff lies outside the range Kopparapu fitted (the HZ is then an extrapolation). */
  function hzExtrapolated(teffK) { return teffK < KOP_TMIN || teffK > KOP_TMAX; }

  /** Combined HZ for several stars at one place: total L once, at the luminosity-weighted Teff. */
  function combinedHz(stars) {
    var L = 0, T = 0;
    stars.forEach(function (s) { L += s.lum; T += s.lum * s.teffK; });
    if (!(L > 0)) return [0, 0];
    return hz(L, T / L);
  }

  /**
   * Where incident flux S (S⊕) from a source of temperature teffK places a
   * world: 'hot' (inside recent Venus), 'warm-edge' (between recent Venus and
   * the runaway greenhouse: optimistic only), 'habitable' (conservative HZ),
   * 'cold-edge' (between maximum greenhouse and early Mars), 'cold'.
   */
  function hzStatus(S, teffK) {
    if (S > seff(teffK, 'recentVenus')) return 'hot';
    if (S > seff(teffK, 'runaway')) return 'warm-edge';
    if (S >= seff(teffK, 'maxGH')) return 'habitable';
    if (S >= seff(teffK, 'earlyMars')) return 'cold-edge';
    return 'cold';
  }
  var HZ_STATUS_LABEL = {
    hot: 'Too hot: inside the recent-Venus limit',
    'warm-edge': 'Inner edge: optimistic habitable zone only',
    habitable: 'In the habitable zone (conservative)',
    'cold-edge': 'Outer edge: optimistic habitable zone only',
    cold: 'Too cold: beyond the early-Mars limit'
  };

  // ── Orbits ─────────────────────────────────────────────────────────────
  var DAYS_PER_YEAR = 365.25;
  /** Kepler's third law: period in years for a in AU around total mass M in M☉. */
  function periodYears(aAU, massSun) { return Math.sqrt(Math.pow(aAU, 3) / Math.max(massSun, 1e-9)); }
  function periodDays(aAU, massSun) { return periodYears(aAU, massSun) * DAYS_PER_YEAR; }

  /** Flux from one star of luminosity L (L☉) at d AU, in S⊕. */
  function insolation(L, dAU) { return L / Math.max(dAU * dAU, 1e-12); }

  /**
   * Orbit-averaged flux on a circular orbit of radius a about the frame
   * origin from stars on circular paths of radius r_i about the same origin
   * (coplanar, incommensurate periods): ⟨1/d²⟩ = 1 / |a² − r²|. Exact for
   * that geometry; a star at the origin gives L / a².
   */
  function meanInsolation(aAU, stars) {
    var S = 0;
    stars.forEach(function (s) {
      var r = s.r || 0;
      var den = Math.abs(aAU * aAU - r * r);
      S += s.lum / Math.max(den, 1e-12);
    });
    return S;
  }

  var TEQ_EARTH_FLUX_ZERO_ALBEDO = 278.3; // K, see header
  function equilibriumTempK(S, albedo) {
    var A = albedo == null ? 0.3 : albedo;
    return TEQ_EARTH_FLUX_ZERO_ALBEDO * Math.pow(Math.max(S, 0), 0.25) * Math.pow(1 - A, 0.25);
  }

  // ── Holman & Wiegert 1999 ──────────────────────────────────────────────
  // μ = m₂ / (m₁ + m₂), e = binary eccentricity, result × binary a.
  // Eq. 1 fitted for 0.1 ≤ μ ≤ 0.9, 0 ≤ e ≤ 0.8; eq. 3 for 0.1 ≤ μ ≤ 0.5,
  // 0 ≤ e ≤ 0.7. Inputs outside are clamped to the fitted range.
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  /** S-type: largest stable orbit around one star, as a fraction of the binary a. (eq. 1) */
  function hwSType(mu, e) {
    mu = clamp(mu, 0.1, 0.9); e = clamp(e || 0, 0, 0.8);
    return 0.464 - 0.380 * mu - 0.631 * e + 0.586 * mu * e + 0.150 * e * e - 0.198 * mu * e * e;
  }
  /** P-type: smallest stable circumbinary orbit, as a multiple of the binary a. (eq. 3) */
  function hwPType(mu, e) {
    mu = clamp(Math.min(mu, 1 - mu), 0.1, 0.5); e = clamp(e || 0, 0, 0.7);
    return 1.60 + 5.10 * e - 2.22 * e * e + 4.12 * mu - 4.27 * e * mu - 5.09 * mu * mu + 4.61 * e * e * mu * mu;
  }

  var api = {
    MS: MS, msRow: msRow, msFromMass: msFromMass,
    KOP: KOP, seff: seff, hz: hz, hzOptimistic: hzOptimistic, hzExtrapolated: hzExtrapolated,
    combinedHz: combinedHz, hzStatus: hzStatus, HZ_STATUS_LABEL: HZ_STATUS_LABEL,
    DAYS_PER_YEAR: DAYS_PER_YEAR, periodYears: periodYears, periodDays: periodDays,
    insolation: insolation, meanInsolation: meanInsolation, equilibriumTempK: equilibriumTempK,
    hwSType: hwSType, hwPType: hwPType
  };
  root.SFAstro = api;
})(typeof window !== 'undefined' ? window : globalThis);
