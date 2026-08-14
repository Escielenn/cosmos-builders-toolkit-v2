// ---------------------------------------------------------------------------
// iframe-sim-facts, reading the two simulators that are still static HTML.
//
// Tidelock and ExoForge remain iframes writing their own save shapes, so
// extractSimulationFacts returned nothing for them and a writer's tidally locked
// world was invisible to their prose. They are not converted yet, but that is no
// reason for their output to stay unreachable: the shapes are stable and
// documented in the files themselves.
//
// Every field below was read out of the `state` object each sim posts in its
// STELLARFORGE_SAVE message, not guessed. Tidelock: public/tools/tidelock/sim.html
// around line 1690. ExoForge: public/tools/exoforge/sim.html around line 1815.
//
// These are the numbers a writer actually needs. A tidally locked world lives or
// dies on the temperature either side of its terminator, and that is precisely
// what Tidelock computes and what prose gets wrong.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

function obj(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function fin(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Kelvin with the Celsius a reader thinks in. */
function temp(k: number): string {
  return `${Math.round(k)} K (${Math.round(k - 273.15)}°C)`;
}

/**
 * How survivable a surface temperature is, in the same words the simulator's own
 * readout uses, so the writing surface and the tool agree.
 */
function survivability(k: number): string {
  if (k > 600) return "lethal";
  if (k > 373) return "scorching";
  if (k >= 273) return "hot but survivable";
  if (k >= 233) return "cold but survivable";
  return "frozen";
}

// ---------------------------------------------------------------------------
// Tidelock
// ---------------------------------------------------------------------------

export function extractTidelockFacts(raw: unknown): WorksheetFact[] {
  const payload = obj(raw);
  if (!payload) return [];
  const p = obj(payload.parameters) ?? {};
  const r = obj(payload.results) ?? {};
  if (Object.keys(r).length === 0 && Object.keys(p).length === 0) return [];

  const facts: WorksheetFact[] = [];
  const push = (key: string, label: string, value: string, insert?: string) => {
    if (value) facts.push({ key, label, value, ...(insert ? { insert } : {}) });
  };

  push("locked.star", "Host star", str(r.starType));

  // The three temperatures are the whole point of the tool: one face always lit,
  // one always dark, and a ring between them where a story can happen.
  const ssp = fin(r.tSSP);
  const asp = fin(r.tASP);
  const term = fin(r.tTerm);
  if (ssp !== null) push("locked.daySide", "Day side", `${temp(ssp)}, ${survivability(ssp)}`);
  if (asp !== null) push("locked.nightSide", "Night side", `${temp(asp)}, ${survivability(asp)}`);
  if (term !== null) push("locked.terminator", "Terminator", `${temp(term)}, ${survivability(term)}`);
  if (ssp !== null && asp !== null) {
    push("locked.spread", "Face-to-face difference", `${Math.round(ssp - asp)} K`);
  }

  const habPct = fin(r.habPct);
  if (habPct !== null) {
    push(
      "locked.habitableBand",
      "Habitable band",
      `${habPct.toFixed(1)}% of the surface${str(r.habStatus) ? ` (${str(r.habStatus).toLowerCase()})` : ""}`,
    );
  }

  const grav = fin(r.surfGrav);
  if (grav !== null) push("locked.gravity", "Surface gravity", `${grav.toFixed(2)} g`);
  const esc = fin(r.escVel);
  if (esc !== null) push("locked.escape", "Escape velocity", `${esc.toFixed(1)} km/s`);

  push("locked.water", "Liquid water", str(r.liquidWater));
  push("locked.atmosphere", "Atmosphere retention", str(r.atmRetention));
  push("locked.tidalState", "Tidal state", str(r.tidalLock));

  const period = fin(r.orbPeriod);
  if (period !== null) {
    // A tidally locked world's day equals its year, which is the fact most often
    // got wrong in prose.
    push(
      "locked.period",
      "Year (and day)",
      period < 1 ? `${(period * 365.25).toFixed(1)} days` : `${period.toFixed(2)} years`,
    );
  }

  const moons = fin(p.moonCount);
  if (moons !== null && moons > 0) {
    push("locked.moons", "Moons", String(Math.round(moons)));
  }
  push("locked.composition", "Composition", str(p.composition));

  return facts;
}

// ---------------------------------------------------------------------------
// ExoForge
// ---------------------------------------------------------------------------

export function extractExoforgeFacts(raw: unknown): WorksheetFact[] {
  const payload = obj(raw);
  if (!payload) return [];
  const p = obj(payload.parameters) ?? {};
  const r = obj(payload.results) ?? {};
  if (Object.keys(r).length === 0 && Object.keys(p).length === 0) return [];

  const facts: WorksheetFact[] = [];
  const push = (key: string, label: string, value: string, insert?: string) => {
    if (value) facts.push({ key, label, value, ...(insert ? { insert } : {}) });
  };

  const name = str(p.name);
  if (name) push("forged.name", "World", name, name);
  push("forged.class", "Classification", str(r.classification));

  const radius = fin(p.radius);
  if (radius !== null) push("forged.radius", "Radius", `${radius.toFixed(2)} R⊕`);
  const mass = fin(p.mass);
  if (mass !== null) push("forged.mass", "Mass", `${mass.toFixed(2)} M⊕`);

  const gravity = fin(r.gravity);
  if (gravity !== null) {
    // Worth spelling out: this is the number a reader feels on every page.
    push(
      "forged.gravity",
      "Surface gravity",
      `${gravity.toFixed(2)} g${gravity > 1.4 ? ", heavy going" : gravity < 0.7 ? ", light on your feet" : ""}`,
    );
  }
  const density = fin(r.density);
  if (density !== null) push("forged.density", "Density", `${density.toFixed(2)} g/cm³`);
  const escape = fin(r.escapeVelocity);
  if (escape !== null) push("forged.escape", "Escape velocity", `${escape.toFixed(1)} km/s`);

  const t = fin(p.temp);
  if (t !== null) push("forged.temperature", "Surface temperature", `${temp(t)}, ${survivability(t)}`);

  const period = fin(p.period);
  if (period !== null) {
    push(
      "forged.period",
      "Orbital period",
      period < 1 ? `${(period * 365.25).toFixed(1)} days` : `${period.toFixed(2)} years`,
    );
  }

  const rotation = fin(p.rotation);
  if (rotation !== null && rotation !== 0) {
    push("forged.rotation", "Day length", `${Math.abs(rotation).toFixed(1)} hours`);
  }

  const ocean = fin(p.ocean);
  if (ocean !== null) push("forged.ocean", "Ocean coverage", `${Math.round(ocean * 100)}%`);
  const cloud = fin(p.cloud);
  if (cloud !== null) push("forged.cloud", "Cloud cover", `${Math.round(cloud * 100)}%`);

  push("forged.composition", "Composition", str(p.composition));

  const ringOpacity = fin(p.ringOpacity);
  if (ringOpacity !== null && ringOpacity > 0.02) {
    push("forged.rings", "Rings", "Present");
  }

  const starTemp = fin(p.starTemp);
  if (starTemp !== null) push("forged.star", "Host star", `${Math.round(starTemp)} K`);

  return facts;
}
