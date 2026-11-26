// ---------------------------------------------------------------------------
// Tag colours. A DATA palette: a tag's colour is stored with the tag and
// identifies it wherever it appears. Not a theme colour.
// ---------------------------------------------------------------------------

import { DEFAULT_SWATCH, SWATCH } from "./swatches";

export const TAG_COLOURS: readonly string[] = [
  SWATCH.stellar,
  SWATCH.violet,
  SWATCH.purple,
  SWATCH.fuchsia,
  SWATCH.pink,
  SWATCH.rose,
  SWATCH.red,
  SWATCH.orange,
  SWATCH.amber,
  SWATCH.yellow,
  SWATCH.lime,
  SWATCH.green,
  SWATCH.emerald,
  SWATCH.teal,
  SWATCH.aqua,
  SWATCH.sky,
  SWATCH.blue,
];

export const DEFAULT_TAG_COLOUR: string = DEFAULT_SWATCH;

/** Stable colour for a tag that has no stored colour yet, from its name. */
export function tagColourForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return TAG_COLOURS[hash % TAG_COLOURS.length];
}
