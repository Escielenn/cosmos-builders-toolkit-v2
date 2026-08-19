// ---------------------------------------------------------------------------
// scene-prose, turning a simulator's numbers into a few sentences to stand in.
//
// Every simulator in this product answers "what would this look like" in
// numbers. None of them answer it in prose, and this codebase has no LLM
// integration to lean on for that (checked: no API client, no edge function,
// nothing under supabase/functions/ that calls out to one). What it does have
// is exactly this pattern already shipped for Sensorium
// (src/lib/sensorium/perceptual-narrative.ts): template fragments, chosen by
// condition, composed into a paragraph. This generalizes that pattern to the
// WorksheetFact shape every simulator's facts already arrive in, rather than
// inventing a second bespoke generator alongside the first.
//
// Pure by design: no React, no network, safe to call while rendering.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";

function findValue(facts: WorksheetFact[], key: string): string | null {
  return facts.find((f) => f.key === key)?.value ?? null;
}

/** The leading number in a formatted display value, e.g. "391 K (118°C)" -> 391. */
function leadingNumber(value: string): number | null {
  const m = value.match(/-?\d[\d,]*\.?\d*/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function generateTidelockProse(facts: WorksheetFact[]): string {
  const parts: string[] = [];

  const day = findValue(facts, "locked.daySide");
  const night = findValue(facts, "locked.nightSide");
  const term = findValue(facts, "locked.terminator");
  const band = findValue(facts, "locked.habitableBand");
  const gravity = findValue(facts, "locked.gravity");
  const tidal = findValue(facts, "locked.tidalState");

  if (day && night) {
    const dayK = leadingNumber(day);
    const nightK = leadingNumber(night);
    if (dayK !== null && nightK !== null) {
      const spread = dayK - nightK;
      if (spread > 150) {
        parts.push("The sky here never changes. One horizon holds a sun that never sets; the other holds a night that never breaks.");
      } else {
        parts.push("The day-night divide is gentler than most tidally locked worlds manage, the two hemispheres closer in temperament than in name.");
      }
    }
  }

  if (term) {
    const termK = leadingNumber(term);
    parts.push(
      termK !== null && termK > 273 && termK < 320
        ? "You are standing in the terminator band, the only strip of this world where the air does not immediately try to kill you."
        : "The terminator band is where anyone who lives here actually lives, whatever its exact temperature turns out to be.",
    );
  }

  if (band) {
    const pct = leadingNumber(band);
    if (pct !== null) {
      parts.push(
        pct < 5
          ? "That livable ground amounts to a sliver: a valley, a coastline, not a country."
          : pct < 20
            ? "That livable ground is a ring around the whole planet, narrow but continuous, enough for a road and the towns strung along it."
            : "That livable ground is wide enough to hold real geography: mountains, coastlines, more than one nation's worth of room.",
      );
    }
  }

  if (gravity) {
    const g = leadingNumber(gravity);
    if (g !== null && g > 1.3) {
      parts.push(`At ${g.toFixed(2)} g, every step here costs more than it would at home.`);
    } else if (g !== null && g < 0.7) {
      parts.push(`At ${g.toFixed(2)} g, movement here is looser than Earth ever allowed.`);
    }
  }

  // extractTidelockFacts's real values are "Confirmed", "Likely", or
  // "Unlikely" (public/tools/tidelock/sim.html:1089), not the word "locked"
  // itself, so matching only /lock/i left this sentence unreachable from any
  // live simulator run, verified while checking this against the actual page.
  // "Likely" is left out deliberately: this sentence asserts certainty a
  // merely-likely lock has not earned.
  if (tidal && /confirmed|lock/i.test(tidal)) {
    parts.push("The star does not move in this sky. It never has, and to anyone born here, the idea that it could is the strange one.");
  }

  return parts.join(" ");
}

/**
 * A simulator identified by the same `simulatorType` strings
 * `simulation-facts.ts` already dispatches on.
 */
export function generateSceneProse(facts: WorksheetFact[], simulatorType: string = "tidelock"): string {
  if (facts.length === 0) return "";
  switch (simulatorType) {
    case "tidelock":
      return generateTidelockProse(facts);
    default:
      return "";
  }
}
