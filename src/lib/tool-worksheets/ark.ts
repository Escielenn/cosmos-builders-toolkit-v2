/** Ark (Generation Ship Designer) worksheet codec. The shape lives in lib/generation-ship. */
import type { Json } from "@/integrations/supabase/types";
import type { ToolWorksheetCodec } from "@/lib/tool-worksheet";
import {
  INITIAL_GENSHIP_STATE,
  buildDerivedSnapshot,
  computeGenShip,
  normalizeGenShipState,
  type GenShipFormState,
} from "@/lib/generation-ship/calculations";

export type FormState = GenShipFormState;

export const TOOL_TYPE = "generation-ship";
export const LOCAL_STORAGE_KEY = "generation-ship";

/**
 * Rows carry the inputs plus a `derived` snapshot of the results, recomputed
 * on every save so the Studio can read them without running the engine.
 * Any saved row opens through normalizeGenShipState.
 */
export const codec: ToolWorksheetCodec<FormState> = {
  defaults: INITIAL_GENSHIP_STATE,
  hydrate: (data) => normalizeGenShipState(data),
  serialize: (f) => ({ ...f, derived: buildDerivedSnapshot(computeGenShip(f)) }) as unknown as Json,
};

/** Everything that counts as an unsaved edit: the inputs, not the bookkeeping. */
export function dirtyKey(f: FormState): string {
  return JSON.stringify({ ...f, loggedEvents: {}, derived: undefined });
}

/** A sheet created on first save is named for its ship. */
export function titleFor(f: FormState): string {
  return f.identity.shipName.trim() || "Generation Ship";
}
