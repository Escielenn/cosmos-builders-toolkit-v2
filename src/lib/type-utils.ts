/**
 * Small type-level helpers shared by the worksheet tool pages.
 */

/**
 * Keys of T whose values are objects: the worksheet "sections" that the
 * `updateSection(section, field, value)` helpers spread into. Excludes the
 * string-valued keys (generalNotes and the like), which cannot be spread.
 */
export type ObjectKeys<T> = {
  [K in keyof T]-?: T[K] extends object ? K : never;
}[keyof T];
