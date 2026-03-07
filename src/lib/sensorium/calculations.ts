// SENSORIUM — Pure calculation functions
// No React dependencies. Safe to import from PDF templates.

import { MODALITIES, HUMAN_SENSES, getModalityById } from "./data";
import type {
  EnvironmentConfig,
  SensoryModality,
  DerivedModality,
  DerivationStatus,
  ValidationResult,
  MetabolicBudgetResult,
  PerceptionGap,
  SensoriumFormState,
  SenseConflict,
} from "./types";

// ─── Derivation Algorithm ────────────────────────────────────────

export function deriveModalities(env: EnvironmentConfig): DerivedModality[] {
  const results = MODALITIES.map((mod) => {
    const { status, rationale, score } = evaluateModality(mod, env);
    return { modality: mod, status, rationale, confidenceScore: score };
  });

  // Sort: recommended first, then possible, then implausible; within tier by score desc
  const order: Record<DerivationStatus, number> = {
    recommended: 0,
    possible: 1,
    implausible: 2,
  };
  results.sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      b.confidenceScore - a.confidenceScore
  );

  return results;
}

function evaluateModality(
  mod: SensoryModality,
  env: EnvironmentConfig
): { status: DerivationStatus; rationale: string; score: number } {
  let score = 70; // baseline
  const issues: string[] = [];
  const boosts: string[] = [];

  // 1. Medium compatibility
  if (!mod.requirements.medium.includes(env.medium.type)) {
    score -= 40;
    issues.push(
      `Requires ${mod.requirements.medium.join(" or ")} medium; environment is ${env.medium.type}`
    );
  }

  // 2. Atmosphere requirement
  if (mod.requirements.atmosphereRequired && !env.atmosphere.hasAtmosphere) {
    score -= 50;
    issues.push("Requires atmosphere but none present");
  }

  // 3. Pressure minimum (for sound-based senses)
  if (
    mod.requirements.minPressure != null &&
    env.atmosphere.pressure < mod.requirements.minPressure
  ) {
    score -= 30;
    issues.push(
      `Requires ≥${mod.requirements.minPressure} atm; environment has ${env.atmosphere.pressure} atm`
    );
  }

  // 4. Conductivity (electroreception)
  if (mod.requirements.conductiveMedium && env.medium.conductivity === "none") {
    score -= 50;
    issues.push("Requires conductive medium for electric field propagation");
  }

  // 5. Magnetic field (magnetoreception)
  if (mod.requirements.magneticFieldRequired && !env.magneticField.present) {
    score -= 50;
    issues.push("Requires planetary magnetic field but none present");
  }

  // 6. Liquid medium (aquatic chemoreception)
  if (mod.requirements.liquidRequired && env.medium.type !== "aquatic") {
    score -= 40;
    issues.push("Requires liquid medium for dissolved molecule detection");
  }

  // 7. EM boost based on star peak wavelength
  if (mod.category === "electromagnetic") {
    const emBoost = evaluateEMBoost(mod.id, env);
    score += emBoost.delta;
    if (emBoost.reason) {
      if (emBoost.delta > 0) boosts.push(emBoost.reason);
      else issues.push(emBoost.reason);
    }
  }

  // 8. Dark adaptation boost
  if (
    (env.lighting.tidallyLocked || !env.lighting.dayNightCycle) &&
    ["ir-vision", "thermal-imaging", "echolocation"].includes(mod.id)
  ) {
    score += 15;
    boosts.push(
      "Low-light environment strongly favors non-visual spatial awareness"
    );
  }

  // 9. Dense atmosphere boost for mechanical senses
  if (mod.category === "mechanical" && env.atmosphere.pressure > 1.5) {
    score += 10;
    boosts.push("Dense atmosphere enhances sound propagation");
  }

  // 10. Thin atmosphere penalty for hearing
  if (
    mod.category === "mechanical" &&
    mod.requirements.atmosphereRequired &&
    env.atmosphere.hasAtmosphere &&
    env.atmosphere.pressure < 0.1 &&
    env.atmosphere.pressure > 0
  ) {
    score -= 15;
    issues.push("Very thin atmosphere limits acoustic range and fidelity");
  }

  // 11. Opaque atmosphere penalty for visual senses
  if (
    mod.category === "electromagnetic" &&
    env.atmosphere.opacity === "opaque" &&
    ["uv-vision", "visible-light", "polarized-light"].includes(mod.id)
  ) {
    score -= 20;
    issues.push("Opaque atmosphere severely limits optical vision range");
  }

  // 12. Translucent atmosphere partial penalty
  if (
    mod.category === "electromagnetic" &&
    env.atmosphere.opacity === "translucent" &&
    ["uv-vision", "visible-light"].includes(mod.id)
  ) {
    score -= 10;
    issues.push("Hazy atmosphere reduces optical vision effectiveness");
  }

  // 13. High conductivity boost for electroreception
  if (
    mod.requirements.conductiveMedium &&
    env.medium.conductivity === "high"
  ) {
    score += 10;
    boosts.push("Highly conductive medium enhances electric field detection");
  }

  // 14. Variable magnetic field reduces magnetoreception reliability
  if (
    mod.id === "magnetoreception" &&
    env.magneticField.present &&
    env.magneticField.stability === "chaotic"
  ) {
    score -= 15;
    issues.push("Chaotic magnetic field reduces navigational reliability");
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: DerivationStatus;
  if (score >= 60) status = "recommended";
  else if (score >= 30) status = "possible";
  else status = "implausible";

  // Build rationale
  let rationale: string;
  if (issues.length > 0 && boosts.length > 0) {
    rationale = issues.join(". ") + ". However: " + boosts.join(". ") + ".";
  } else if (issues.length > 0) {
    rationale = issues.join(". ") + ".";
  } else if (boosts.length > 0) {
    rationale = boosts.join(". ") + ".";
  } else {
    rationale = getPositiveRationale(mod, env);
  }

  return { status, rationale, score };
}

function evaluateEMBoost(
  modalityId: string,
  env: EnvironmentConfig
): { delta: number; reason: string } {
  const peak = env.star.peakWavelength;

  switch (modalityId) {
    case "uv-vision":
      if (peak < 400)
        return {
          delta: 20,
          reason: `Star peaks at ${peak}nm (UV range)—UV vision is optimal`,
        };
      if (peak > 700)
        return {
          delta: -10,
          reason: "Star emits minimal UV—little evolutionary pressure for UV vision",
        };
      return { delta: 0, reason: "" };

    case "visible-light":
      if (peak >= 400 && peak <= 700)
        return {
          delta: 20,
          reason: `Star peaks at ${peak}nm (visible range)—visible vision is optimal`,
        };
      if (peak > 1000)
        return {
          delta: -15,
          reason: "Star emits very little visible light—visible vision is inefficient",
        };
      return { delta: 0, reason: "" };

    case "ir-vision":
      if (peak > 700)
        return {
          delta: 20,
          reason: `Star peaks at ${peak}nm (infrared)—IR vision captures most available light`,
        };
      if (peak < 400)
        return {
          delta: -10,
          reason: "Star emits predominantly in UV—IR vision offers little advantage",
        };
      return { delta: 0, reason: "" };

    case "thermal-imaging":
      if (peak > 900)
        return {
          delta: 15,
          reason: "Cool star environment makes thermal signatures more prominent",
        };
      return { delta: 0, reason: "" };

    case "passive-electroreception":
    case "active-electroreception":
      // Not affected by star type
      return { delta: 0, reason: "" };

    default:
      return { delta: 0, reason: "" };
  }
}

function getPositiveRationale(
  mod: SensoryModality,
  env: EnvironmentConfig
): string {
  const envDesc = env.medium.type;
  return `Environmental conditions on this ${envDesc} world support the evolution of ${mod.name}. Metabolic cost is ${mod.evolution.metabolicCost} (${mod.evolution.metabolicWeight} budget units).`;
}

// ─── Validation Algorithm ────────────────────────────────────────

export function validateSelection(
  selectedIds: string[],
  env: EnvironmentConfig
): ValidationResult {
  const derived = deriveModalities(env);

  const perModality = selectedIds.map((id) => {
    const found = derived.find((d) => d.modality.id === id);
    if (!found) {
      return {
        modalityId: id,
        plausible: false,
        score: 0,
        issues: ["Unknown modality"],
        suggestions: [],
      };
    }
    return {
      modalityId: id,
      plausible: found.status !== "implausible",
      score: found.confidenceScore,
      issues:
        found.status === "implausible"
          ? [found.rationale]
          : found.status === "possible"
            ? [`Marginal plausibility: ${found.rationale}`]
            : [],
      suggestions:
        found.status === "implausible"
          ? getSuggestionsForImplausible(found.modality, env)
          : found.status === "possible"
            ? [
                `Consider environmental modifications to better support ${found.modality.name}`,
              ]
            : [],
    };
  });

  const avgScore =
    perModality.length > 0
      ? Math.round(
          perModality.reduce((sum, p) => sum + p.score, 0) /
            perModality.length
        )
      : 0;

  const conflictingSenses = detectConflicts(selectedIds);

  const warnings = [
    ...perModality
      .filter((p) => !p.plausible)
      .map((p) => {
        const mod = getModalityById(p.modalityId);
        return `${mod?.name || p.modalityId} is implausible in this environment`;
      }),
    ...conflictingSenses.map(
      (c) => `Potential conflict: ${c.a} and ${c.b}—${c.reason}`
    ),
  ];

  return {
    overallPlausibility: avgScore,
    perModality,
    warnings,
    conflictingSenses,
  };
}

function getSuggestionsForImplausible(
  mod: SensoryModality,
  env: EnvironmentConfig
): string[] {
  const suggestions: string[] = [];

  if (mod.requirements.atmosphereRequired && !env.atmosphere.hasAtmosphere) {
    suggestions.push("Add an atmosphere to enable this sense");
  }
  if (mod.requirements.conductiveMedium && env.medium.conductivity === "none") {
    suggestions.push(
      "Switch to an aquatic or high-conductivity environment for electroreception"
    );
  }
  if (mod.requirements.magneticFieldRequired && !env.magneticField.present) {
    suggestions.push("Enable a planetary magnetic field");
  }
  if (mod.requirements.liquidRequired && env.medium.type !== "aquatic") {
    suggestions.push("Switch to an aquatic medium");
  }
  if (!mod.requirements.medium.includes(env.medium.type)) {
    suggestions.push(
      `Change environment to ${mod.requirements.medium.join(" or ")}`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Review environmental parameters—multiple conditions are unfavorable"
    );
  }

  return suggestions;
}

function detectConflicts(selectedIds: string[]): SenseConflict[] {
  const conflicts: SenseConflict[] = [];

  if (
    selectedIds.includes("echolocation") &&
    selectedIds.includes("ultrasonic-hearing")
  ) {
    conflicts.push({
      a: "echolocation",
      b: "ultrasonic-hearing",
      reason:
        "Both use ultrasonic frequencies—likely a single evolved system rather than two separate senses",
    });
  }

  if (
    selectedIds.includes("passive-electroreception") &&
    selectedIds.includes("active-electroreception")
  ) {
    conflicts.push({
      a: "passive-electroreception",
      b: "active-electroreception",
      reason:
        "Active electroreception typically includes passive capability—consider merging into one system",
    });
  }

  if (
    selectedIds.includes("airborne-smell") &&
    selectedIds.includes("distance-chemoreception")
  ) {
    conflicts.push({
      a: "airborne-smell",
      b: "distance-chemoreception",
      reason:
        "Distance chemoreception is an enhanced form of olfaction—these may be one system with two capabilities",
    });
  }

  return conflicts;
}

// ─── Metabolic Budget ────────────────────────────────────────────

export function calculateMetabolicBudget(
  selectedIds: string[]
): MetabolicBudgetResult {
  const perSense = selectedIds.map((id) => {
    const mod = getModalityById(id);
    return {
      modalityId: id,
      name: mod?.name || id,
      cost: mod ? mod.evolution.metabolicWeight : 0,
    };
  });

  const totalCost = perSense.reduce((sum, s) => sum + s.cost, 0);
  const rounded = Math.round(totalCost * 100) / 100;

  return {
    totalCost: rounded,
    maxSustainable: 1.0,
    warningThreshold: 0.8,
    overBudget: rounded > 1.0,
    perSense,
  };
}

// ─── Perception Gaps ─────────────────────────────────────────────

export function calculatePerceptionGaps(
  selectedIds: string[]
): PerceptionGap {
  const speciesPerceives: string[] = [];
  const speciesBlind: string[] = [];
  const conflictPotential: string[] = [];

  // What species perceives that humans cannot
  for (const id of selectedIds) {
    if (!HUMAN_SENSES.includes(id)) {
      const mod = getModalityById(id);
      if (mod) {
        speciesPerceives.push(mod.name);
      }
    }
  }

  // What humans perceive that species cannot
  for (const humanId of HUMAN_SENSES) {
    if (!selectedIds.includes(humanId)) {
      const mod = getModalityById(humanId);
      if (mod) {
        speciesBlind.push(mod.name);
      }
    }
  }

  // Generate conflict/story hooks
  if (speciesPerceives.length > 0 && speciesBlind.length > 0) {
    conflictPotential.push(
      "First contact misunderstandings from radically different sensory worlds"
    );
  }

  if (
    selectedIds.includes("uv-vision") &&
    !selectedIds.includes("visible-light")
  ) {
    conflictPotential.push(
      "Species literally cannot see human visual displays, screens, or art"
    );
  }

  if (
    !selectedIds.includes("visible-light") &&
    !selectedIds.includes("uv-vision")
  ) {
    conflictPotential.push(
      "Species has no optical vision—human body language, writing, and visual signals are meaningless"
    );
  }

  if (
    selectedIds.includes("echolocation") &&
    !selectedIds.includes("standard-hearing")
  ) {
    conflictPotential.push(
      "Music as humans know it means nothing; architecture is the primary art form"
    );
  }

  if (
    selectedIds.includes("passive-electroreception") ||
    selectedIds.includes("active-electroreception")
  ) {
    conflictPotential.push(
      "Species can detect bioelectric fields—lying, hiding emotions, or concealing illness is nearly impossible"
    );
  }

  if (selectedIds.includes("magnetoreception")) {
    conflictPotential.push(
      "Species has innate compass sense—concept of 'being lost' may not exist in their language"
    );
  }

  if (
    selectedIds.includes("thermal-imaging") &&
    !selectedIds.includes("visible-light")
  ) {
    conflictPotential.push(
      "Species sees the world as a heat map—cold objects and beings are effectively invisible"
    );
  }

  if (
    !selectedIds.includes("airborne-smell") &&
    !selectedIds.includes("aquatic-smell")
  ) {
    conflictPotential.push(
      "Species lacks any form of olfaction—food culture, perfumery, and scent-based memories don't exist"
    );
  }

  return { speciesPerceives, speciesBlind, conflictPotential };
}

// ─── Aggregate Worldbuilding Implications ────────────────────────

export interface ImplicationEntry {
  modalityName: string;
  text: string;
}

export function aggregateImplications(
  selectedIds: string[]
): Record<string, ImplicationEntry[]> {
  const categories = [
    "communication",
    "navigation",
    "hunting",
    "socialBehavior",
    "art",
    "architecture",
    "technology",
    "mythology",
  ] as const;

  const result: Record<string, ImplicationEntry[]> = {};
  for (const cat of categories) {
    result[cat] = [];
  }

  for (const id of selectedIds) {
    const mod = getModalityById(id);
    if (!mod) continue;
    for (const cat of categories) {
      if (mod.worldbuilding[cat]) {
        result[cat].push({ modalityName: mod.name, text: mod.worldbuilding[cat] });
      }
    }
  }

  return result;
}

// ─── Copy Text Builder ───────────────────────────────────────────

export function buildSensoriumCopyText(
  formState: SensoriumFormState
): string {
  const lines: string[] = [];

  lines.push(`Species: ${formState.speciesName || "Unnamed Species"}`);
  lines.push(`Mode: ${formState.mode === "derive" ? "Derive" : "Validate"}`);
  lines.push("");

  // Environment
  const env = formState.environment;
  lines.push("═ Environment ═");
  lines.push(`Star: ${env.star.preset.toUpperCase()}-Type (${env.star.temperature}K, peak ${env.star.peakWavelength}nm)`);
  lines.push(`Atmosphere: ${env.atmosphere.preset} (${env.atmosphere.pressure} atm, ${env.atmosphere.opacity})`);
  lines.push(`Medium: ${env.medium.type}`);
  lines.push(`Magnetic Field: ${env.magneticField.present ? `${env.magneticField.strength}, ${env.magneticField.stability}` : "None"}`);
  lines.push(`Lighting: ${env.lighting.tidallyLocked ? "Tidally locked" : env.lighting.dayNightCycle ? "Day/night cycle" : "No cycle"}`);
  lines.push("");

  // Selected senses
  if (formState.finalSelection.length > 0) {
    lines.push("═ Selected Senses ═");
    const budget = calculateMetabolicBudget(formState.finalSelection);
    for (const entry of budget.perSense) {
      lines.push(`• ${entry.name} (cost: ${entry.cost})`);
    }
    lines.push(`Total metabolic load: ${budget.totalCost} / ${budget.maxSustainable}`);
    if (budget.overBudget) lines.push("⚠ OVER BUDGET");
    lines.push("");
  }

  // Perception gaps
  const gaps = calculatePerceptionGaps(formState.finalSelection);
  if (gaps.speciesPerceives.length > 0) {
    lines.push("═ Perceives Beyond Human ═");
    gaps.speciesPerceives.forEach((s) => lines.push(`• ${s}`));
    lines.push("");
  }
  if (gaps.speciesBlind.length > 0) {
    lines.push("═ Cannot Perceive (Humans Can) ═");
    gaps.speciesBlind.forEach((s) => lines.push(`• ${s}`));
    lines.push("");
  }
  if (gaps.conflictPotential.length > 0) {
    lines.push("═ Story Hooks ═");
    gaps.conflictPotential.forEach((s) => lines.push(`• ${s}`));
  }

  return lines.join("\n");
}
