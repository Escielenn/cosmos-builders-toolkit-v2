/* ==========================================================================
   solaris-core.js: the parts of Solaris that decide what is true, apart from
   the canvas that draws it. Classic script; defines window.SolarisCore
   (globalThis under vitest, which loads this exact file).

     STAR_TYPES            the five palette stars, each a real main-sequence
                           row from SFAstro.MS (Mamajek 2022)
     mulberry32(seed)      seeded PRNG: a saved seed regenerates the same system
     frameOf(system)       which stars sit at the frame origin (the planets'
                           host) and which perturb from outside
     starPositionsAU(sys, tYears)   every star's position, analytic, at any time
     frameAccelAU(sys, tYears, pos) acceleration of the frame origin (AU/yr²)
     limits(sys)           Holman & Wiegert stable range [innerAU, outerAU]
     hzAU(sys)             conservative habitable zone of the host group
     planetMetrics(sys, aAU, albedo)  period, insolation, T_eq, HZ status
     serialize / deserialize          the exact system, as plain JSON

   Units: AU, years, solar masses, G = 4π² AU³ M☉⁻¹ yr⁻². Stars move on
   circular Keplerian orbits about the barycentre of the group they orbit
   (hierarchical model). Planets are test particles; sim.html integrates them
   and feels every star plus the inertial term from frameAccelAU.

   Requires sf-astro.js (SFAstro) to be loaded first.
   ========================================================================== */
(function (root) {
  'use strict';
  var A = root.SFAstro;
  var G = 4 * Math.PI * Math.PI;
  var TAU = Math.PI * 2;

  // Palette key → main-sequence spectral type. Visual fields (colour, glow,
  // drawn radius in px) are display only and never reach canon.
  var STAR_TYPES = {
    blue:   { spt: 'B8V', name: 'Blue Star',   color: '#9BB8FF', glow: 'rgba(155,184,255,', r: 24 },
    white:  { spt: 'A5V', name: 'White Star',  color: '#FFFDE7', glow: 'rgba(255,253,231,', r: 20 },
    yellow: { spt: 'G2V', name: 'Yellow Star', color: '#FFD700', glow: 'rgba(255,215,0,',   r: 19 },
    orange: { spt: 'K5V', name: 'Orange Star', color: '#FF8C42', glow: 'rgba(255,140,66,',  r: 16 },
    red:    { spt: 'M4V', name: 'Red Dwarf',   color: '#FF5555', glow: 'rgba(255,85,85,',   r: 13 }
  };
  var STAR_KEYS = ['blue', 'white', 'yellow', 'orange', 'red'];
  STAR_KEYS.forEach(function (k) {
    var d = STAR_TYPES[k], row = A.msRow(d.spt);
    d.key = k; d.cls = row.cls; d.mass = row.mass; d.lum = row.lum; d.teffK = row.teffK; d.radius = row.radius;
    d.hz = A.hz(d.lum, d.teffK);
  });
  function starDef(key) { return STAR_TYPES[key] || STAR_TYPES.yellow; }

  // Seeded PRNG (mulberry32, public domain, Tommy Ettinger).
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mass(sys, i) { return sys.stars[i] ? starDef(sys.stars[i].key).mass : 0; }
  function lum(sys, i) { return sys.stars[i] ? starDef(sys.stars[i].key).lum : 0; }

  /**
   * Frame: which stars the planets orbit (host) and which are outside.
   *   single              host A
   *   binary              host AB (P-type, circumbinary)
   *   tri_31              host AB, C outside
   *   tri_22_1            host A (S-type), B and C outside
   *   quad_22             host AB, the C+D pair outside
   *   quad_31             host ABC (circumtriple), D outside
   */
  function frameOf(sys) {
    var arch = sys.arch || sys.starMode || 'single';
    var n = sys.stars.length;
    if (n <= 1 || arch === 'single') return { host: [0], ext: [] };
    if (arch === 'tri_22_1') return { host: [0], ext: [1, 2] };
    if (arch === 'quad_31') return { host: [0, 1, 2], ext: n > 3 ? [3] : [] };
    if (arch === 'quad_22') return { host: [0, 1], ext: n > 3 ? [2, 3] : [2] };
    if (n >= 3) return { host: [0, 1], ext: [2] };
    return { host: [0, 1], ext: [] };
  }
  function hostMass(sys) { return frameOf(sys).host.reduce(function (s, i) { return s + mass(sys, i); }, 0); }
  function totalMass(sys) { var s = 0; for (var i = 0; i < sys.stars.length; i++) s += mass(sys, i); return s; }

  function ang(phase0, period, t) { return phase0 + TAU * t / period; }

  /** Star positions in AU at time t (years). Returns [{x,y}] in star order. */
  function starPositionsAU(sys, t) {
    var arch = sys.arch || sys.starMode || 'single';
    var n = sys.stars.length, out = [];
    for (var i = 0; i < n; i++) out.push({ x: 0, y: 0 });
    if (n <= 1 || arch === 'single') return out;
    var sep = sys.sep || {}, ph = sys.phase || {};
    var mA = mass(sys, 0), mB = mass(sys, 1), mAB = mA + mB;
    var ab = sep.ab || 1, Pab = A.periodYears(ab, mAB), th = ang(ph.ab || 0, Pab, t);
    var ux = Math.cos(th), uy = Math.sin(th);

    if (arch === 'tri_22_1') {
      // A at the origin; B on its relative orbit; C about the AB barycentre.
      out[1] = { x: ab * ux, y: ab * uy };
      if (n > 2) {
        var mC = mass(sys, 2), c = sep.c || 10, tc = ang(ph.c || 0, A.periodYears(c, mAB + mC), t);
        var bx = mB / mAB * ab * ux, by = mB / mAB * ab * uy;
        out[2] = { x: bx + c * Math.cos(tc), y: by + c * Math.sin(tc) };
      }
      return out;
    }

    var ox = 0, oy = 0; // AB barycentre
    if (arch === 'quad_31' && n > 2) {
      var mC3 = mass(sys, 2), c3 = sep.c || 3, mABC = mAB + mC3;
      var tc3 = ang(ph.c || 0, A.periodYears(c3, mABC), t);
      var cx = Math.cos(tc3), cy = Math.sin(tc3);
      ox = -mC3 / mABC * c3 * cx; oy = -mC3 / mABC * c3 * cy;
      out[2] = { x: mAB / mABC * c3 * cx, y: mAB / mABC * c3 * cy };
      if (n > 3) {
        var d = sep.d || 15, td = ang(ph.d || 0, A.periodYears(d, totalMass(sys)), t);
        out[3] = { x: d * Math.cos(td), y: d * Math.sin(td) };
      }
    }
    out[0] = { x: ox - mB / mAB * ab * ux, y: oy - mB / mAB * ab * uy };
    out[1] = { x: ox + mA / mAB * ab * ux, y: oy + mA / mAB * ab * uy };

    if ((arch === 'tri_31' || arch === 'trinary') && n > 2) {
      var mC1 = mass(sys, 2), c1 = sep.c || 10, tc1 = ang(ph.c || 0, A.periodYears(c1, mAB + mC1), t);
      out[2] = { x: c1 * Math.cos(tc1), y: c1 * Math.sin(tc1) };
    }
    if ((arch === 'quad_22' || arch === 'quaternary') && n > 2) {
      var mC2 = mass(sys, 2), mD2 = n > 3 ? mass(sys, 3) : 0, mCD = mC2 + mD2;
      var c2 = sep.c || 10, tc2 = ang(ph.c || 0, A.periodYears(c2, mAB + mCD), t);
      var px = c2 * Math.cos(tc2), py = c2 * Math.sin(tc2);
      if (n > 3) {
        var cd = sep.cd || ab, tcd = ang(ph.cd || 0, A.periodYears(cd, mCD), t);
        var vx = Math.cos(tcd), vy = Math.sin(tcd);
        out[2] = { x: px - mD2 / mCD * cd * vx, y: py - mD2 / mCD * cd * vy };
        out[3] = { x: px + mC2 / mCD * cd * vx, y: py + mC2 / mCD * cd * vy };
      } else out[2] = { x: px, y: py };
    }
    return out;
  }

  /**
   * Acceleration of the frame origin (the host group, taken as a point) due
   * to the outside stars, AU/yr². sim.html subtracts it from every planet:
   * the planets live in the host's accelerating frame.
   */
  function frameAccelAU(sys, t, pos) {
    pos = pos || starPositionsAU(sys, t);
    var f = frameOf(sys), ax = 0, ay = 0;
    f.ext.forEach(function (i) {
      var x = pos[i].x, y = pos[i].y, r2 = x * x + y * y, r = Math.sqrt(r2);
      if (r2 <= 0) return;
      var k = G * mass(sys, i) / (r2 * r);
      ax += k * x; ay += k * y;
    });
    return { x: ax, y: ay };
  }

  /**
   * Stable range for planets about the host, from Holman & Wiegert 1999
   * (circular stellar orbits, e = 0). [innerAU, outerAU]; outer is Infinity
   * when nothing perturbs from outside.
   */
  function limits(sys) {
    var arch = sys.arch || sys.starMode || 'single', n = sys.stars.length, sep = sys.sep || {};
    var inner = 0, outer = Infinity, notes = [];
    if (n <= 1 || arch === 'single') return { inner: 0, outer: Infinity, notes: notes };
    var mA = mass(sys, 0), mB = mass(sys, 1), mAB = mA + mB, M = totalMass(sys);
    if (arch === 'tri_22_1') {
      var o1 = A.hwSType(mB / mAB, 0) * (sep.ab || 1);
      outer = o1; notes.push({ eq: 1, mu: mB / mAB, a: sep.ab, limit: o1, by: 'B' });
      if (n > 2) {
        var o2 = A.hwSType(mass(sys, 2) / M, 0) * (sep.c || 10);
        notes.push({ eq: 1, mu: mass(sys, 2) / M, a: sep.c, limit: o2, by: 'C' });
        outer = Math.min(outer, o2);
      }
      return { inner: 0, outer: outer, notes: notes };
    }
    if (arch === 'quad_31' && n > 2) {
      var mC = mass(sys, 2), mABC = mAB + mC, muI = Math.min(mC, mAB) / mABC;
      inner = A.hwPType(muI, 0) * (sep.c || 3);
      notes.push({ eq: 3, mu: muI, a: sep.c, limit: inner, by: 'AB+C' });
      if (n > 3) {
        outer = A.hwSType(mass(sys, 3) / M, 0) * (sep.d || 15);
        notes.push({ eq: 1, mu: mass(sys, 3) / M, a: sep.d, limit: outer, by: 'D' });
      }
      return { inner: inner, outer: outer, notes: notes };
    }
    var muAB = Math.min(mA, mB) / mAB;
    inner = A.hwPType(muAB, 0) * (sep.ab || 1);
    notes.push({ eq: 3, mu: muAB, a: sep.ab, limit: inner, by: 'AB' });
    if (n > 2) {
      var mExt = M - mAB;
      outer = A.hwSType(mExt / M, 0) * (sep.c || 10);
      notes.push({ eq: 1, mu: mExt / M, a: sep.c, limit: outer, by: n > 3 ? 'CD' : 'C' });
    }
    return { inner: inner, outer: outer, notes: notes };
  }

  /** Conservative HZ of the host group (AU from the frame origin). */
  function hzAU(sys) {
    return A.combinedHz(frameOf(sys).host.map(function (i) { return starDef(sys.stars[i].key); }));
  }

  /** Distance of each star's path from the frame origin (AU), for averaged flux. */
  function starRadii(sys) {
    return starPositionsAU(sys, 0).map(function (p) { return Math.hypot(p.x, p.y); });
  }

  /**
   * What a planet on a circular orbit of radius aAU about the frame origin
   * experiences. Insolation is orbit-averaged over every star
   * (SFAstro.meanInsolation); habitability uses the flux-weighted Teff.
   */
  function planetMetrics(sys, aAU, albedo) {
    var radii = starRadii(sys), S = 0, ST = 0;
    for (var i = 0; i < sys.stars.length; i++) {
      var d = starDef(sys.stars[i].key);
      var r = radii[i], den = Math.max(Math.abs(aAU * aAU - r * r), 0.01 * aAU * aAU);
      var s = d.lum / den;
      S += s; ST += s * d.teffK;
    }
    var teff = S > 0 ? ST / S : 5772;
    var alb = albedo == null ? 0.3 : albedo;
    var status = A.hzStatus(S, teff);
    return {
      aAU: aAU,
      periodYears: A.periodYears(aAU, hostMass(sys)),
      periodDays: A.periodDays(aAU, hostMass(sys)),
      insolation: S,
      teffK: teff,
      albedo: alb,
      teqK: A.equilibriumTempK(S, alb),
      hzStatus: status,
      inHabitableZone: status === 'habitable',
      hzExtrapolated: A.hzExtrapolated(teff)
    };
  }

  // ── Serialisation: the exact system, plain JSON, positions in AU ──────
  var SNAPSHOT_VERSION = 2;
  var PLANET_KEYS = ['name', 'typeKey', 'band', 'angle', 'sz', 'tidalLock', 'retrograde', 'rotSpeed',
    'rotAngle', 'glowPh', 'albedo', 'ejected', 'ejectedAtYears'];

  function r6(x) { return typeof x === 'number' && isFinite(x) ? x : x; }

  function serialize(sys) {
    var AU = sys.AU || 1;
    return {
      v: SNAPSHOT_VERSION,
      name: sys.name, seed: sys.seed, starMode: sys.starMode, arch: sys.arch,
      t: sys.t || 0,
      sep: Object.assign({}, sys.sep || {}), phase: Object.assign({}, sys.phase || {}),
      stars: sys.stars.map(function (s) { return { key: s.key, nameStr: s.nameStr }; }),
      planets: sys.planets.map(function (p) {
        var o = {};
        PLANET_KEYS.forEach(function (k) { if (p[k] !== undefined) o[k] = r6(p[k]); });
        o.orbitAU = p.orbitPx / AU;
        if (p.startPx !== undefined) o.startAU = p.startPx / AU;
        if (p.vx !== undefined) { o.state = { x: p.px / AU, y: p.py / AU, vx: p.vx / AU, vy: p.vy / AU }; }
        o.moons = (p.moons || []).map(function (m) { return { r: m.r, angle: m.angle, spd: m.spd, sz: m.sz }; });
        return o;
      }),
      asteroidBelt: sys.asteroidBelt ? {
        rAU: sys.asteroidBelt.r / AU,
        pts: sys.asteroidBelt.pts.map(function (a) { return { rAU: a.r / AU, ang: a.ang, spd: a.spd, sz: a.sz, col: a.col }; })
      } : null,
      oort: sys.oort ? {
        hillsMaxAU: sys.oort.hillsMax / AU, outerMaxAU: sys.oort.outerMax / AU,
        pts: sys.oort.pts.map(function (o) { return { rAU: o.r / AU, ang: o.ang, spd: o.spd, sz: o.sz, col: o.col, elev: o.elev, zone: o.zone }; }),
        comets: sys.oort.comets.map(function (c) { return { rAU: c.r / AU, ang: c.ang, perihelionAU: c.perihelion / AU, spd: c.spd, sz: c.sz, tailLen: c.tailLen, startRAU: c.startR / AU }; })
      } : null
    };
  }

  /**
   * Rebuild a live system from a snapshot at the given px-per-AU scale.
   * `ptypes` is sim.html's planet-type table (typeDef, colours).
   */
  function deserialize(snap, AU, ptypes) {
    if (!snap || !Array.isArray(snap.stars) || !Array.isArray(snap.planets)) return null;
    var sys = {
      name: snap.name, seed: snap.seed, starMode: snap.starMode || 'single', arch: snap.arch || snap.starMode || 'single',
      t: snap.t || 0, AU: AU,
      sep: Object.assign({}, snap.sep || {}), phase: Object.assign({}, snap.phase || {}),
      stars: snap.stars.map(function (s) { return { key: STAR_TYPES[s.key] ? s.key : 'yellow', nameStr: s.nameStr, def: starDef(s.key), x: 0, y: 0 }; }),
      planets: [], asteroidBelt: null, oort: null
    };
    sys.planets = snap.planets.map(function (o, i) {
      var pt = (ptypes && ptypes[o.typeKey]) || (ptypes && ptypes.barren) || {};
      var p = {};
      PLANET_KEYS.forEach(function (k) { if (o[k] !== undefined) p[k] = o[k]; });
      p.typeDef = pt; p.color = pt.color; p.altColor = pt.alt; p.index = i;
      p.orbitPx = o.orbitAU * AU;
      if (o.startAU !== undefined) p.startPx = o.startAU * AU;
      if (o.state) { p.px = o.state.x * AU; p.py = o.state.y * AU; p.vx = o.state.vx * AU; p.vy = o.state.vy * AU; }
      p.moons = (o.moons || []).map(function (m) { return { r: m.r, angle: m.angle, spd: m.spd, sz: m.sz }; });
      return p;
    });
    if (snap.asteroidBelt) sys.asteroidBelt = {
      r: snap.asteroidBelt.rAU * AU,
      pts: snap.asteroidBelt.pts.map(function (a) { return { r: a.rAU * AU, ang: a.ang, spd: a.spd, sz: a.sz, col: a.col }; })
    };
    if (snap.oort) sys.oort = {
      hillsMax: snap.oort.hillsMaxAU * AU, outerMax: snap.oort.outerMaxAU * AU,
      pts: snap.oort.pts.map(function (o) { return { r: o.rAU * AU, ang: o.ang, spd: o.spd, sz: o.sz, col: o.col, elev: o.elev, zone: o.zone }; }),
      comets: snap.oort.comets.map(function (c) { return { r: c.rAU * AU, ang: c.ang, perihelion: c.perihelionAU * AU, spd: c.spd, sz: c.sz, tailLen: c.tailLen, startR: c.startRAU * AU }; })
    };
    var hz = hzAU(sys);
    sys.hz = { inner: hz[0] * AU, outer: hz[1] * AU };
    return sys;
  }

  root.SolarisCore = {
    G: G, STAR_TYPES: STAR_TYPES, STAR_KEYS: STAR_KEYS, starDef: starDef, mulberry32: mulberry32,
    frameOf: frameOf, hostMass: hostMass, totalMass: totalMass,
    starPositionsAU: starPositionsAU, frameAccelAU: frameAccelAU,
    limits: limits, hzAU: hzAU, planetMetrics: planetMetrics,
    SNAPSHOT_VERSION: SNAPSHOT_VERSION, serialize: serialize, deserialize: deserialize
  };
})(typeof window !== 'undefined' ? window : globalThis);
