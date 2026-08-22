// ---------------------------------------------------------------------------
// Gravitas consequence flag.
//
// Gravitas is a worksheet/calculator, not a canvas simulator, but its spin
// mode already computes exactly the quantity idea #4's table names
// ("spin gravity with a Coriolis gradient over comfort threshold") —
// SpinGravityOutput.coriolis_intensity and is_comfortable, live React state,
// no instrumentation needed. Included because the data already exists and
// withholding a flag the tool can already answer would be its own kind of
// dishonesty about what "done" means for Brief S4.
// ---------------------------------------------------------------------------

import type { SimFlag, SimFlagRule } from "./types";
import type { CoriolisIntensity } from "@/lib/gravitas/types";

export interface GravitasSpinOutput {
  coriolis_intensity: CoriolisIntensity;
  is_comfortable: boolean;
  gradient_percent: number;
}

const coriolisDiscomfort: SimFlagRule<GravitasSpinOutput> = (o) => {
  if (o.is_comfortable) return null;
  return {
    id: "gravitas.coriolis-discomfort",
    sim: "gravitas",
    severity: "tension",
    title: `CORIOLIS: ${o.coriolis_intensity.toUpperCase()}`,
    body: "Walking along the ring feels wrong at this spin rate — everyone here has sea legs. Fast head turns produce vertigo, thrown objects curve, and it never stops being noticeable to someone born on a planet.",
    cites: { coriolis_intensity: o.coriolis_intensity, gradient_percent: Number(o.gradient_percent.toFixed(1)) },
  };
};

export const GRAVITAS_RULES: SimFlagRule<GravitasSpinOutput>[] = [coriolisDiscomfort];

export function evaluateGravitasFlags(output: GravitasSpinOutput): SimFlag[] {
  return GRAVITAS_RULES.map((rule) => rule(output)).filter((f): f is SimFlag => f !== null);
}
