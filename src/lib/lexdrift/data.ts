// LEXDRIFT, Language Evolution Data Constants
// Starting languages, social factors, story prompts, section navigation

import type { Section } from "@/components/tools/SectionNavigation";

// ─── Starting Languages ─────────────────────────────────────────────

export interface StartingLanguage {
  id: string;
  label: string;
  family: string;
}

export const STARTING_LANGUAGES: StartingLanguage[] = [
  { id: "english", label: "English", family: "Germanic" },
  { id: "mandarin", label: "Mandarin Chinese", family: "Sino-Tibetan" },
  { id: "spanish", label: "Spanish", family: "Romance" },
  { id: "hindi", label: "Hindi", family: "Indo-Aryan" },
  { id: "arabic", label: "Arabic", family: "Semitic" },
  { id: "russian", label: "Russian", family: "Slavic" },
  { id: "japanese", label: "Japanese", family: "Japonic" },
  { id: "french", label: "French", family: "Romance" },
  { id: "german", label: "German", family: "Germanic" },
  { id: "portuguese", label: "Portuguese", family: "Romance" },
];

// ─── Sign Languages ─────────────────────────────────────────────────

export interface SignLanguageOption {
  id: string;
  label: string;
}

export const SIGN_LANGUAGES: SignLanguageOption[] = [
  { id: "asl", label: "ASL (American Sign Language)" },
  { id: "bsl", label: "BSL (British Sign Language)" },
  { id: "csl", label: "CSL (Chinese Sign Language)" },
  { id: "international", label: "International Sign" },
  { id: "ship-sign", label: "New Ship Sign Language" },
];

// ─── Isolation Levels ───────────────────────────────────────────────

export interface IsolationLevel {
  id: string;
  label: string;
  description: string;
}

export const ISOLATION_LEVELS: IsolationLevel[] = [
  { id: "minimal", label: "Minimal", description: "Same system, regular contact" },
  { id: "low", label: "Low", description: "<5 light-years, delayed but regular communication" },
  { id: "moderate", label: "Moderate", description: "5–20 light-years, significant delay" },
  { id: "high", label: "High", description: "20–100 light-years, generational delay" },
  { id: "extreme", label: "Extreme", description: ">100 light-years, effectively no contact" },
];

// ─── Education Policies ─────────────────────────────────────────────

export interface EducationPolicy {
  id: string;
  label: string;
  description: string;
}

export const EDUCATION_POLICIES: EducationPolicy[] = [
  { id: "strict", label: "Strict Preservation", description: "Active maintenance of Earth standards" },
  { id: "moderate", label: "Moderate Preservation", description: "Standard taught but drift tolerated" },
  { id: "neutral", label: "Neutral", description: "No active language policy" },
  { id: "local", label: "Local Promotion", description: "Ship/colony dialect encouraged" },
  { id: "suppression", label: "Heritage Suppression", description: "Active discouragement of Earth forms" },
];

// ─── Media Access Levels ────────────────────────────────────────────

export interface MediaAccessLevel {
  id: string;
  label: string;
  description: string;
}

export const MEDIA_ACCESS_LEVELS: MediaAccessLevel[] = [
  { id: "full", label: "Full", description: "Complete Earth media library, regularly updated" },
  { id: "archived", label: "Archived", description: "Departure-era media only" },
  { id: "limited", label: "Limited", description: "Curated educational materials" },
  { id: "minimal", label: "Minimal", description: "Technical documentation only" },
  { id: "none", label: "None", description: "Complete media independence" },
];

// ─── Contact Event Types ────────────────────────────────────────────

export interface ContactEventType {
  id: string;
  label: string;
}

export const CONTACT_EVENT_TYPES: ContactEventType[] = [
  { id: "later-ship", label: "Later Arrival Ship" },
  { id: "return-mission", label: "Return Mission" },
  { id: "alien-contact", label: "Alien Contact" },
  { id: "ai-integration", label: "AI Integration" },
];

// ─── Lingua Franca Options ──────────────────────────────────────────

export const LINGUA_FRANCA_SPECIAL = [
  { id: "none", label: "None (multilingual equality)" },
  { id: "constructed", label: "New constructed language" },
];

// ─── Divergence Severity ────────────────────────────────────────────

export type DivergenceSeverity = "dialect" | "significant" | "reduced" | "separate";

export function getDivergenceSeverity(divergencePercent: number): DivergenceSeverity {
  if (divergencePercent <= 20) return "dialect";
  if (divergencePercent <= 50) return "significant";
  if (divergencePercent <= 75) return "reduced";
  return "separate";
}

export const SEVERITY_LABELS: Record<DivergenceSeverity, string> = {
  dialect: "Dialect Differences",
  significant: "Significant Dialect",
  reduced: "Reduced Intelligibility",
  separate: "Separate Language",
};

// ─── Story Prompts ──────────────────────────────────────────────────

export interface StoryPrompt {
  title: string;
  prompt: string;
}

export const STORY_PROMPTS: Record<DivergenceSeverity, StoryPrompt[]> = {
  dialect: [
    {
      title: "Ship Slang",
      prompt: "New vocabulary develops for ship-specific concepts. Outsiders notice the accent before anything else. A few borrowed words from other shipboard languages create colorful speech patterns.",
    },
    {
      title: "Professional Jargon",
      prompt: "Technical terminology evolves fastest, engineering crews develop shorthand that becomes permanent vocabulary. 'Standard' language is maintained in formal contexts.",
    },
  ],
  significant: [
    {
      title: "The Children's Language",
      prompt: "Children drive the most significant changes. The second generation speaks differently from their parents; the third generation barely recognizes recordings of the departure language.",
    },
    {
      title: "Identity Marker",
      prompt: "Linguistic differences become identity markers. Speaking 'old Earth' style marks someone as conservative or nostalgic. The new accent becomes a source of pride.",
    },
    {
      title: "Misunderstanding as Conflict",
      prompt: "When contact is reestablished, seemingly familiar words carry different meanings. Diplomatic incidents arise from false cognates and shifted connotations.",
    },
  ],
  reduced: [
    {
      title: "The Translation Problem",
      prompt: "Returnees or arriving ships need interpreters. Children raised in the ship language cannot understand unmodified Earth media without subtitles.",
    },
    {
      title: "Cultural Fossils",
      prompt: "Ceremonial language preserves archaic forms, prayers, oaths, and technical manuals in 'old speech' contrast with everyday communication.",
    },
    {
      title: "The Generation Gap",
      prompt: "Grandparents and grandchildren struggle to communicate. Each generation moves further from the departure standard. The linguistic past becomes a foreign country.",
    },
  ],
  separate: [
    {
      title: "First Contact with Humans",
      prompt: "When ships finally meet, the encounter resembles first contact between alien species, familiar faces speaking incomprehensible languages.",
    },
    {
      title: "Linguistic Archaeology",
      prompt: "Scholars study the ship language's evolution like historical linguists, tracing sound shifts, grammatical innovations, and loanwords to reconstruct the journey's social history.",
    },
    {
      title: "The Babel Effect",
      prompt: "Multiple ships arriving at the same colony create a linguistic patchwork. Pidgin languages emerge for trade. Children create creoles that become dominant.",
    },
    {
      title: "Lost Literature",
      prompt: "Departure-era literature becomes incomprehensible. Shakespeare requires translation. The ship's own literary tradition has diverged into something unrecognizable to Earth readers.",
    },
  ],
};

// ─── Historical Analogues ───────────────────────────────────────────

export interface HistoricalAnalogue {
  minYears: number;
  maxYears: number;
  isolationMin: string;
  title: string;
  description: string;
  period: string;
}

export const HISTORICAL_ANALOGUES: HistoricalAnalogue[] = [
  {
    minYears: 0,
    maxYears: 50,
    isolationMin: "minimal",
    title: "ISS Crew Jargon",
    description: "Specialized vocabulary develops in isolated professional communities, but the base language remains unchanged.",
    period: "Decades",
  },
  {
    minYears: 50,
    maxYears: 100,
    isolationMin: "moderate",
    title: "New Zealand English Formation",
    description: "A distinctive national accent and vocabulary emerged within 2-3 generations of settlement. 'Kiwi English' became a recognizable dialect.",
    period: "1840s–1920s",
  },
  {
    minYears: 100,
    maxYears: 200,
    isolationMin: "high",
    title: "Polynesian Island Dialects",
    description: "Island communities developed distinct languages from a common Austronesian ancestor. Each island's isolation created unique linguistic evolution.",
    period: "~1,000 years compressed",
  },
  {
    minYears: 200,
    maxYears: 400,
    isolationMin: "high",
    title: "Middle English → Early Modern English",
    description: "The Great Vowel Shift, Norman French influence, and grammar simplification transformed English beyond recognition to earlier speakers.",
    period: "1100–1500 CE",
  },
  {
    minYears: 400,
    maxYears: 1000,
    isolationMin: "extreme",
    title: "Latin → Romance Languages",
    description: "A single language fractured into mutually unintelligible languages: Spanish, French, Italian, Portuguese, Romanian. Each shaped by local substrate languages and isolation.",
    period: "200–1000 CE",
  },
];

// ─── Sound Change Descriptions ──────────────────────────────────────

export const SOUND_CHANGES: Record<DivergenceSeverity, string> = {
  dialect: "Minor accent drift, vowel coloring. Speakers from different groups are easily understood but noticeably different.",
  significant: "Systematic vowel shift beginning, consonant weakening in common words. Some words become unrecognizable to outsiders.",
  reduced: "Complete vowel shift, significant consonant changes. Sound system reorganizing around new patterns. Historical recordings sound foreign.",
  separate: "Sound system restructured. Phoneme inventory has changed, new sounds created, old ones merged or lost. Original speakers would not recognize the language.",
};

export const GRAMMAR_CHANGES: Record<DivergenceSeverity, string> = {
  dialect: "New idioms, slight word order flexibility. Function words begin to contract. New politeness markers emerge from ship hierarchy.",
  significant: "Case/gender simplification, new tense distinctions. Word order becoming more rigid as inflections erode. New grammatical particles from common phrases.",
  reduced: "Major morphological restructuring. Verb conjugation simplified or replaced by particles. New evidentiality markers (how you know what you're saying).",
  separate: "Fundamentally different grammatical system. Original inflectional morphology replaced. New categories that didn't exist in the parent language.",
};

// ─── Sample Text Transformations ────────────────────────────────────

export const SAMPLE_ORIGINAL = "The ship's maintenance crew reported that the hydroponics bay needs repairs.";

export interface SampleTransformation {
  years: number;
  label: string;
  text: string;
  notes: string;
}

export const SAMPLE_TRANSFORMATIONS: SampleTransformation[] = [
  {
    years: 50,
    label: "After 50 years (Mild)",
    text: "The ship's maint crew reported that the hydro bay needs repairs.",
    notes: "Compound shortening, jargon abbreviation. Fully intelligible.",
  },
  {
    years: 100,
    label: "After 100 years (Moderate)",
    text: "Ship's maint crew reported hydro bay needs repairs.",
    notes: "Article dropping, compound fusion. Intelligible with minor effort.",
  },
  {
    years: 200,
    label: "After 200 years (Significant)",
    text: "Shipmaint crewed that hydrobay needin' repwork.",
    notes: "Compound fusion, verb shifting, affix creation. Partially intelligible.",
  },
  {
    years: 400,
    label: "After 400 years (Major)",
    text: "Shipmate kruud hidrōbe niidz repwark.",
    notes: "Vowel shift, consonant simplification, new stress patterns. Barely intelligible.",
  },
  {
    years: 600,
    label: "After 600+ years (Separate)",
    text: "Šipmait krūd hadrōbi nīdz repvak.",
    notes: "Restructured phonology, new orthography conventions. Unintelligible without study.",
  },
];

// ─── Scientific Notes ───────────────────────────────────────────────

export const SCIENTIFIC_NOTES = [
  {
    title: "Systematicity",
    text: "Sound changes typically affect entire classes of sounds, not individual words. When 'p' weakens to 'f', it does so in all words.",
  },
  {
    title: "Children as Drivers",
    text: "Most significant changes occur as children acquire language and regularize irregular patterns. Each generation 'resets' the language slightly.",
  },
  {
    title: "Identity Acceleration",
    text: "When linguistic difference becomes a marker of group identity, divergence accelerates. 'We don't talk like them' becomes self-reinforcing.",
  },
  {
    title: "The Compound Problem",
    text: "Each arriving ship brings its own evolved variety, creating stratified linguistic communities. Creole formation becomes likely.",
  },
  {
    title: "Preservation Patterns",
    text: "Technical and ceremonial language often preserves archaic forms while everyday speech evolves. Religion, law, and engineering create 'frozen' registers.",
  },
  {
    title: "Sign Language Independence",
    text: "Sign languages evolve on their own trajectory, often faster than spoken languages in small communities due to smaller speaker pools.",
  },
];

// ─── Section Navigation ─────────────────────────────────────────────

export const LEXDRIFT_SECTIONS: Section[] = [
  { id: "section-mission", title: "1. Mission Parameters" },
  { id: "section-linguistic", title: "2. Linguistic Config" },
  { id: "section-social", title: "3. Social Factors" },
  { id: "section-results", title: "4. Predicted Outcomes" },
  { id: "section-samples", title: "5. Language Samples" },
  { id: "section-multi-ship", title: "6. Multi-Ship" },
  { id: "section-story", title: "7. Story Notes" },
];

// ─── Section Helpers ────────────────────────────────────────────────

export const SECTION_HELPERS: Record<string, string> = {
  mission: "Set the physical parameters of your mission. Duration is the primary driver of divergence, longer missions mean more generations of children reshaping the language.",
  linguistic: "Choose which Earth languages your population carries and how they interact. Multilingual ships evolve differently from monolingual ones.",
  social: "Social pressure is the accelerator or brake on language change. Education policy, identity, and media access shape how fast the language drifts.",
  results: "All predictions are based on documented rates of language change, adjusted for your scenario's unique pressures. Real language change is messier than any model.",
  samples: "These samples show how a simple sentence might transform over time. The specific changes are illustrative, your world's actual evolution would follow its own path.",
  multiShip: "When multiple ships meet, their evolved languages interact. Pidgins form for trade, creoles emerge in the next generation, and the linguistic landscape becomes complex.",
  story: "Use these prompts to explore how language change affects your characters and their society.",
};
