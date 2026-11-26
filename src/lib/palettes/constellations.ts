// ---------------------------------------------------------------------------
// Constellation line colours (ExoSky).
//
// A DATA palette: the writer draws constellations on an alien sky and picks a
// line colour for each; it is saved with the sky. Not a theme colour. The
// pick list itself still lives in ExoSkySimulator.tsx (the simulator owns its
// draw loop); this module holds the default a saved constellation falls back
// to when it carries no colour.
// ---------------------------------------------------------------------------

export const DEFAULT_CONSTELLATION_COLOUR = "#FFA500";
