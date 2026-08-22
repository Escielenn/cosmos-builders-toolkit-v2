// ---------------------------------------------------------------------------
// SimFlag, a simulator noticing a consequence of its own output.
//
// This is Idea #4 from docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §2
// (Brief S4) — the one item of the five-simulator constellation that needs
// no entities, no epochs, no canon graph. A pure predicate over a
// simulator's OWN in-memory output, cited, dismissible, never blocking.
//
// Modeled after (and a deliberate preview of) the Situation node in
// 02-ARCHITECTURE.md — same severity vocabulary, same "cites the facts that
// triggered it" discipline — because these rules generalize into world-level
// Situations once S1/S2 (publish/open-on) exist. A rule written honestly
// now costs nothing to promote later; one written as a one-off does not.
//
// Pure by design: no React, no network, no randomness, safe to call on
// every render.
// ---------------------------------------------------------------------------

export type SimId = "tidelock" | "solaris" | "exoforge" | "rogue" | "exosky" | "gravitas";

export type SimFlagSeverity = "tension" | "opportunity";

export interface SimFlag {
  /** Stable within one sim's rule set, e.g. "narrow-habitable-band". */
  id: string;
  sim: SimId;
  severity: SimFlagSeverity;
  /**
   * Short label for the strip header / a screenshot's alt text, Ship's
   * Voice, e.g. "HABITABLE BAND: 4.1°".
   */
  title: string;
  /**
   * The consequence, in one or two sentences. State what it MEANS, not the
   * number again — the number already lives in `title` and `cites`.
   */
  body: string;
  /** The literal values that triggered this flag, for the writer to check. */
  cites: Record<string, string | number>;
}

/**
 * A rule is a pure predicate over one simulator's live output shape `T`.
 * Returns a flag when the condition holds, null otherwise — never throws,
 * never has a side effect, never sees anything but what's passed in.
 */
export type SimFlagRule<T> = (output: T) => SimFlag | null;

/**
 * The key a "dismiss" action should record — `id` alone is NOT enough.
 * "Dismissible per run" means dismissing today's 4.1° habitable band must
 * not silently swallow tomorrow's 1.2° one after the writer reconfigures
 * the world: the rule fired again with a materially different, still-true
 * warning. Folding `cites` into the key means a dismissal only survives
 * exactly as long as the cited values that earned it.
 */
export function flagDismissKey(f: SimFlag): string {
  return `${f.id}::${JSON.stringify(f.cites)}`;
}
