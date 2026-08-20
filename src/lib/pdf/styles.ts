import { StyleSheet, Font } from "@react-pdf/renderer";
import { getThemeById, type ExportThemeColors } from "@/lib/export/themes";
import { printPalette } from "./palette";

// Disable word hyphenation to prevent rendering issues
Font.registerHyphenationCallback((word) => [word]);

// Deliberately NOT using Font.register() for a custom typeface. react-pdf's
// browser bundle only reliably embeds TTF; the Google Fonts WOFF2 files
// previously registered here crashed fontkit's glyph encoder on every export
// ("RangeError: Offset is outside the bounds of the DataView" — a known
// react-pdf/fontkit incompatibility, not fixable via CSP). Helvetica is one
// of the 14 PDF base fonts: no embedding, no network fetch, always renders.

// Color palette for print — GENERATED from canonical tokens (SF-II §3.5).
// Brand hues derive from src/styles/tokens.ts via src/lib/pdf/palette.ts;
// do not hand-edit hex values here.
export const colors: ExportThemeColors = {
  primary: printPalette.primary, // teal darkened for print legibility
  primaryLight: printPalette.primaryLight, // very light teal tint
  text: {
    primary: printPalette.text.primary,
    secondary: printPalette.text.secondary,
    muted: printPalette.text.muted,
  },
  border: printPalette.border,
  borderLight: printPalette.borderLight,
  background: printPalette.background,
  accent: printPalette.accent, // brand teal for highlights
};

// Typography scale
export const typography = {
  fontFamily: "Helvetica",
  sizes: {
    xs: 8,
    sm: 9,
    base: 10,
    md: 11,
    lg: 14,
    xl: 18,
    "2xl": 24,
    "3xl": 32,
  },
};

// Spacing scale (in points)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

// Common styles
export const styles = StyleSheet.create({
  // Page styles
  page: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    backgroundColor: colors.background,
    padding: spacing["2xl"],
    paddingBottom: spacing["3xl"],
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 700,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  headerMeta: {
    textAlign: "right",
  },

  headerMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing["2xl"],
    right: spacing["2xl"],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },

  pageNumber: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },

  // Section styles
  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  sectionContent: {
    paddingLeft: spacing.sm,
  },

  // Result box (for highlighting key results)
  resultBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: "center",
  },

  resultValue: {
    fontSize: typography.sizes["3xl"],
    fontWeight: 700,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  resultLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  resultDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  // Key-value pair
  keyValueRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  keyValueLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },

  keyValueValue: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: 600,
    color: colors.text.primary,
    textAlign: "right",
  },

  // Table styles
  table: {
    marginBottom: spacing.lg,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  tableHeaderCell: {
    fontSize: typography.sizes.sm,
    fontWeight: 600,
    color: colors.primary,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  tableCell: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },

  // Notes box
  notesBox: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 4,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  notesLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: 600,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },

  notesText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 1.5,
  },

  // Utility styles
  row: {
    flexDirection: "row",
  },

  col: {
    flexDirection: "column",
  },

  flex1: {
    flex: 1,
  },

  textCenter: {
    textAlign: "center",
  },

  textRight: {
    textAlign: "right",
  },

  mb: {
    marginBottom: spacing.md,
  },

  mt: {
    marginTop: spacing.md,
  },

  bold: {
    fontWeight: 600,
  },

  muted: {
    color: colors.text.muted,
  },

  small: {
    fontSize: typography.sizes.sm,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginVertical: spacing.md,
  },
});

export default styles;

/**
 * Create a themed StyleSheet from an ExportThemeColors palette.
 * Returns the same shape as the default `styles` + an overridden `colors` object.
 */
export function createThemedStyles(themeColors: ExportThemeColors) {
  const themed = StyleSheet.create({
    page: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.base,
      color: themeColors.text.primary,
      backgroundColor: themeColors.background,
      padding: spacing["2xl"],
      paddingBottom: spacing["3xl"],
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerLogo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    headerTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: 700,
      color: themeColors.primary,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    headerSubtitle: {
      fontSize: typography.sizes.sm,
      color: themeColors.text.secondary,
      marginTop: 2,
    },
    headerMeta: { textAlign: "right" },
    headerMetaText: {
      fontSize: typography.sizes.xs,
      color: themeColors.text.muted,
    },
    footer: {
      position: "absolute",
      bottom: spacing.lg,
      left: spacing["2xl"],
      right: spacing["2xl"],
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: themeColors.borderLight,
    },
    footerText: {
      fontSize: typography.sizes.xs,
      color: themeColors.text.muted,
    },
    pageNumber: {
      fontSize: typography.sizes.xs,
      color: themeColors.text.muted,
    },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      fontSize: typography.sizes.md,
      fontWeight: 600,
      color: themeColors.primary,
      marginBottom: spacing.md,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sectionContent: { paddingLeft: spacing.sm },
    resultBox: {
      backgroundColor: themeColors.primaryLight,
      borderWidth: 2,
      borderColor: themeColors.primary,
      borderRadius: 8,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      alignItems: "center",
    },
    resultValue: {
      fontSize: typography.sizes["3xl"],
      fontWeight: 700,
      color: themeColors.primary,
      marginBottom: spacing.xs,
    },
    resultLabel: {
      fontSize: typography.sizes.md,
      color: themeColors.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultDescription: {
      fontSize: typography.sizes.sm,
      color: themeColors.text.secondary,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    keyValueRow: {
      flexDirection: "row",
      marginBottom: spacing.xs,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    keyValueLabel: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: themeColors.text.secondary,
    },
    keyValueValue: {
      flex: 1,
      fontSize: typography.sizes.sm,
      fontWeight: 600,
      color: themeColors.text.primary,
      textAlign: "right",
    },
    table: { marginBottom: spacing.lg },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: themeColors.primaryLight,
      borderBottomWidth: 2,
      borderBottomColor: themeColors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    tableHeaderCell: {
      fontSize: typography.sizes.sm,
      fontWeight: 600,
      color: themeColors.primary,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    tableCell: {
      fontSize: typography.sizes.sm,
      color: themeColors.text.primary,
    },
    notesBox: {
      backgroundColor: themeColors.background === "#ffffff" ? "#f9f9f9" : themeColors.primaryLight,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      borderRadius: 4,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    notesLabel: {
      fontSize: typography.sizes.xs,
      fontWeight: 600,
      color: themeColors.text.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    notesText: {
      fontSize: typography.sizes.sm,
      color: themeColors.text.secondary,
      lineHeight: 1.5,
    },
    row: { flexDirection: "row" },
    col: { flexDirection: "column" },
    flex1: { flex: 1 },
    textCenter: { textAlign: "center" },
    textRight: { textAlign: "right" },
    mb: { marginBottom: spacing.md },
    mt: { marginTop: spacing.md },
    bold: { fontWeight: 600 },
    muted: { color: themeColors.text.muted },
    small: { fontSize: typography.sizes.sm },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
      marginVertical: spacing.md,
    },
  });

  return { styles: themed, colors: themeColors };
}

// --- Theme activation (module-level mutation) ---
// Save defaults so we can restore after themed renders.
// Shallow copy of styles (each value is an immutable style object from StyleSheet.create).
const _defaultStyles: Record<string, unknown> = {};
for (const key of Object.keys(styles)) {
  _defaultStyles[key] = (styles as Record<string, unknown>)[key];
}
// Deep copy of colors (nested text sub-object).
const _defaultColors = {
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  text: { ...colors.text },
  border: colors.border,
  borderLight: colors.borderLight,
  background: colors.background,
  accent: colors.accent,
};

/**
 * Activate a theme by mutating the exported `styles` and `colors` objects in place.
 * Call this immediately before `pdf(template).toBlob()`, then call `resetActiveTheme()`
 * in a finally block. Safe because JS is single-threaded and pdf() evaluates synchronously.
 */
export function setActiveTheme(themeId: string) {
  if (!themeId || themeId === "classic") return;

  const theme = getThemeById(themeId);
  if (theme.id === "classic") return;

  const themed = createThemedStyles(theme.colors);

  // Overwrite styles entries in place
  for (const key of Object.keys(themed.styles)) {
    (styles as Record<string, unknown>)[key] = (themed.styles as Record<string, unknown>)[key];
  }

  // Overwrite colors properties in place (keep the same object references)
  colors.primary = themed.colors.primary;
  colors.primaryLight = themed.colors.primaryLight;
  colors.border = themed.colors.border;
  colors.borderLight = themed.colors.borderLight;
  colors.background = themed.colors.background;
  colors.accent = themed.colors.accent;
  colors.text.primary = themed.colors.text.primary;
  colors.text.secondary = themed.colors.text.secondary;
  colors.text.muted = themed.colors.text.muted;
}

/**
 * Restore the default "Classic" theme. Always call in a finally block after setActiveTheme.
 */
export function resetActiveTheme() {
  for (const key of Object.keys(_defaultStyles)) {
    (styles as Record<string, unknown>)[key] = _defaultStyles[key];
  }
  colors.primary = _defaultColors.primary;
  colors.primaryLight = _defaultColors.primaryLight;
  colors.border = _defaultColors.border;
  colors.borderLight = _defaultColors.borderLight;
  colors.background = _defaultColors.background;
  colors.accent = _defaultColors.accent;
  colors.text.primary = _defaultColors.text.primary;
  colors.text.secondary = _defaultColors.text.secondary;
  colors.text.muted = _defaultColors.text.muted;
}
