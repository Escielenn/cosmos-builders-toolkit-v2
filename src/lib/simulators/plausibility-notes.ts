// ---------------------------------------------------------------------------
// plausibility-notes, a simulator noticing its own configuration.
//
// ContinuityPanel checks prose against what a writer already recorded. This
// checks a simulator's live output against physical plausibility, using the
// same "margin note, not correction" tone: nothing here blocks, nothing is
// severity-ranked beyond a single "note" level, and every message states the
// number rather than passing a bare judgment. A writer building a genuinely
// exotic world on purpose should see the note and keep going, not be stopped.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

export interface PlausibilityNote {
  key: string;
  message: string;
  severity: "note";
}

function fin(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function checkTidelockPlausibility(results: Record<string, unknown>): PlausibilityNote[] {
  const notes: PlausibilityNote[] = [];

  const habPct = fin(results.habPct);
  if (habPct !== null && habPct > 0 && habPct < 5) {
    notes.push({
      key: "narrowBand",
      severity: "note",
      message: `The habitable band covers ${habPct.toFixed(1)}% of the surface. That is closer to a single valley than a civilization's worth of territory, worth knowing if the story needs more than one settlement.`,
    });
  }

  const escVel = fin(results.escVel);
  if (escVel !== null && escVel > 0 && escVel < 5) {
    notes.push({
      key: "weakEscape",
      severity: "note",
      message: `Escape velocity is ${escVel.toFixed(1)} km/s, below Mars's own 5.0. Over geological time a world this small tends to lose its atmosphere rather than keep one, per the same Jeans-escape reasoning this tool's science page cites.`,
    });
  }

  const ssp = fin(results.tSSP);
  const term = fin(results.tTerm);
  if (ssp !== null && term !== null && term > ssp) {
    notes.push({
      key: "invertedGradient",
      severity: "note",
      message: `The terminator reads hotter than the substellar point (${Math.round(term)} K against ${Math.round(ssp)} K). That is the reverse of what tidal heating from the star alone would produce, worth a second look if this was not the intent.`,
    });
  }

  return notes;
}
