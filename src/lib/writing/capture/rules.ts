// ---------------------------------------------------------------------------
// capture/rules, the Canon Capture rule table (Studio Charter §2.2, Brief 3).
//
// Rule-based, deterministic, narrow on purpose. Each rule names one
// vocabulary predicate (or, for height, picks one from the subject's type),
// the surface patterns that state it, and the context a sentence must carry
// before a bare unit is believed ("1.4 g" is gravity only in a sentence about
// gravity; otherwise it might be grams). A false claim costs the writer more
// trust than a missed one, so every pattern below prefers to miss.
//
//   rule          predicate                    unit          subject types
//   ------------  ---------------------------  ------------  ----------------------
//   gravity       planet.surface_gravity       g             planet, moon
//   day-length    planet.rotation_period       hours         planet, moon
//   year-length   planet.year_length           local_days    planet, moon
//                 orbit.period (std days/yrs)  days
//   spectral      star.spectral_class          enum          star
//   crew          vessel.crew_size             count         vessel
//   tilt          planet.obliquity             deg           planet, moon
//   pressure      planet.atmo_pressure         bar           planet, moon
//   temperature   planet.temp_mean             K             planet, moon
//   radius        planet.radius                earth_radii   planet, moon
//   mass          planet.mass                  earth_masses  planet, moon
//   star-mass     star.mass                    solar_masses  star
//   orbit         orbit.semi_major_axis        au            planet, moon
//   height        place.height                 m             location   (named only)
//                 character.height             m             character  (named or POV "I")
//                 species.height_typical       m             species    (named only)
//   population    place.population             individuals   location, planet, moon
//   lifespan      species.lifespan             local_years   species
//   star-age      star.age                     gyr           star       (named only)
//   cruise        propulsion.cruise_fraction_c c             vessel, technology
//
// Deliberately absent, because the vocabulary has no predicate for them yet
// (each needs /sf-fact, not a guess): moon count ("two moons"), a
// character's age ("Mira is 34 years old"), distances between places.
//
// Pure data plus small readers. Detection lives in detect.ts.
// ---------------------------------------------------------------------------

import { HEDGE_SRC, NUM_SRC, parseQuantity } from "@/lib/writing/capture/numbers";
import { convert, convertSpan, unitFromToken } from "@/lib/writing/capture/units";

export type ClaimKind = "measure" | "count" | "enum";

/** What a matched pattern says, already in the predicate's unit. */
export type Reading =
  | { kind: "number"; value: number; halfStep: number; unit: string; predicate?: string }
  | { kind: "enum"; value: string };

export interface CapturePattern {
  re: RegExp;
  /** Sentence must match (a bare unit is believed only in context). */
  requires?: RegExp;
  /** Sentence must not match. */
  forbids?: RegExp;
  /** Bind only to an entity named in the prose (or the POV for "I"). */
  namedOnly?: boolean;
}

export interface CaptureRule {
  id: string;
  /** Fixed predicate, or null when chosen by the subject's entity type. */
  predicate: string | null;
  /** Entity type → predicate, for rules whose predicate depends on it. */
  byType?: Readonly<Record<string, string>>;
  kind: ClaimKind;
  /** Target unit of the predicate (canon/units id). */
  unit?: string;
  /** Entity types this claim can be about. */
  subjectTypes: readonly string[];
  /** Cheap pre-filter on the paragraph; patterns run only when it matches. */
  hint: RegExp;
  patterns: readonly CapturePattern[];
  read(m: RegExpExecArray): Reading | null;
}

// ---------------------------------------------------------------------------
// Regex building blocks
// ---------------------------------------------------------------------------

const N = NUM_SRC;
/** Optional hedge before a quantity, captured as `lead`. */
const H = `(?:(?<lead>${HEDGE_SRC})\\s+)?`;
const ADJ =
  "(?:dim|small|old|ancient|young|distant|cool|hot|bright|faint|lone|single|dying|guttering|tiny|swollen|angry|flaring|quiet|steady|sullen|pale|ruddy|feeble|fierce|stable|variable)";
const SPECTRAL_CLASS = "[OBAFGKM](?:\\d(?:\\.\\d)?)?(?:V|IV|III|II|Ib|Ia|I)?";
const STAR_KIND =
  `(?:red\\s+dwarf|orange\\s+dwarf|yellow\\s+dwarf|white\\s+dwarf|${SPECTRAL_CLASS}(?:[-\\s](?:type|class))?\\s+(?:star|dwarf|sun|primary|main[-\\s]sequence\\s+star))`;
const VIA_ON = "(?:here\\s+|there\\s+|on\\s+\\S+(?:\\s+\\S+)?\\s+)?";

const rx = (src: string, flags = "gi"): RegExp => new RegExp(src, flags);

/** A quantity group read in `fromToken` units, converted to `target`. */
function readNumber(m: RegExpExecArray, target: string, fallbackToken?: string): Reading | null {
  const g = m.groups ?? {};
  const raw = g.num ?? "";
  let negative = false;
  let numText = raw;
  const neg = numText.match(/^(?:minus\s+|-|−)/i);
  if (neg) {
    negative = true;
    numText = numText.slice(neg[0].length);
  }
  const q = parseQuantity(numText);
  if (!q) return null;
  let value = negative ? -q.value : q.value;
  let halfStep = q.halfStep;
  if (g.half) {
    value += 0.5;
    halfStep = Math.min(halfStep, 0.25);
  }
  const token = (g.unit ?? fallbackToken ?? "").trim();
  const from = token ? unitFromToken(token, target) : target;
  if (!from) return null;
  const v = convert(value, from, target);
  const span = convertSpan(halfStep, from, target);
  if (v === null || span === null) return null;
  return { kind: "number", value: v, halfStep: span, unit: target };
}

function normaliseClass(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, " ");
  const lower = s.toLowerCase();
  if (lower.startsWith("red dwarf")) return "M";
  if (lower.startsWith("orange dwarf")) return "K";
  if (lower.startsWith("yellow dwarf")) return "G";
  if (lower.startsWith("white dwarf")) return "D";
  const m = s.match(/^([OBAFGKM])(\d(?:\.\d)?)?(V|IV|III|II|Ib|Ia|I)?/i);
  if (!m) return null;
  return `${m[1].toUpperCase()}${m[2] ?? ""}${m[3] ? m[3].toUpperCase().replace("IA", "Ia").replace("IB", "Ib") : ""}`;
}

/** "M4V" / "red dwarf" / "K-type (orange)" → { letter, sub } or null. */
export function spectralParts(text: string): { letter: string; sub: string | null } | null {
  const t = text.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  const word = lower.match(/\b(red|orange|yellow|white)[\s-]+dwarf\b/);
  const cls = t.match(/(?:^|[^A-Za-z])([OBAFGKMD])(\d(?:\.\d)?)?(?:V|IV|III|II|I)?(?:[-\s]?(?:type|class|star|dwarf)|$|[^A-Za-z])/);
  if (cls) return { letter: cls[1].toUpperCase(), sub: cls[2] ?? null };
  if (word) {
    const map: Record<string, string> = { red: "M", orange: "K", yellow: "G", white: "D" };
    return { letter: map[word[1]], sub: null };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Context guards
// ---------------------------------------------------------------------------

const GRAVITY_CONTEXT = /\b(gravit\w*|surface|weigh\w*|heav(?:y|ier|iest)|lighter|planet\w*|world|moon|pull|gee|gees)\b/i;
const ACCELERATION = /\b(burns?|burned|burning|thrust\w*|accelerat\w*|decelerat\w*|manoeuvr\w*|maneuver\w*|engines?|drive|centrifug\w*|spin|spinning|ring|wheel|turned|banked|dive|dove|pulled\s+out|g-suit|couch)\b/i;
const DAY_CONTEXT = /\b(planet\w*|world|moon|here|there|rotat\w*|spin\w*|local|sun|suns|dawn|dusk|night\w*|nights|sunrise|sunset|turns?)\b/i;
const WORK_DAY = /\b(shift|shifts|work|working|workday|labou?r\w*|grueling|gruelling|exhausting|long\s+day|after\s+an?\s+\S+[-\s]hour)\b/i;
const TILT_CONTEXT = /\b(axis|axial|planet\w*|world|moon|globe|poles?|seasons?|seasonal)\b/i;
const PRESSURE_CONTEXT = /\b(pressure|air|atmospher\w*|thin|thick|dense|surface|sea[-\s]level|lungs?|breath\w*|breathable)\b/i;
const VESSEL_PRESSURE = /\b(hull|tanks?|suits?|cabin|tyres?|tires?|bottles?|cylinders?|chambers?|airlock|habitat|hab|dome|module)\b/i;
const ORBIT_CONTEXT = /\b(orbit\w*|semi-?major|from\s+(?:the\s+|its\s+)?(?:star|sun|primary))\b/i;
const PLANET_CONTEXT = /\b(planet\w*|world|moon|globe)\b/i;
const SPEED_CONTEXT = /\b(cruis\w*|travel\w*|fly|flew|flies|flying|speed|velocity|coast\w*|run|runs|ran|sail\w*|drive|moving|moved|moves|reach\w*|top|burn\w*|crossed|crossing)\b/i;

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

const GRAVITY_UNIT = "gees?|gs|g's|gravities|standard\\s+gravit(?:y|ies)|earth\\s+gravit(?:y|ies)";

export const CAPTURE_RULES: readonly CaptureRule[] = [
  {
    id: "gravity",
    predicate: "planet.surface_gravity",
    kind: "measure",
    unit: "g",
    subjectTypes: ["planet", "moon"],
    hint: /grav|\bgees?\b|\bgs\b|\d\s*g\b|\bg\b/i,
    patterns: [
      { re: rx(`\\b${H}(?<num>${N})\\s*(?<unit>${GRAVITY_UNIT})(?!\\w)`), requires: GRAVITY_CONTEXT, forbids: ACCELERATION },
      { re: rx(`\\b${H}(?<num>${N})\\s*(?<unit>g)(?![\\w'’-])`), requires: /\bgravit\w*\b/i, forbids: ACCELERATION },
      {
        re: rx(`\\bgravity\\s+(?:of|at|is|was|measured|reads?|sits\\s+at|sat\\s+at|ran|runs)\\s+${H}(?<num>${N})(?:\\s*(?<unit>${GRAVITY_UNIT}|g|m\\/s(?:²|2|\\^2)))?(?![\\w²])`),
        forbids: ACCELERATION,
      },
      { re: rx(`\\b${H}(?<num>${N})\\s+times\\s+(?:earth(?:['’]s)?|standard|terran|earth[-\\s]normal)\\s+gravity\\b`), forbids: ACCELERATION },
    ],
    read: (m) => readNumber(m, "g", "g"),
  },
  {
    id: "day-length",
    predicate: "planet.rotation_period",
    kind: "measure",
    unit: "hours",
    subjectTypes: ["planet", "moon"],
    hint: /hour/i,
    patterns: [
      { re: rx(`\\b${H}(?<num>${N})[-\\s](?<unit>hours?)[-\\s](?:long\\s+)?(?:local\\s+)?days?\\b`), requires: DAY_CONTEXT, forbids: WORK_DAY },
      {
        re: rx(`\\b(?:the|a|its|their|each|every|one)\\s+(?:local\\s+)?days?\\s+${VIA_ON}(?:is|was|are|were|lasts?|lasted|runs?|ran|of|lasting|spans?|spanned|took|takes)\\s+${H}(?<num>${N})\\s+(?:standard\\s+)?(?<unit>hours?)\\b`),
        forbids: WORK_DAY,
      },
      { re: rx(`\\bday[-\\s]length\\s+(?:of|is|was)\\s+${H}(?<num>${N})\\s+(?<unit>hours?)\\b`) },
      { re: rx(`\\brotat(?:es|ed|ing)\\s+(?:once\\s+)?every\\s+${H}(?<num>${N})\\s+(?<unit>hours?)\\b`) },
    ],
    read: (m) => readNumber(m, "hours", "hours"),
  },
  {
    id: "year-length",
    predicate: "planet.year_length",
    kind: "measure",
    unit: "local_days",
    subjectTypes: ["planet", "moon"],
    hint: /year|orbit|circle/i,
    patterns: [
      {
        re: rx(`\\b(?:the|a|its|their|each|every|one)\\s+(?:local\\s+)?years?\\s+${VIA_ON}(?:is|was|lasts?|lasted|runs?|ran|of|lasting|spans?|spanned|took|takes|equals|equall?ed)\\s+${H}(?<num>${N})\\s+(?<unit>(?:standard|earth|terran|local)\\s+(?:days?|years?)|days?|sols?)\\b`),
      },
      { re: rx(`\\b${H}(?<num>${N})[-\\s](?<unit>(?:standard[-\\s]|earth[-\\s]|local[-\\s])?day)[-\\s](?:long\\s+)?years?\\b`) },
      {
        re: rx(`\\b(?:orbits?|orbited|circles?|circled)\\s+(?:(?:its|the)\\s+(?:star|sun|primary)\\s+)?(?:once\\s+)?every\\s+${H}(?<num>${N})\\s+(?<unit>(?:standard|earth|terran|local)\\s+(?:days?|years?)|days?|years?)\\b`),
      },
    ],
    read: (m) => {
      const unit = (m.groups?.unit ?? "").toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
      const isOrbitVerb = /^(orbit|circle)/i.test(m[0]);
      if (/local\s+years?/.test(unit)) return null;
      if (/(standard|earth|terran)\s+days?/.test(unit) || (isOrbitVerb && /^days?$/.test(unit))) {
        const r = readNumber(m, "days", "days");
        return r && r.kind === "number" ? { ...r, predicate: "orbit.period" } : null;
      }
      if (/years?$/.test(unit)) {
        const q = readNumber({ ...m, groups: { ...m.groups, unit: "yr" } } as RegExpExecArray, "days", "yr");
        return q && q.kind === "number" ? { ...q, predicate: "orbit.period" } : null;
      }
      // "days", "local days", "sols": the in-world day the prose counts in.
      const q = parseQuantity(m.groups?.num ?? "");
      return q ? { kind: "number", value: q.value, halfStep: q.halfStep, unit: "local_days" } : null;
    },
  },
  {
    id: "spectral",
    predicate: "star.spectral_class",
    kind: "enum",
    subjectTypes: ["star"],
    hint: /dwarf|star|sun|primary/i,
    patterns: [
      {
        re: rx(`\\b(?:orbits?|orbited|orbiting|circles?|circled|circling)\\s+(?:a|an|the|its)\\s+(?:${ADJ}[,\\s]+)*(?<cls>${STAR_KIND})\\b`),
      },
      {
        re: rx(`\\b(?:is|was)\\s+(?:a|an)\\s+(?:${ADJ}[,\\s]+)*(?<cls>${STAR_KIND})\\b`),
        namedOnly: true,
      },
    ],
    read: (m) => {
      const v = normaliseClass(m.groups?.cls ?? "");
      return v ? { kind: "enum", value: v } : null;
    },
  },
  {
    id: "crew",
    predicate: "vessel.crew_size",
    kind: "count",
    subjectTypes: ["vessel"],
    hint: /crew|complement/i,
    patterns: [
      {
        re: rx(`\\bcrew\\s+(?:complement\\s+)?(?:of|numbering|numbered|totall?ing|totals?|totall?ed)\\s+${H}(?<num>${N})\\b(?!\\s*(?:percent|%|ships?|vessels?|years?|days?|hours?|minutes?|decks?|shifts?|watches))`),
      },
      { re: rx(`\\bcomplement\\s+of\\s+${H}(?<num>${N})\\b(?!\\s*(?:percent|%|ships?|vessels?|fighters?|shuttles?|drones?|missiles?|guns?))`) },
      { re: rx(`\\b${H}(?<num>${N})[-\\s](?:person|man|member|woman|strong|soul)\\s+crew\\b`) },
      { re: rx(`\\bcrewed\\s+by\\s+${H}(?<num>${N})\\b`) },
      { re: rx(`\\b(?:carries|carried|carrying|holds|held|houses|housed)\\s+${H}(?<num>${N})\\s+(?:crew|crewmembers|crew\\s+members|crewmen|crewfolk)\\b`) },
    ],
    read: (m) => {
      const q = parseQuantity(m.groups?.num ?? "");
      if (!q || q.value < 1 || !Number.isInteger(Math.round(q.value * 1000) / 1000)) return null;
      return { kind: "number", value: Math.round(q.value), halfStep: q.words ? 0.5 : q.halfStep, unit: "individuals" };
    },
  },
  {
    id: "tilt",
    predicate: "planet.obliquity",
    kind: "measure",
    unit: "deg",
    subjectTypes: ["planet", "moon"],
    hint: /tilt|obliquity/i,
    patterns: [
      { re: rx(`\\b(?:axial\\s+tilt|obliquity)\\s+(?:of\\s+|is\\s+|was\\s+|at\\s+|sits\\s+at\\s+)?${H}(?<num>${N})\\s*(?<unit>°|degrees?|deg)(?!\\w)`) },
      { re: rx(`\\btilt\\s+(?:of\\s+|is\\s+|was\\s+|at\\s+)?${H}(?<num>${N})\\s*(?<unit>°|degrees?|deg)(?!\\w)`), requires: TILT_CONTEXT },
      { re: rx(`\\btilted\\s+(?:at\\s+|by\\s+)?${H}(?<num>${N})\\s*(?<unit>°|degrees?)(?!\\w)`), requires: TILT_CONTEXT },
      { re: rx(`\\b${H}(?<num>${N})[-\\s]?(?<unit>°|degrees?|degree)\\s+(?:axial\\s+)?tilt\\b`), requires: TILT_CONTEXT },
    ],
    read: (m) => readNumber(m, "deg", "deg"),
  },
  {
    id: "pressure",
    predicate: "planet.atmo_pressure",
    kind: "measure",
    unit: "bar",
    subjectTypes: ["planet", "moon"],
    hint: /bar|atm|pa\b|psi/i,
    patterns: [
      {
        re: rx(`\\b${H}(?<num>${N})\\s*(?<unit>bars?|millibars?|mbar|atmospheres?|atm|kpa|psi)(?!\\w)`),
        requires: PRESSURE_CONTEXT,
        forbids: VESSEL_PRESSURE,
      },
    ],
    read: (m) => readNumber(m, "bar"),
  },
  {
    id: "temperature",
    predicate: "planet.temp_mean",
    kind: "measure",
    unit: "K",
    subjectTypes: ["planet", "moon"],
    hint: /temperature/i,
    patterns: [
      {
        re: rx(`\\b(?:mean|average)\\s+(?:surface\\s+|global\\s+)?temperature\\s+(?:of\\s+|is\\s+|was\\s+|hovers?\\s+(?:around|near|at)\\s+|hovered\\s+(?:around|near|at)\\s+|sits?\\s+at\\s+|sat\\s+at\\s+|stood\\s+at\\s+|stands\\s+at\\s+)?${H}(?<num>(?:minus\\s+|-|−)?${N})\\s*(?<unit>kelvins?|K|°\\s?[CFK]|degrees?\\s+(?:celsius|centigrade|fahrenheit|kelvin|[CFK]))(?!\\w)`),
      },
    ],
    read: (m) => {
      const g = m.groups ?? {};
      const unit = (g.unit ?? "").toLowerCase().replace(/\s+/g, " ").replace(/^°\s?/, "°").replace(/^kelvins$/, "kelvin");
      const id = /celsius|centigrade|°c|degrees c$/.test(unit)
        ? "C"
        : /fahrenheit|°f|degrees f$/.test(unit)
          ? "F"
          : "K";
      return readNumber({ ...m, groups: { ...g, unit: id === "C" ? "°c" : id === "F" ? "°f" : "k" } } as RegExpExecArray, "K");
    },
  },
  {
    id: "radius",
    predicate: "planet.radius",
    kind: "measure",
    unit: "earth_radii",
    subjectTypes: ["planet", "moon"],
    hint: /radi/i,
    patterns: [
      { re: rx(`\\b${H}(?<num>${N})\\s+(?<unit>earth\\s+radii|earth\\s+radius|terran\\s+radii)\\b`) },
      {
        re: rx(`\\bradius\\s+(?:of\\s+|is\\s+|was\\s+)?${H}(?<num>${N})\\s*(?<unit>km|kilomet(?:er|re)s?|miles?|earth\\s+radii)(?!\\w)`),
        requires: PLANET_CONTEXT,
        forbids: /\b(blast|kill|search|turning|patrol)\b/i,
      },
    ],
    read: (m) => readNumber(m, "earth_radii"),
  },
  {
    id: "mass",
    predicate: "planet.mass",
    kind: "measure",
    unit: "earth_masses",
    subjectTypes: ["planet", "moon"],
    hint: /mass/i,
    patterns: [
      { re: rx(`\\b${H}(?<num>${N})\\s+(?<unit>earth\\s+masses|earth\\s+mass|terran\\s+masses)\\b`) },
      { re: rx(`\\b${H}(?<num>${N})\\s+times\\s+(?:the\\s+mass\\s+of\\s+(?:the\\s+)?earth|earth['’]s\\s+mass)\\b`) },
    ],
    read: (m) => readNumber(m, "earth_masses", "earth masses"),
  },
  {
    id: "star-mass",
    predicate: "star.mass",
    kind: "measure",
    unit: "solar_masses",
    subjectTypes: ["star"],
    hint: /solar\s+mass/i,
    patterns: [{ re: rx(`\\b${H}(?<num>${N})\\s+(?<unit>solar\\s+masses|solar\\s+mass)\\b`) }],
    read: (m) => readNumber(m, "solar_masses"),
  },
  {
    id: "orbit",
    predicate: "orbit.semi_major_axis",
    kind: "measure",
    unit: "au",
    subjectTypes: ["planet", "moon"],
    hint: /AU\b|A\.U\.|astronomical/i,
    patterns: [
      { re: rx(`\\b${H}(?<num>${N})\\s*(?<unit>AU|A\\.U\\.)(?!\\w)`, "g"), requires: ORBIT_CONTEXT },
      { re: rx(`\\b${H}(?<num>${N})\\s+(?<unit>astronomical\\s+units?)\\b`), requires: ORBIT_CONTEXT },
    ],
    read: (m) => readNumber(m, "au"),
  },
  {
    id: "height",
    predicate: null,
    byType: { location: "place.height", character: "character.height", species: "species.height_typical" },
    kind: "measure",
    unit: "m",
    subjectTypes: ["location", "character", "species"],
    hint: /tall|high|rise|rose|tower|soar/i,
    patterns: [
      {
        re: rx(`\\b(?:rises?|rose|rising|risen|towers?|towered|towering|soars?|soared|soaring)\\s+${H}(?<num>${N}|an?)\\s+(?<unit>m|met(?:er|re)s?|km|kilomet(?:er|re)s?|feet|foot|ft|miles?)(?<half>\\s+and\\s+a\\s+half)?(?!\\w)`),
        namedOnly: true,
      },
      {
        re: rx(`\\b${H}(?<num>${N}|an?)\\s+(?<unit>m|met(?:er|re)s?|km|kilomet(?:er|re)s?|feet|foot|ft|miles?)(?<half>\\s+and\\s+a\\s+half)?\\s+(?:tall|high)\\b`),
        namedOnly: true,
      },
      {
        re: rx(`\\b${H}(?<num>${N})[-\\s](?<unit>met(?:er|re)|kilomet(?:er|re)|foot|mile)[-\\s](?:tall|high)\\b`),
        namedOnly: true,
      },
    ],
    read: (m) => readNumber(m, "m"),
  },
  {
    id: "population",
    predicate: "place.population",
    kind: "measure",
    unit: "individuals",
    subjectTypes: ["location", "planet", "moon"],
    hint: /populat|home\s+to|inhabitants|residents|citizens|colonists|settlers/i,
    patterns: [
      {
        re: rx(`\\bpopulation\\s+(?:of\\s+|is\\s+|was\\s+|stood\\s+at\\s+|stands\\s+at\\s+|numbers\\s+|numbered\\s+|reached\\s+|reaches\\s+|nears\\s+|neared\\s+|tops\\s+|topped\\s+|hit\\s+)?${H}(?<num>${N})\\b(?!\\s*(?:percent|%))`),
      },
      {
        re: rx(`\\bpopulation\\s+of\\s+[^,.;:!?]{1,40}?\\s+(?:is|was|stood\\s+at|stands\\s+at|numbers|numbered|reached|tops|topped)\\s+${H}(?<num>${N})\\b(?!\\s*(?:percent|%))`),
      },
      { re: rx(`\\bhome\\s+to\\s+${H}(?<num>${N})\\s+(?:people|souls|inhabitants|citizens|residents|colonists|settlers)\\b`) },
      { re: rx(`\\b${H}(?<num>${N})\\s+(?:inhabitants|residents|citizens|colonists|settlers)\\b`) },
    ],
    read: (m) => {
      const q = parseQuantity(m.groups?.num ?? "");
      // "three citizens stepped forward" is a headcount, not a population.
      if (!q || q.value < 1000) return null;
      return { kind: "number", value: q.value, halfStep: q.halfStep, unit: "individuals" };
    },
  },
  {
    id: "lifespan",
    predicate: "species.lifespan",
    kind: "measure",
    unit: "local_years",
    subjectTypes: ["species"],
    hint: /life|live/i,
    patterns: [
      {
        re: rx(`\\b(?:lifespans?|life\\s+spans?|life\\s+expectancy|natural\\s+span)\\s+(?:of\\s+|is\\s+|was\\s+|runs\\s+|ran\\s+|reaches\\s+|spans\\s+|stretches\\s+(?:to\\s+)?|stretched\\s+(?:to\\s+)?)?${H}(?<num>${N})\\s+(?<unit>(?:local|standard|earth)\\s+years|years)\\b`),
      },
      {
        re: rx(`\\blive(?:s|d)?\\s+to\\s+(?:be\\s+)?${H}(?<num>${N})\\s+(?<unit>(?:local|standard|earth)\\s+years|years)\\b`),
        namedOnly: true,
      },
    ],
    read: (m) => {
      const unit = (m.groups?.unit ?? "").toLowerCase();
      const q = parseQuantity(m.groups?.num ?? "");
      if (!q) return null;
      // Standard years are not local years; keep the writer's unit honestly
      // rather than convert through a year length nobody asked for.
      const u = /standard|earth/.test(unit) ? "yr" : "local_years";
      return { kind: "number", value: q.value, halfStep: q.halfStep, unit: u };
    },
  },
  {
    id: "star-age",
    predicate: "star.age",
    kind: "measure",
    unit: "gyr",
    subjectTypes: ["star"],
    hint: /years?\s+old/i,
    patterns: [{ re: rx(`\\b${H}(?<num>${N})\\s+(?<unit>(?:standard\\s+|earth\\s+)?years?)\\s+old\\b`), namedOnly: true }],
    read: (m) => readNumber({ ...m, groups: { ...m.groups, unit: "yr" } } as RegExpExecArray, "gyr"),
  },
  {
    id: "cruise",
    predicate: "propulsion.cruise_fraction_c",
    kind: "measure",
    unit: "c",
    subjectTypes: ["vessel", "technology"],
    hint: /\bc\b|light[-\s]?speed|speed\s+of\s+light/i,
    patterns: [
      {
        re: rx(`\\b${H}(?<num>${N}|\\d+(?:\\.\\d+)?\\s*(?:%|percent))\\s+(?:of\\s+)?(?<unit>c|lightspeed|light[-\\s]speed|the\\s+speed\\s+of\\s+light)(?!\\w)`),
        requires: SPEED_CONTEXT,
      },
    ],
    read: (m) => {
      const raw = (m.groups?.num ?? "").trim();
      const pct = raw.match(/^(\d+(?:\.\d+)?)\s*(?:%|percent)$/i);
      if (pct) {
        const v = Number(pct[1]) / 100;
        const dot = pct[1].indexOf(".");
        const dec = dot < 0 ? 0 : pct[1].length - dot - 1;
        return { kind: "number", value: v, halfStep: (0.5 * Math.pow(10, -dec)) / 100, unit: "c" };
      }
      const q = parseQuantity(raw);
      if (!q || q.value <= 0 || q.value > 1) return null;
      return { kind: "number", value: q.value, halfStep: q.halfStep, unit: "c" };
    },
  },
];

export function ruleById(id: string): CaptureRule | undefined {
  return CAPTURE_RULES.find((r) => r.id === id);
}
