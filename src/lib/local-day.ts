// ---------------------------------------------------------------------------
// local-day.ts, the writer's calendar day.
//
// The writing_sessions ledger is keyed by a `date`. It used to be keyed by the
// UTC date (`toISOString().slice(0, 10)`), so in Denver the daily goal reset
// at 6 pm (00:00 UTC is 18:00 MDT). Every writer-facing "today" now comes from
// here: the browser's local calendar date, or the date in an explicit IANA
// time zone when one is given (tests, or a stored profile zone later).
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Calendar date of `d` as YYYY-MM-DD.
 *
 * Without `timeZone` this is the runtime's local zone (the browser's). With
 * one, it is the date on a wall calendar in that zone.
 */
export function localDay(d: Date = new Date(), timeZone?: string): string {
  if (!timeZone) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** True for a well-formed YYYY-MM-DD string. */
export function isDayKey(s: unknown): s is string {
  return typeof s === "string" && ISO_DAY.test(s);
}

/** Whole days from `a` to `b` (both YYYY-MM-DD). Positive when b is later. */
export function dayDiff(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** The day `n` days after `day` (negative n goes back). Calendar math, DST-proof. */
export function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** The `count` days ending on `today`, oldest first. */
export function trailingDays(today: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(shiftDay(today, -i));
  return out;
}
