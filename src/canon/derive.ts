// ---------------------------------------------------------------------------
// canon/derive, the derivation registry as a graph (02-ARCHITECTURE §3).
//
// Every manifest registers its derivations; this module answers the three
// questions the rest of the product asks of them:
//   - what does this predicate feed? (dependentsOf: Law II, consequence down)
//   - given these numbers, what follows, and what does it MEAN? (deriveAll:
//     the narrative is the product, Charter obligation 3)
//   - who computes this output? (derivationFor)
//
// Pure apart from the manifest registry. "Recompute marks stale and offers":
// nothing here writes. Callers decide whether a derived value is a first
// computation (assert) or a revision (mark stale, propose).
// ---------------------------------------------------------------------------

import { MANIFESTS } from "@/canon/manifests";
import type { Derivation, ToolManifest } from "@/canon/manifest";

export interface RegisteredDerivation {
  derivation: Derivation;
  tool: ToolManifest;
}

function registry(): RegisteredDerivation[] {
  return MANIFESTS.flatMap((tool) => tool.derives.map((derivation) => ({ derivation, tool })));
}

/** Every input a derivation reads, required and optional. */
export function inputsOf(d: Derivation): string[] {
  return [...d.inputs, ...(d.optionalInputs ?? [])];
}

/** The registered derivation that produces `output`, if any. */
export function derivationFor(output: string): RegisteredDerivation | undefined {
  return registry().find((r) => r.derivation.output === output);
}

/**
 * Derivations downstream of the given predicates, transitively and each once,
 * in dependency order. Changing star.luminosity reaches Goldilocks' HZ edges;
 * changing planet.mass reaches Atlas' gravity, escape velocity and density.
 */
export function dependentsOf(predicates: readonly string[]): RegisteredDerivation[] {
  const all = registry();
  const out: RegisteredDerivation[] = [];
  const frontier = new Set(predicates);
  const seen = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of all) {
      if (seen.has(r.derivation.id)) continue;
      if (inputsOf(r.derivation).some((i) => frontier.has(i))) {
        seen.add(r.derivation.id);
        out.push(r);
        frontier.add(r.derivation.output);
        grew = true;
      }
    }
  }
  return out;
}

export interface DerivedValue {
  derivation: Derivation;
  tool: ToolManifest;
  output: string;
  value: number;
  inputs: Record<string, number>;
  /** The consequence, in one sentence. */
  narrative: string;
}

/**
 * Everything that follows from `known`, iterated to a fixed point so a
 * derived value can feed the next derivation (L + M → Teff → HZ edges).
 * A value already in `known` is never overwritten: the writer's number wins.
 */
export function deriveAll(known: Readonly<Record<string, number>>): DerivedValue[] {
  const values: Record<string, number> = { ...known };
  const out: DerivedValue[] = [];
  const done = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const { derivation: d, tool } of registry()) {
      if (done.has(d.id) || d.output in values) continue;
      if (!d.inputs.every((i) => typeof values[i] === "number" && Number.isFinite(values[i]))) continue;
      const inputs: Record<string, number> = {};
      for (const i of inputsOf(d)) if (typeof values[i] === "number" && Number.isFinite(values[i])) inputs[i] = values[i];
      const v = d.fn(inputs);
      done.add(d.id);
      if (v === null || !Number.isFinite(v)) continue;
      values[d.output] = v;
      out.push({ derivation: d, tool, output: d.output, value: v, inputs, narrative: d.narrative(v, inputs) });
      grew = true;
    }
  }
  return out;
}
