// ---------------------------------------------------------------------------
// surface-cartographer facts: what a saved map tells the writing surface.
//
// The worksheetPaths mechanism reads scalars at fixed paths; a gazetteer is a
// list. So, like Timeline, this tool gets a bespoke reader (registered in
// worksheet-facts.ts). Each placed location becomes one fact: the name as the
// label, the coordinates as the value, the name as what goes in the prose —
// the name is the thing a sentence uses.
//
// The places themselves are entities and already @-mentionable; these facts
// are what the Refs and Check tabs list, so "where is Vel Haran" is answerable
// mid-sentence without leaving the page.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { WorksheetFact } from "@/lib/worksheet-facts";
import { formatLatLon } from "./geo";
import { PLACE_TYPE_LABELS, readState } from "./places";

/** A long gazetteer is no more usable in a rail than the map itself. */
const MAX_PLACES = 40;

export function extractSurfaceMapFacts(raw: unknown): WorksheetFact[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const state = readState(raw);
  const facts: WorksheetFact[] = [];
  const source = state.bodyName ? `Your map of ${state.bodyName}` : "Your surface map";

  if (state.bodyName) {
    facts.push({ key: "surfaceMap.body", label: "Mapped body", value: state.bodyName, source });
  }
  if (state.gazetteer.length > 0) {
    facts.push({
      key: "surfaceMap.placeCount",
      label: "Places on the map",
      value: String(state.gazetteer.length),
      source,
    });
  }
  for (const g of state.gazetteer.slice(0, MAX_PLACES)) {
    facts.push({
      key: `surfaceMap.place.${g.id}`,
      label: g.name,
      value: `${formatLatLon({ lat: g.lat, lon: g.lon })} · ${PLACE_TYPE_LABELS[g.placeType].toLowerCase()}`,
      insert: g.name,
      source,
    });
  }
  return facts;
}
