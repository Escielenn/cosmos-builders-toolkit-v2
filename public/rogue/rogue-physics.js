/* ==========================================================================
   rogue-physics.js: the gravitational core of ROGUE, apart from its canvas.
   Classic script; defines window.RoguePhysics (globalThis under vitest,
   which loads this exact file). src/lib/simulators/nbody.ts is the typed
   twin for the native rebuild; keep the two in step.

   Units: AU, solar masses, years; G = 4π² (a 1 AU circular orbit around
   1 M☉ has speed 2π AU/yr and a period of one year).

   1.9 changes, each from the 1.9 audit (R1–R4):
   - Softening is scaled to the system (SOFT_FRAC of the innermost orbit)
     instead of a fixed 0.0071 AU, which was 62% of TRAPPIST-1b's orbit and
     bent every inner orbit. Pairs that include the intruder get a wider
     softening (SOFT_FRAC_INTRUDER) so a grazing pass stays integrable.
     The potential uses the same per-pair softening as the force, so the
     energy readout measures the integrator, not a mismatch.
   - The step size is never enlarged. High time scales take more steps per
     frame up to a cap; past it the run is slower than asked and says so.
   - Energy error |E − E₀| / |E₀| is measured; above PUBLISH_MAX_ENERGY_ERROR
     a run may not be published.
   - Binaries may be eccentric and planets may orbit one star (S-type).
   - Outcomes per body: retained, orbit_changed, captured (bound to the
     intruder) or ejected (bound to nothing).
   ========================================================================== */
(function (root) {
  'use strict';
  var G = 4 * Math.PI * Math.PI;
  var AU_YR_TO_KM_S = 4.7405;
  var M_JUPITER = 9.547e-4, M_EARTH = 3.003e-6;
  var DT_BASE = 0.00008;          // yr, for an innermost orbit ≥ 0.5 AU
  var SOFT_FRAC = 0.005;          // ε = 0.5% of the innermost orbit
  var SOFT_FRAC_INTRUDER = 0.05;  // ε for pairs with the intruder
  var STEP_CAP_PER_FRAME = 1500;  // integrator steps per 60 Hz frame, at most
  var PUBLISH_MAX_ENERGY_ERROR = 1e-3;

  function minOrbit(sys) {
    var p = (sys.planets || []).map(function (q) { return q.a; });
    return p.length ? Math.min.apply(null, p) : 1;
  }
  /** Softening lengths² for a system: [ordinary pairs, intruder pairs]. */
  function softening(sys) {
    var m = minOrbit(sys);
    var e = SOFT_FRAC * m, ei = SOFT_FRAC_INTRUDER * m;
    return { eps2: e * e, eps2I: ei * ei };
  }

  var pool = { ax: new Float64Array(32), ay: new Float64Array(32) };
  function active(b) { return !(b.isIntruder && !b.active); }

  /** Pairwise softened Newtonian accelerations (pooled arrays). */
  function computeAccel(bodies, full, soft) {
    var n = bodies.length;
    if (pool.ax.length < n) { pool.ax = new Float64Array(n); pool.ay = new Float64Array(n); }
    var ax = pool.ax, ay = pool.ay;
    ax.fill(0, 0, n); ay.fill(0, 0, n);
    for (var i = 0; i < n; i++) {
      var bi = bodies[i];
      if (!active(bi)) continue;
      for (var j = i + 1; j < n; j++) {
        var bj = bodies[j];
        if (!active(bj)) continue;
        // Before launch planet–planet forces are off, so an idle system does
        // not drift through resonances while the writer sets up the pass.
        if (!full && bi.isPlanet && bj.isPlanet) continue;
        var dx = bj.x - bi.x, dy = bj.y - bi.y;
        var r2 = dx * dx + dy * dy + ((bi.isIntruder || bj.isIntruder) ? soft.eps2I : soft.eps2);
        var r = Math.sqrt(r2), f = G / (r2 * r);
        ax[i] += bj.mass * f * dx; ay[i] += bj.mass * f * dy;
        ax[j] -= bi.mass * f * dx; ay[j] -= bi.mass * f * dy;
      }
    }
    return { ax: ax, ay: ay };
  }

  /** Kick-drift-kick leapfrog (second order, symplectic). */
  function step(bodies, dt, full, soft) {
    var n = bodies.length, i, acc = computeAccel(bodies, full, soft);
    for (i = 0; i < n; i++) if (active(bodies[i])) { bodies[i].vx += acc.ax[i] * dt * 0.5; bodies[i].vy += acc.ay[i] * dt * 0.5; }
    for (i = 0; i < n; i++) if (active(bodies[i])) { bodies[i].x += bodies[i].vx * dt; bodies[i].y += bodies[i].vy * dt; }
    acc = computeAccel(bodies, full, soft);
    for (i = 0; i < n; i++) if (active(bodies[i])) { bodies[i].vx += acc.ax[i] * dt * 0.5; bodies[i].vy += acc.ay[i] * dt * 0.5; }
  }

  /**
   * Advance by dt, subdividing (never enlarging) when the intruder is close
   * to something: the step is cut to ETA of the shortest intruder-pair
   * dynamical time √(r³ / G(m₁+m₂)), up to MAX_SUBSTEPS pieces. Away from
   * the intruder this is one plain leapfrog step. Returns the substeps used.
   */
  var ETA = 0.01, MAX_SUBSTEPS = 512;
  function advance(bodies, dt, full, soft) {
    var tmin = Infinity, n = bodies.length, I = -1, i;
    for (i = 0; i < n; i++) if (bodies[i].isIntruder && bodies[i].active) { I = i; break; }
    if (I >= 0) {
      var bi = bodies[I];
      for (i = 0; i < n; i++) {
        if (i === I) continue;
        var bj = bodies[i];
        var dx = bj.x - bi.x, dy = bj.y - bi.y;
        var r2 = dx * dx + dy * dy + soft.eps2I, r = Math.sqrt(r2);
        var t = Math.sqrt(r2 * r / (G * (bi.mass + bj.mass)));
        if (t < tmin) tmin = t;
      }
    }
    var k = isFinite(tmin) ? Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dt / (ETA * tmin)))) : 1;
    var h = dt / k;
    for (i = 0; i < k; i++) step(bodies, h, full, soft);
    return k;
  }

  /** Total energy with the same pair set and softening as the force. */
  function totalEnergy(bodies, full, soft) {
    var K = 0, U = 0, n = bodies.length, i, j;
    for (i = 0; i < n; i++) { var b = bodies[i]; if (active(b)) K += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy); }
    for (i = 0; i < n; i++) {
      var bi = bodies[i]; if (!active(bi)) continue;
      for (j = i + 1; j < n; j++) {
        var bj = bodies[j]; if (!active(bj)) continue;
        if (!full && bi.isPlanet && bj.isPlanet) continue;
        var dx = bj.x - bi.x, dy = bj.y - bi.y;
        var r = Math.sqrt(dx * dx + dy * dy + ((bi.isIntruder || bj.isIntruder) ? soft.eps2I : soft.eps2));
        U -= G * bi.mass * bj.mass / r;
      }
    }
    return K + U;
  }

  /**
   * Step plan for a time scale. The step dt depends only on the system; the
   * time scale sets how many steps run per second, up to the cap.
   *   dt          = DT_BASE · min(1, innermost / 0.5 AU)
   *   wanted      = 60 · ts · compensation steps per 60 Hz frame, the pre-1.9
   *                 rate (compensation = min(80, 1/dtScale)), so 1× is
   *                 ≈ 0.29 simulated years per second whatever the system
   *   perFrame    = min(wanted, STEP_CAP_PER_FRAME); before 1.9 the excess
   *                 was folded into a larger dt, which ejected TRAPPIST-1b
   *   effectiveTs = the time scale actually run (< ts when capped)
   */
  function stepPlan(sys, ts, cap) {
    cap = cap || STEP_CAP_PER_FRAME;
    var dtScale = Math.min(1, minOrbit(sys) / 0.5);
    var dt = DT_BASE * dtScale;
    var comp = Math.min(80, Math.max(1, 1 / dtScale));
    var perFrameWanted = 60 * ts * comp;
    var perFrame = Math.max(1, Math.min(cap, Math.round(perFrameWanted)));
    var effectiveTs = ts * Math.min(1, perFrame / Math.max(perFrameWanted, 1e-9));
    return { dt: dt, perFrame: perFrame, effectiveTs: effectiveTs, capped: perFrameWanted > cap,
             maxTs: cap / (60 * comp), yearsPerSecond: perFrame * 60 * dt };
  }

  /** Semi-major axis and eccentricity of `body` about a centre of mass `m` at (x,y,vx,vy). */
  function elements(body, c) {
    var dx = body.x - c.x, dy = body.y - c.y, dvx = body.vx - c.vx, dvy = body.vy - c.vy;
    var r = Math.sqrt(dx * dx + dy * dy), v2 = dvx * dvx + dvy * dvy, mu = G * c.mass;
    var E = 0.5 * v2 - mu / r;
    var h = dx * dvy - dy * dvx;
    var e = Math.sqrt(Math.max(0, 1 + 2 * E * h * h / (mu * mu)));
    var a = E < 0 ? -mu / (2 * E) : null;
    return { a: a, e: e, energy: E, r: r };
  }

  function com(list) {
    var m = 0, x = 0, y = 0, vx = 0, vy = 0;
    list.forEach(function (b) { m += b.mass; x += b.x * b.mass; y += b.y * b.mass; vx += b.vx * b.mass; vy += b.vy * b.mass; });
    return m > 0 ? { mass: m, x: x / m, y: y / m, vx: vx / m, vy: vy / m } : null;
  }

  /**
   * What became of one planet. Candidate centres: each star, the stellar
   * barycentre (circumbinary) and the active intruder. A centre holds the
   * planet when the planet is bound to it (specific energy < 0) AND inside
   * its Hill sphere against every other mass, r_H = D (m / 3M)^⅓
   * (Hamilton & Burns 1992). Energy alone is not enough: a 50 M☉ black hole
   * tens of AU away "binds" every planet of a red dwarf by energy while the
   * star still holds them. Of the centres that hold it, the innermost
   * (smallest distance) wins: a planet around star A of a binary belongs to
   * A, not to the pair.
   *   captured       held by the intruder
   *   ejected        held by nothing
   *   orbit_changed  held by a star or the pair, a off by > 10% or e > 0.1
   *   retained       held by a star or the pair, orbit much as it was
   */
  function outcome(body, bodies) {
    var stars = bodies.filter(function (b) { return b.isStar; });
    var intr = bodies.filter(function (b) { return b.isIntruder && b.active; })[0];
    var masses = stars.concat(intr ? [intr] : []);
    function hill(c, members) {
      var rh = Infinity;
      masses.forEach(function (o) {
        if (members.indexOf(o) >= 0) return;
        var D = Math.hypot(o.x - c.x, o.y - c.y);
        rh = Math.min(rh, D * Math.cbrt(c.mass / (3 * o.mass)));
      });
      return rh;
    }
    var cands = stars.map(function (st) { return { name: st.name, c: st, members: [st], kind: 'star' }; });
    if (stars.length > 1) cands.push({ name: 'barycentre', c: com(stars), members: stars, kind: 'stars' });
    if (intr) cands.push({ name: intr.name, c: intr, members: [intr], kind: 'intruder' });
    var best = null;
    cands.forEach(function (k) {
      var el = elements(body, k.c);
      if (el.energy >= 0 || el.r >= hill(k.c, k.members)) return;
      if (!best || el.r < best.el.r) best = { k: k, el: el };
    });
    var a0 = body.a;
    if (!best) {
      var el0 = elements(body, com(stars));
      return { outcome: 'ejected', boundTo: null, a: null, e: el0.e };
    }
    var o = best.k.kind === 'intruder' ? 'captured'
      : (Math.abs(best.el.a - a0) / a0 > 0.1 || best.el.e > 0.1) ? 'orbit_changed' : 'retained';
    return { outcome: o, boundTo: best.k.name, a: best.el.a, e: best.el.e };
  }

  /** Relative energy error, or null before a reference exists. */
  function energyError(E, E0) {
    if (E0 == null || !isFinite(E0) || E0 === 0) return null;
    return Math.abs((E - E0) / E0);
  }

  /**
   * Initial state for a system definition (the preset shape in sim.html):
   * {starMass, binary:{mass, separation, e}|null, planets:[{a, mass, host}]}.
   * Binary starts at apoastron, r = a(1 + e), relative speed from vis-viva.
   * A planet with host 'A' or 'B' starts on a circular orbit about that star
   * (S-type); otherwise about the barycentre with the total mass (P-type).
   */
  function initialState(sys) {
    var stars = [{ name: sys.binary ? 'Star A' : 'Star', x: 0, y: 0, vx: 0, vy: 0, mass: sys.starMass, isStar: true }];
    if (sys.binary) {
      var M = sys.starMass + sys.binary.mass, a = sys.binary.separation, e = sys.binary.e || 0;
      var r = a * (1 + e), v = Math.sqrt(G * M * (1 - e) / (a * (1 + e)));
      var fA = sys.binary.mass / M, fB = sys.starMass / M;
      stars[0].x = -fA * r; stars[0].vy = -fA * v;
      stars.push({ name: 'Star B', x: fB * r, y: 0, vx: 0, vy: fB * v, mass: sys.binary.mass, isStar: true });
    }
    var planets = (sys.planets || []).map(function (pd, i) {
      var ang = i * 2.39996 + 0.1;
      var host = pd.host === 'B' && stars[1] ? stars[1] : pd.host === 'A' ? stars[0] : null;
      var c = host || { x: 0, y: 0, vx: 0, vy: 0, mass: stars.reduce(function (s, b) { return s + b.mass; }, 0) };
      var v = Math.sqrt(G * c.mass / pd.a);
      return { name: pd.name, x: c.x + pd.a * Math.cos(ang), y: c.y + pd.a * Math.sin(ang),
               vx: c.vx - v * Math.sin(ang), vy: c.vy + v * Math.cos(ang),
               mass: pd.mass, a: pd.a, host: pd.host || null, isPlanet: true };
    });
    return stars.concat(planets);
  }

  root.RoguePhysics = {
    G: G, AU_YR_TO_KM_S: AU_YR_TO_KM_S, M_JUPITER: M_JUPITER, M_EARTH: M_EARTH, DT_BASE: DT_BASE,
    SOFT_FRAC: SOFT_FRAC, SOFT_FRAC_INTRUDER: SOFT_FRAC_INTRUDER, STEP_CAP_PER_FRAME: STEP_CAP_PER_FRAME,
    PUBLISH_MAX_ENERGY_ERROR: PUBLISH_MAX_ENERGY_ERROR,
    minOrbit: minOrbit, softening: softening, computeAccel: computeAccel, step: step,
    advance: advance, totalEnergy: totalEnergy, stepPlan: stepPlan, elements: elements, com: com,
    outcome: outcome, energyError: energyError, initialState: initialState
  };
})(typeof window !== 'undefined' ? window : globalThis);
