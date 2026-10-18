/** Epoch (Timeline) worksheet codec. The shape lives in lib/timeline/types. */
import type { Json } from "@/integrations/supabase/types";
import type { ToolWorksheetCodec } from "@/lib/tool-worksheet";
import type { TimelineState } from "@/lib/timeline/types";
import { initialTimelineState } from "@/lib/timeline/constants";
import { migrateTimelineState } from "@/lib/timeline/migration";

export type FormState = TimelineState;

export const TOOL_TYPE = "timeline";
export const LOCAL_STORAGE_KEY = "tl-worksheet";

/** Rows store the timeline as-is; older phases open through migrateTimelineState. */
export const codec: ToolWorksheetCodec<FormState> = {
  defaults: initialTimelineState,
  hydrate: (data) => migrateTimelineState(data),
  serialize: (state) => state as unknown as Json,
};

/**
 * Panning, zooming and expanding events change what is on screen, not what
 * is on file, so they do not count as unsaved changes.
 */
export function dirtyKey(state: FormState): string {
  const { viewState: _view, expandedEventIds: _expanded, ...rest } = state;
  return JSON.stringify(rest);
}
