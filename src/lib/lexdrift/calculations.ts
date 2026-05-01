// LEXDRIFT, Pure Calculation Engine
// No React dependencies, importable by both page components and PDF templates

import type { DivergenceSeverity } from "./data";
import {
  getDivergenceSeverity,
  SEVERITY_LABELS,
  STORY_PROMPTS,
  SOUND_CHANGES,
  GRAMMAR_CHANGES,
  HISTORICAL_ANALOGUES,
  STARTING_LANGUAGES,
} from "./data";

// ─── FormState for Calculations ─────────────────────────────────────

export interface ContactEvent {
  id: string;
  year: number;
  type: string;
  description: string;
}

export interface AdditionalShip {
  id: string;
  name: string;
  departureYear: number;
  population: number;
  selectedLanguages: string[];
}

export interface FormStateForCalc {
  mission: {
    duration: number;
    population: number;
    isolation: string;
  };
  linguistic: {
    selectedLanguages: string[];
    customLanguage: string;
    linguaFranca: string;
    includeSignLanguage: boolean;
    signLanguage: string;
    liturgicalPreservation: boolean;
    liturgicalLanguage: string;
  };
  social: {
    educationPolicy: string;
    identityPressure: number;
    mediaAccess: string;
    contactEvents: ContactEvent[];
  };
  multiShip: {
    enabled: boolean;
    ships: AdditionalShip[];
  };
}

// ─── Result Interface ───────────────────────────────────────────────

export interface LexDriftResult {
  valid: boolean;
  error?: string;

  // Core metrics
  divergencePercent: number;
  intelligibilityPercent: number;
  generations: number;
  effectiveRate: number;

  // Severity
  severity: DivergenceSeverity;
  severityLabel: string;

  // Modifier breakdown
  populationModifier: number;
  isolationModifier: number;
  educationModifier: number;
  identityModifier: number;
  mediaModifier: number;
  totalModifier: number;

  // Predicted changes
  soundChanges: string;
  grammarChanges: string;
  estimatedNewTerms: number;
  vocabularyCategories: string[];

  // Historical analogue
  historicalAnalogue: {
    title: string;
    description: string;
    period: string;
  };

  // Intelligibility description
  intelligibilityDescription: string;

  // Sign language (if enabled)
  signLanguageDivergence?: number;
  signLanguageIntelligibility?: number;
  signLanguageNote?: string;

  // Multi-ship results
  shipResults?: ShipDivergenceResult[];

  // Narrative
  narrativeSummary: string;
  storyCallouts: { title: string; prompt: string }[];

  // Liturgical note
  liturgicalNote?: string;
}

export interface ShipDivergenceResult {
  shipName: string;
  departureYear: number;
  divergenceFromEarth: number;
  intelligibilityWithPrimary: number;
  creolePotential: boolean;
  note: string;
}

// ─── Population Modifier ────────────────────────────────────────────

export function getPopulationModifier(population: number): number {
  if (population < 200) return 2.0;
  if (population < 1000) return 1.5;
  if (population < 5000) return 1.0;
  if (population < 20000) return 0.75;
  return 0.5;
}

// ─── Isolation Modifier ─────────────────────────────────────────────

const ISOLATION_MODIFIERS: Record<string, number> = {
  minimal: 0.3,
  low: 0.6,
  moderate: 1.0,
  high: 1.4,
  extreme: 1.8,
};

export function getIsolationModifier(isolation: string): number {
  return ISOLATION_MODIFIERS[isolation] ?? 1.0;
}

// ─── Education Modifier ─────────────────────────────────────────────

const EDUCATION_MODIFIERS: Record<string, number> = {
  strict: 0.4,
  moderate: 0.7,
  neutral: 1.0,
  local: 1.3,
  suppression: 1.6,
};

export function getEducationModifier(education: string): number {
  return EDUCATION_MODIFIERS[education] ?? 1.0;
}

// ─── Media Modifier ─────────────────────────────────────────────────

const MEDIA_MODIFIERS: Record<string, number> = {
  full: 0.5,
  archived: 0.7,
  limited: 1.0,
  minimal: 1.3,
  none: 1.6,
};

export function getMediaModifier(media: string): number {
  return MEDIA_MODIFIERS[media] ?? 1.0;
}

// ─── Identity Modifier ──────────────────────────────────────────────

export function getIdentityModifier(identityPressure: number): number {
  // 0–100 scaled to 0.5–1.5
  return 0.5 + identityPressure / 100;
}

// ─── Identity Label ─────────────────────────────────────────────────

export function getIdentityLabel(pressure: number): string {
  if (pressure <= 20) return "Earth-identified";
  if (pressure <= 50) return "Mixed";
  if (pressure <= 80) return "Ship/Colony-identified";
  return "Strongly Divergent";
}

// ─── Main Calculation ───────────────────────────────────────────────

export function calculateLexDrift(formState: FormStateForCalc): LexDriftResult {
  const { mission, linguistic, social, multiShip } = formState;

  // Validate inputs
  if (mission.duration <= 0) {
    return makeErrorResult("Set a mission duration to calculate.");
  }
  if (mission.population <= 0) {
    return makeErrorResult("Set a population to calculate.");
  }
  if (!mission.isolation) {
    return makeErrorResult("Select an isolation level.");
  }
  if (linguistic.selectedLanguages.length === 0 && !linguistic.customLanguage) {
    return makeErrorResult("Select at least one starting language.");
  }
  if (!social.educationPolicy) {
    return makeErrorResult("Select an education policy.");
  }
  if (!social.mediaAccess) {
    return makeErrorResult("Select a media access level.");
  }

  // Base divergence rate: ~0.5% per generation (25 years)
  const baseRate = 0.005;
  const generations = mission.duration / 25;

  // Calculate modifiers
  const popMod = getPopulationModifier(mission.population);
  const isoMod = getIsolationModifier(mission.isolation);
  const eduMod = getEducationModifier(social.educationPolicy);
  const idMod = getIdentityModifier(social.identityPressure);
  const mediaMod = getMediaModifier(social.mediaAccess);

  const totalMod = popMod * isoMod * eduMod * idMod * mediaMod;

  // Calculate divergence (capped at 100%)
  const effectiveRate = baseRate * totalMod;
  const divergence = Math.min(100, (1 - Math.pow(1 - effectiveRate, generations)) * 100);

  // Intelligibility drops faster than divergence
  const intelligibility = Math.max(0, 100 - divergence * 1.5);

  const severity = getDivergenceSeverity(divergence);
  const severityLabel = SEVERITY_LABELS[severity];

  // Estimated new vocabulary terms
  const estimatedNewTerms = Math.floor(divergence * 50 + mission.duration * 2);
  const vocabularyCategories = [
    "Technology & Ship Systems",
    "Social Roles & Hierarchy",
    "Temporal Concepts",
    "Taboo & Sacred Terms",
  ];
  if (linguistic.selectedLanguages.length > 1) {
    vocabularyCategories.push("Cross-Language Borrowings");
  }

  // Historical analogue
  const analogue = findHistoricalAnalogue(mission.duration, mission.isolation);

  // Intelligibility description
  const intelligibilityDescription = getIntelligibilityDescription(intelligibility);

  // Contact events modifier
  let contactNote = "";
  if (social.contactEvents.length > 0) {
    contactNote = `${social.contactEvents.length} contact event(s) may slow or redirect divergence at key points.`;
  }

  // Sign language calculation
  let signLanguageDivergence: number | undefined;
  let signLanguageIntelligibility: number | undefined;
  let signLanguageNote: string | undefined;
  if (linguistic.includeSignLanguage) {
    // Sign languages diverge faster in small communities
    const signMod = totalMod * 1.3; // 30% faster for small visual communities
    const signRate = baseRate * signMod;
    signLanguageDivergence = Math.min(100, (1 - Math.pow(1 - signRate, generations)) * 100);
    signLanguageIntelligibility = Math.max(0, 100 - signLanguageDivergence * 1.5);
    signLanguageNote =
      "Sign languages evolve independently from spoken languages, often faster in small communities. " +
      "The ship's sign language will diverge from its Earth ancestor on its own trajectory.";
  }

  // Liturgical preservation
  let liturgicalNote: string | undefined;
  if (linguistic.liturgicalPreservation && linguistic.liturgicalLanguage) {
    const langLabel =
      STARTING_LANGUAGES.find((l) => l.id === linguistic.liturgicalLanguage)?.label ||
      linguistic.liturgicalLanguage;
    liturgicalNote =
      `${langLabel} is preserved for ceremonial use, creating a diglossia: ` +
      `a 'high' preserved variety for ritual and a 'low' evolved variety for daily life. ` +
      `This mirrors Latin's persistence in the Catholic Church or Classical Arabic in modern Islam.`;
  }

  // Multi-ship calculations
  let shipResults: ShipDivergenceResult[] | undefined;
  if (multiShip.enabled && multiShip.ships.length > 0) {
    shipResults = calculateMultiShipDivergence(
      formState,
      divergence,
      effectiveRate
    );
  }

  // Generate narrative
  const narrativeSummary = generateNarrative(formState, divergence, intelligibility, severity, estimatedNewTerms, generations);

  return {
    valid: true,
    divergencePercent: divergence,
    intelligibilityPercent: intelligibility,
    generations,
    effectiveRate,
    severity,
    severityLabel,
    populationModifier: popMod,
    isolationModifier: isoMod,
    educationModifier: eduMod,
    identityModifier: idMod,
    mediaModifier: mediaMod,
    totalModifier: totalMod,
    soundChanges: SOUND_CHANGES[severity],
    grammarChanges: GRAMMAR_CHANGES[severity],
    estimatedNewTerms,
    vocabularyCategories,
    historicalAnalogue: {
      title: analogue.title,
      description: analogue.description + (contactNote ? ` ${contactNote}` : ""),
      period: analogue.period,
    },
    intelligibilityDescription,
    signLanguageDivergence,
    signLanguageIntelligibility,
    signLanguageNote,
    shipResults,
    narrativeSummary,
    storyCallouts: STORY_PROMPTS[severity] || [],
    liturgicalNote,
  };
}

// ─── Historical Analogue Lookup ─────────────────────────────────────

function findHistoricalAnalogue(
  duration: number,
  isolation: string
): { title: string; description: string; period: string } {
  // Find best match by duration
  for (let i = HISTORICAL_ANALOGUES.length - 1; i >= 0; i--) {
    const analogue = HISTORICAL_ANALOGUES[i];
    if (duration >= analogue.minYears && duration <= analogue.maxYears) {
      return analogue;
    }
  }
  // If duration exceeds all ranges, return the highest
  const last = HISTORICAL_ANALOGUES[HISTORICAL_ANALOGUES.length - 1];
  if (duration > last.maxYears) {
    return {
      title: "Beyond Historical Precedent",
      description: `At ${duration} years, this exceeds the Latin-to-Romance timeframe. Multiple language families may emerge from a single ancestor, each as distinct as Spanish from Romanian.`,
      period: `${duration}+ years`,
    };
  }
  return HISTORICAL_ANALOGUES[0];
}

// ─── Intelligibility Description ────────────────────────────────────

function getIntelligibilityDescription(intelligibility: number): string {
  if (intelligibility >= 90) return "Fully intelligible with accent/slang differences";
  if (intelligibility >= 70) return "Intelligible with effort; some confusion";
  if (intelligibility >= 50) return "Partially intelligible; frequent misunderstanding";
  if (intelligibility >= 25) return "Minimal intelligibility; requires study";
  return "Effectively unintelligible without training";
}

// ─── Multi-Ship Divergence ──────────────────────────────────────────

function calculateMultiShipDivergence(
  formState: FormStateForCalc,
  primaryDivergence: number,
  primaryRate: number,
): ShipDivergenceResult[] {
  return formState.multiShip.ships.map((ship) => {
    const shipDuration = formState.mission.duration - ship.departureYear;
    if (shipDuration <= 0) {
      return {
        shipName: ship.name || "Unnamed Ship",
        departureYear: ship.departureYear,
        divergenceFromEarth: 0,
        intelligibilityWithPrimary: 100,
        creolePotential: false,
        note: "This ship departs after or at the same time as the primary mission ends.",
      };
    }

    const shipGenerations = shipDuration / 25;
    const shipPopMod = getPopulationModifier(ship.population);
    // Use primary mission's other modifiers since ships share isolation context
    const shipRate = primaryRate * (shipPopMod / getPopulationModifier(formState.mission.population));
    const shipDiv = Math.min(100, (1 - Math.pow(1 - shipRate, shipGenerations)) * 100);

    // Inter-ship intelligibility: compare divergences
    // If both have diverged significantly, intelligibility between them is even lower
    const combinedDiv = Math.min(100, (primaryDivergence + shipDiv) * 0.6);
    const interIntelligibility = Math.max(0, 100 - combinedDiv * 1.5);

    // Creole potential when both are >30% divergent and they meet
    const creolePotential = primaryDivergence > 30 && shipDiv > 30;

    let note = `After ${shipDuration} years, this ship's language has diverged ${shipDiv.toFixed(1)}% from Earth standard.`;
    if (creolePotential) {
      note += " When these populations meet, a contact pidgin or creole is likely to emerge.";
    }

    return {
      shipName: ship.name || "Unnamed Ship",
      departureYear: ship.departureYear,
      divergenceFromEarth: shipDiv,
      intelligibilityWithPrimary: interIntelligibility,
      creolePotential,
      note,
    };
  });
}

// ─── Narrative Generation ───────────────────────────────────────────

function generateNarrative(
  formState: FormStateForCalc,
  divergence: number,
  intelligibility: number,
  severity: DivergenceSeverity,
  newTerms: number,
  generations: number
): string {
  const { mission, linguistic, social } = formState;

  const languageNames = linguistic.selectedLanguages
    .map((id) => STARTING_LANGUAGES.find((l) => l.id === id)?.label || id)
    .join(", ");

  const linguaFrancaLabel = linguistic.linguaFranca === "none"
    ? "no designated lingua franca"
    : linguistic.linguaFranca === "constructed"
      ? "a new constructed language as lingua franca"
      : `${STARTING_LANGUAGES.find((l) => l.id === linguistic.linguaFranca)?.label || linguistic.linguaFranca} as lingua franca`;

  let narrative = `A population of ${mission.population.toLocaleString()} departs carrying ${languageNames || "custom languages"}`;
  narrative += ` with ${linguaFrancaLabel}. `;
  narrative += `Over ${mission.duration} years (${generations.toFixed(0)} generations), `;

  if (severity === "dialect") {
    narrative += `the language develops into a recognizable dialect with ${newTerms.toLocaleString()} new terms. `;
    narrative += `Mutual intelligibility with Earth standard remains high at ${intelligibility.toFixed(0)}%.`;
  } else if (severity === "significant") {
    narrative += `significant divergence occurs (${divergence.toFixed(1)}%). `;
    narrative += `Approximately ${newTerms.toLocaleString()} new terms enter the vocabulary. `;
    narrative += `Earth speakers can still understand most communication (${intelligibility.toFixed(0)}% intelligibility) but notice clear differences.`;
  } else if (severity === "reduced") {
    narrative += `the language has diverged substantially (${divergence.toFixed(1)}%). `;
    narrative += `With only ${intelligibility.toFixed(0)}% mutual intelligibility, conversations require significant effort. `;
    narrative += `The ~${newTerms.toLocaleString()} new vocabulary items reflect ship-specific culture and experience.`;
  } else {
    narrative += `a separate language has emerged (${divergence.toFixed(1)}% divergence). `;
    narrative += `At ${intelligibility.toFixed(0)}% intelligibility, the language is effectively incomprehensible to Earth speakers without study. `;
    narrative += `Over ${newTerms.toLocaleString()} new terms reflect a fundamentally different lived experience.`;
  }

  if (social.educationPolicy === "strict") {
    narrative += " Strict preservation policies slow change but create tension between 'official' and 'spoken' language.";
  } else if (social.educationPolicy === "suppression") {
    narrative += " Active suppression of heritage forms accelerates divergence and creates strong in-group identity.";
  }

  return narrative;
}

// ─── Copy Text Builder ──────────────────────────────────────────────

export function buildCopyText(result: LexDriftResult, formState: FormStateForCalc): string {
  let text = "Lexdrift, LANGUAGE EVOLUTION ANALYSIS\n";
  text += "======================================\n\n";
  text += `Duration: ${formState.mission.duration} years (${result.generations.toFixed(0)} generations)\n`;
  text += `Population: ${formState.mission.population.toLocaleString()}\n`;
  text += `Isolation: ${formState.mission.isolation}\n\n`;

  text += "RESULTS\n";
  text += "-------\n";
  text += `Divergence: ${result.divergencePercent.toFixed(1)}% (${result.severityLabel})\n`;
  text += `Mutual Intelligibility: ${result.intelligibilityPercent.toFixed(1)}%\n`;
  text += `Estimated New Terms: ~${result.estimatedNewTerms.toLocaleString()}\n\n`;

  text += "PREDICTED CHANGES\n";
  text += "-----------------\n";
  text += `Sound: ${result.soundChanges}\n`;
  text += `Grammar: ${result.grammarChanges}\n\n`;

  text += `Historical Analogue: ${result.historicalAnalogue.title}\n`;
  text += `${result.historicalAnalogue.description}\n\n`;

  text += `${result.narrativeSummary}\n\n`;

  text += "Generated by StellarForge.tools\n";
  return text;
}

// ─── Error Helper ───────────────────────────────────────────────────

function makeErrorResult(error: string): LexDriftResult {
  return {
    valid: false,
    error,
    divergencePercent: 0,
    intelligibilityPercent: 100,
    generations: 0,
    effectiveRate: 0,
    severity: "dialect",
    severityLabel: "-",
    populationModifier: 1,
    isolationModifier: 1,
    educationModifier: 1,
    identityModifier: 1,
    mediaModifier: 1,
    totalModifier: 1,
    soundChanges: "",
    grammarChanges: "",
    estimatedNewTerms: 0,
    vocabularyCategories: [],
    historicalAnalogue: { title: "", description: "", period: "" },
    intelligibilityDescription: "",
    narrativeSummary: "",
    storyCallouts: [],
  };
}
