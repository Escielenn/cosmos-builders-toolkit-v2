// ---------------------------------------------------------------------------
// Third-party brand marks.
//
// These colours belong to other companies and are fixed by their brand
// guidelines: a Google "G" is always these four colours, on any theme. They
// are not StellarForge colours, never follow the theme, and must never be
// used for anything except drawing or referring to that company's mark.
// ---------------------------------------------------------------------------

/** The four segments of the Google "G". */
export const GOOGLE_MARK = {
  blue: "#4285F4",
  green: "#34A853",
  yellow: "#FBBC05",
  red: "#EA4335",
} as const;

/** Notion's mark: black ink on a white tile. */
export const NOTION_MARK = {
  ink: "#000000",
  tile: "#FFFFFF",
} as const;

/** Share targets, used as the small identifying edge on each share button. */
export const SOCIAL_MARK = {
  twitter: "#1DA1F2",
  reddit: "#FF5700",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
} as const;
