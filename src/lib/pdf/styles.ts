import { StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts (using system fonts as fallback)
// Note: For production, you may want to host these fonts
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 700,
    },
  ],
});

// Color palette for print (darker cyan for better printing)
export const colors = {
  primary: "#007a7a", // Darker cyan for print
  primaryLight: "#f0f8f8", // Very light cyan tint
  text: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    muted: "#6a6a6a",
  },
  border: "#cccccc",
  borderLight: "#e5e5e5",
  background: "#ffffff",
  accent: "#00E5E5", // Brand cyan for highlights
};

// Typography scale
export const typography = {
  fontFamily: "Inter",
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
