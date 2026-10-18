// ---------------------------------------------------------------------------
// capture/numbers, how prose writes a quantity.
//
// Writers spell small numbers ("forty crew"), scale big ones ("nine billion
// souls"), and halve things ("a mile and a half"). Canon Capture has to read
// all of those the same way the writer meant them, and it has to know how
// precise the writer was being: "1.5 g" is a claim to the nearest 0.05,
// "nine billion" to the nearest half billion. That precision is what keeps a
// rounded number in prose from reading as a contradiction.
//
// NUM_SRC is a regex source fragment the rule table embeds; parseQuantity
// reads whatever it matched. Pure, no I/O, tested.
// ---------------------------------------------------------------------------

const UNITS_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS_WORDS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  hundred: 1e2, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12,
};
const FRACTIONS: Record<string, number> = {
  half: 0.5, third: 1 / 3, quarter: 0.25, fifth: 0.2, tenth: 0.1,
};

const SMALL = Object.keys(UNITS_WORDS).sort((a, b) => b.length - a.length).join("|");
const TENS = Object.keys(TENS_WORDS).join("|");
const DIGIT_UNITS = "one|two|three|four|five|six|seven|eight|nine";
const SCALE = "hundred|thousand|million|billion|trillion";

/** One word-number: "forty", "forty-two", "forty two", "seven", "dozen". */
const WORD = `(?:(?:${TENS})(?:[- ](?:${DIGIT_UNITS}))?|${SMALL}|(?:a\\s+)?dozen)`;
/** Digits: 1,200 · 1200 · 1.47 · .5 · 3.8e26 */
const DIGITS = `(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|\\.\\d+)`;

/**
 * A quantity as prose writes it. Embedded in the capture rules; never use it
 * unanchored (it matches "one" inside "someone" without a \b around it).
 *
 *   1.47 · 1,200 · forty-two · nine billion · two hundred thousand ·
 *   a hundred · one and a half · half a · a dozen · 1.2 million
 */
export const NUM_SRC =
  `(?:` +
  `(?:${DIGITS}|${WORD}|an?)(?:\\s+(?:${SCALE}))+(?:\\s+and\\s+a\\s+half)?` +
  `|${DIGITS}` +
  `|${WORD}(?:\\s+and\\s+a\\s+half)?` +
  `|half\\s+an?` +
  `|an?\\s+(?:half|third|quarter|fifth|tenth)` +
  `|one[- ](?:half|third|quarter|fifth|tenth)` +
  `)`;

export interface Quantity {
  value: number;
  /**
   * Half the last place the writer was precise to, in the same units:
   * "1.5" → 0.05, "26" → 0.5, "nine billion" → 0.5e9. Prose that rounds a
   * value to its own precision agrees with it.
   */
  halfStep: number;
  /** Spelled in words ("forty"), as opposed to digits. */
  words: boolean;
}

function halfStepOfDigits(s: string): number {
  const mant = s.replace(/,/g, "").split(/[eE]/)[0];
  const exp = s.includes("e") || s.includes("E") ? Number(s.split(/[eE]/)[1]) : 0;
  const dot = mant.indexOf(".");
  const decimals = dot < 0 ? 0 : mant.length - dot - 1;
  return 0.5 * Math.pow(10, exp - decimals);
}

/** A run of number words ("forty two", "seven") → value, or null. */
function wordsValue(s: string): number | null {
  const parts = s.toLowerCase().split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1 && (parts[0] === "a" || parts[0] === "an")) return 1;
  if (parts.join(" ") === "a dozen" || parts.join(" ") === "dozen") return 12;
  let total = 0;
  for (const p of parts) {
    if (p in UNITS_WORDS) total += UNITS_WORDS[p];
    else if (p in TENS_WORDS) total += TENS_WORDS[p];
    else return null;
  }
  return total;
}

/**
 * Read a matched quantity. Returns null for anything NUM_SRC did not mean
 * (so a rule can never act on a half-parsed number).
 */
export function parseQuantity(raw: string): Quantity | null {
  let s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  // Fractions on their own: "half a", "a third", "one-half".
  const frac = s.match(/^(?:half an?|(?:an?|one)[- ](half|third|quarter|fifth|tenth))$/);
  if (frac) {
    const f = frac[1] ? FRACTIONS[frac[1]] : 0.5;
    return { value: f, halfStep: f / 2, words: true };
  }

  let plusHalf = false;
  if (s.endsWith(" and a half")) {
    plusHalf = true;
    s = s.slice(0, -" and a half".length).trim();
  }

  // Trailing scale words multiply: "two hundred thousand", "1.2 million".
  let scale = 1;
  const tokens = s.split(" ");
  while (tokens.length > 1 && tokens[tokens.length - 1] in SCALES) {
    scale *= SCALES[tokens.pop()!];
  }
  const head = tokens.join(" ");

  let base: number | null;
  let halfStep: number;
  let words: boolean;
  if (/^[\d.,]/.test(head)) {
    const n = Number(head.replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    base = n;
    halfStep = halfStepOfDigits(head);
    words = false;
  } else {
    base = wordsValue(head);
    if (base === null) return null;
    halfStep = 0.5;
    words = true;
  }

  let value = base * scale;
  halfStep = halfStep * scale;
  if (plusHalf) {
    value += 0.5 * scale;
    halfStep = Math.min(halfStep, 0.25 * scale);
  }
  if (!Number.isFinite(value)) return null;
  return { value, halfStep, words };
}

/** Hedges that make a quoted figure approximate ("about 400 crew"). */
export const HEDGE_SRC =
  "(?:about|around|roughly|nearly|almost|some|approximately|close\\s+to|just\\s+(?:over|under)|over|under|more\\s+than|less\\s+than|fewer\\s+than|barely|only|just|exactly|precisely|a\\s+little\\s+(?:over|under))";

const APPROX = /\b(about|around|roughly|nearly|almost|some|approximately|close to|just over|just under|over|under|more than|less than|fewer than|barely|a little over|a little under)\b/i;

/** True when the words just before a quantity hedge it. */
export function isHedged(lead: string): boolean {
  return APPROX.test(lead);
}
