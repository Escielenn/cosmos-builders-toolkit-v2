// ---------------------------------------------------------------------------
// Generation Ship Designer (Ark): reference data.
//
// Every constant here is a published figure with its source beside it, so a
// writer who wants to argue with a number knows where to go and argue. The
// module is React-free so the PDF template and the tests can import it.
// ---------------------------------------------------------------------------

// ─── Per-capita consumables ─────────────────────────────────────────────
//
// NASA Baseline Values and Assumptions Document (BVAD), Anderson et al. 2018,
// NASA/TP-2015-218570/REV1, Table 4-21/4-22 nominal crew member values.

export const PER_CAPITA_KG_PER_DAY = {
  /** O2 consumed by an average crew member at nominal activity. */
  oxygen: 0.84,
  /** CO2 exhaled. An output, so it is shown but not counted in loop mass. */
  carbonDioxide: 1.04,
  /** Drinking water plus water used to rehydrate and prepare food. Hygiene water excluded. */
  water: 3.5,
  /** Food as provisioned (ISS planning figure, packaging included). About 0.6–0.8 kg of it is dry solids. */
  food: 1.8,
} as const;

export const CONSUMABLES_SOURCE =
  "NASA BVAD (Anderson et al. 2018, NASA/TP-2015-218570/REV1)";

/** Real loop performance, for calibration next to the writer's sliders. */
export const LOOP_BENCHMARKS = [
  { id: "iss-water", label: "ISS water recovery", value: "98%", note: "Brine processor, 2023. The best closed loop humans have flown." },
  { id: "iss-oxygen", label: "ISS oxygen recovery", value: "~40–50%", note: "Sabatier reactor recovers part of the O2 bound in exhaled CO2; the rest is resupplied." },
  { id: "bios3", label: "BIOS-3, Krasnoyarsk", value: "~95% air and water", note: "1970s Soviet sealed habitat. Crews of three for up to 180 days; much of the food still came from outside." },
  { id: "biosphere2", label: "Biosphere 2", value: "O2 fell 20.9% → 14.5%", note: "1991–93. Soil microbes ate oxygen and the fresh concrete absorbed the CO2 they made. Oxygen was pumped in." },
] as const;

// ─── Bioregenerative food ───────────────────────────────────────────────

/** Grow area per person for a full diet under electric light. Estimates run ~20–200 m² by yield assumptions. */
export const DEFAULT_CROP_AREA_M2 = 45;
export const CROP_AREA_NOTE =
  "NASA Advanced Life Support studies put a complete diet at roughly 40–50 m² of intensively lit crops per person. Field agriculture on Earth uses thousands.";

// ─── Spin gravity ───────────────────────────────────────────────────────

export const G0 = 9.80665; // m/s²
/** Rotation rate most people tolerate without adaptation (Hall 1997; Globus & Hall 2017). */
export const RPM_COMFORT = 2;
/** Above this, most crews need long adaptation and some never adapt. */
export const RPM_ADAPTABLE = 4;
export const WALKING_SPEED_MS = 1.4;
export const PERSON_HEIGHT_M = 1.8;
export const SPIN_SOURCE = "Hall 1997, 'Artificial gravity and the architecture of orbital habitats'; Globus & Hall 2017, NSS Space Settlement Journal";

// ─── Shielding ──────────────────────────────────────────────────────────

/** Areal mass of the 1975 Stanford Torus cosmic-ray shield (NASA SP-413), t/m². */
export const STANFORD_TORUS_SHIELD_T_PER_M2 = 4.5;

// ─── Minimum viable population ──────────────────────────────────────────
//
// Presented as a range of published answers, never as one magic number. The
// figures disagree because the questions differ: how long, how managed, how
// much catastrophe margin, whether a frozen bank exists.

export interface MvpReference {
  id: string;
  label: string;
  /** Census population this answer implies, low end, for the scale bar. */
  low: number;
  /** High end, equal to low for a point estimate. */
  high: number;
  figure: string;
  source: string;
  note: string;
}

export const MVP_REFERENCES: MvpReference[] = [
  {
    id: "50-500",
    label: "50/500 rule",
    low: 50,
    high: 500,
    figure: "Ne ≥ 50 short term · Ne ≥ 500 long term",
    source: "Franklin 1980; Soulé 1980",
    note: "Conservation-genetics rule of thumb. 50 keeps inbreeding depression in check for a few generations; 500 holds adaptive variation against drift indefinitely. It counts effective, not census, population.",
  },
  {
    id: "100-1000",
    label: "Revised 100/1000",
    low: 100,
    high: 1000,
    figure: "Ne ≥ 100 · Ne ≥ 1,000",
    source: "Frankham, Bradshaw & Brook 2014, Biological Conservation 170",
    note: "The modern revision. The old thresholds were too low once real inbreeding-depression data were pooled.",
  },
  {
    id: "marin-beluffi",
    label: "HERITAGE simulation",
    low: 98,
    high: 98,
    figure: "98 founders",
    source: "Marin & Beluffi 2018, JBIS 71",
    note: "Monte Carlo of a ~6,300-year Proxima b voyage. Works only with strict, enforced breeding rules and no catastrophes.",
  },
  {
    id: "moore",
    label: "Kin-based crew",
    low: 150,
    high: 180,
    figure: "150–180 people",
    source: "Moore 2002, 'Kin-based crews for interstellar multi-generational space travel'",
    note: "Anthropological model: managed marriages delayed to late reproductive age keep relatedness low for about 2,000 years.",
  },
  {
    id: "smith",
    label: "Catastrophe-proof",
    low: 14000,
    high: 44000,
    figure: "14,000–44,000 people",
    source: "Smith 2014, Acta Astronautica 97",
    note: "Keeps nearly all of humanity's genetic diversity and survives a population crash mid-voyage. The conservative answer.",
  },
];

// ─── Family-size variance presets ───────────────────────────────────────
//
// Vk is the variance in number of offspring per parent. With a stable
// population (mean 2), Ne/N ≈ 4 / (Vk + 2) (Crow & Kimura 1970).

export interface VariancePreset {
  id: string;
  label: string;
  vk: number;
  note: string;
}

export const VARIANCE_PRESETS: VariancePreset[] = [
  { id: "equalized", label: "Equalized (every couple has two)", vk: 0, note: "The breeding-program ideal. Doubles Ne, and requires a ship that tells people how many children to have." },
  { id: "managed", label: "Managed", vk: 1, note: "Quotas with some slack." },
  { id: "random", label: "Random (Poisson)", vk: 2, note: "No management, no inequality. Ne ≈ breeding census." },
  { id: "human", label: "Historical human", vk: 4, note: "Typical of pre-modern human populations; some families large, many small or none." },
  { id: "unequal", label: "Strongly unequal", vk: 8, note: "A few lineages dominate. Dynasties, polygyny, or an elite with breeding privilege." },
];

// ─── Phylo hand-offs ────────────────────────────────────────────────────

/** Phylo lifespan category → (generation years, lifespan years). */
export const LIFESPAN_TO_GENERATION: Record<string, { generationYears: number; lifespanYears: number }> = {
  ephemeral: { generationYears: 0.25, lifespanYears: 0.5 },
  short: { generationYears: 2, lifespanYears: 5 },
  moderate: { generationYears: 28, lifespanYears: 80 },
  long: { generationYears: 100, lifespanYears: 300 },
  extreme: { generationYears: 400, lifespanYears: 1500 },
  indefinite: { generationYears: 150, lifespanYears: 5000 },
  cyclical: { generationYears: 50, lifespanYears: 120 },
};

/** Phylo mating system → breeding sex ratio (female share) and family-size variance. */
export const MATING_TO_BREEDING: Record<string, { femaleFraction: number; vk: number }> = {
  monogamous: { femaleFraction: 0.5, vk: 2 },
  "pair-bonding": { femaleFraction: 0.5, vk: 1.5 },
  promiscuous: { femaleFraction: 0.5, vk: 3 },
  polygynous: { femaleFraction: 0.75, vk: 5 },
  harem: { femaleFraction: 0.85, vk: 6 },
  tournament: { femaleFraction: 0.8, vk: 6 },
  lekking: { femaleFraction: 0.85, vk: 7 },
  polyandrous: { femaleFraction: 0.3, vk: 4 },
};

// ─── Language drift ─────────────────────────────────────────────────────

/** Core-vocabulary retention per 1,000 years, Swadesh 100-word list (Swadesh 1955). */
export const SWADESH_RETENTION_PER_MILLENNIUM = 0.86;
export const GLOTTO_NOTE =
  "Glottochronology (Swadesh 1955; Lees 1953) is contested: real retention rates vary widely between languages and eras. Treat it as an order of magnitude, not a clock.";

/** Living memory turns into origin story beyond roughly three generations (Vansina 1985, the 'floating gap'). */
export const ORAL_HORIZON_GENERATIONS = 3;

// ─── Thresholds ─────────────────────────────────────────────────────────

/** Average inbreeding of a child of first cousins. */
export const F_FIRST_COUSIN = 0.0625;
/** Danger line: measurable inbreeding depression across the whole population. */
export const F_DANGER = 0.1;

export const SECTION_IDS = {
  voyage: "section-voyage",
  genetics: "section-genetics",
  lifeSupport: "section-life-support",
  habitat: "section-habitat",
  drift: "section-drift",
  chronicle: "section-chronicle",
  notes: "section-notes",
} as const;

export const GENSHIP_SECTIONS = [
  { id: SECTION_IDS.voyage, title: "1. Voyage" },
  { id: SECTION_IDS.genetics, title: "2. Population Genetics" },
  { id: SECTION_IDS.lifeSupport, title: "3. Closed Loop" },
  { id: SECTION_IDS.habitat, title: "4. Habitat" },
  { id: SECTION_IDS.drift, title: "5. Social Drift" },
  { id: SECTION_IDS.chronicle, title: "6. Generations" },
  { id: SECTION_IDS.notes, title: "Shipboard Notes" },
];
