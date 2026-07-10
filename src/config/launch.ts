/**
 * THE launch-date constant (Cowork Implementation Guide §2).
 * Every countdown, chip, and copy string derives from this —
 * never hardcode the launch date anywhere else.
 */
export const LAUNCH_DATE = new Date("2026-08-11T09:00:00-07:00");

/** "2026.08.11" — mission-log format used across campaign surfaces. */
export const LAUNCH_DATE_STAMP = "2026.08.11";

/** "August 11, 2026" — prose format. */
export const LAUNCH_DATE_PROSE = "August 11, 2026";

/** "09:00 PT" — derived time label for the manifest. */
export const LAUNCH_TIME_LABEL = "09:00 PT";

/** Whole days until launch (0 once launched). */
export function daysUntilLaunch(now: Date = new Date()): number {
  const ms = LAUNCH_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
