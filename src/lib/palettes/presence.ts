// ---------------------------------------------------------------------------
// Collaborator presence colours (timeline cursors and avatars). A DATA
// palette: each collaborator gets one, picked from their user id, so two
// people are told apart. Not a theme colour.
// ---------------------------------------------------------------------------

import { SWATCH } from "./swatches";

export const PRESENCE_COLOURS: readonly string[] = [
  SWATCH.blue,
  SWATCH.violet,
  SWATCH.pink,
  SWATCH.amber,
  SWATCH.green,
  SWATCH.red,
  SWATCH.aqua,
  SWATCH.orange,
];
