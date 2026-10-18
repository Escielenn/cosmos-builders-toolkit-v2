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
