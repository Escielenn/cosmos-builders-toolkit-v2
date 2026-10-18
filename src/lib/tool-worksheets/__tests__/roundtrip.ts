import { expect } from "vitest";
import type { ToolWorksheetCodec } from "@/lib/tool-worksheet";

/**
 * A saved worksheet's data must survive hydrate → serialize unchanged, so
 * existing sheets open (and re-save) exactly as they were written.
 */
export function expectRoundTrip<S>(codec: ToolWorksheetCodec<S>, saved: unknown): void {
  const json = JSON.parse(JSON.stringify(saved)) as unknown;
  const state = codec.hydrate(json, codec.defaults);
  const out = JSON.parse(JSON.stringify(codec.serialize(state))) as unknown;
  expect(out).toEqual(json);
  // And a second pass is stable.
  const again = JSON.parse(JSON.stringify(codec.serialize(codec.hydrate(out, codec.defaults)))) as unknown;
  expect(again).toEqual(json);
}

/** The defaults themselves must round-trip (a sheet created from the selector). */
export function expectDefaultsRoundTrip<S>(codec: ToolWorksheetCodec<S>): void {
  expectRoundTrip(codec, codec.serialize(codec.defaults));
}

/**
 * A saved sheet with every field touched: strings carry their path, numbers
 * move, booleans flip, and arrays keep their shape with each item filled.
 * Run through expectRoundTrip it proves no field is dropped or renamed.
 */
export function fillLeaves<T>(value: T, path = "f"): T {
  if (typeof value === "string") return `${path}` as unknown as T;
  if (typeof value === "number") return (value + 1.5) as unknown as T;
  if (typeof value === "boolean") return !value as unknown as T;
  if (Array.isArray(value)) return value.map((v, i) => fillLeaves(v, `${path}.${i}`)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = fillLeaves(v, `${path}.${k}`);
    return out as T;
  }
  return value;
}

/** Add a moodboard image where the shape has a moodboard. */
export function withMoodboard<T>(state: T): T {
  if (!state || typeof state !== "object" || !("moodboard" in (state as object))) return state;
  return {
    ...state,
    moodboard: [{ id: "m1", url: "https://example.test/a.png", caption: "reference" }],
  } as T;
}
