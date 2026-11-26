// ---------------------------------------------------------------------------
// Writing papers. A DATA palette: each paper is a fixed physical sheet with
// its own ink, chosen by the writer per device. These are not theme colours
// (the "Void" paper follows the theme through tokens). Contrast for every
// paper against every theme is measured in src/lib/writing/themes.test.ts.
// ---------------------------------------------------------------------------

import type { PaperColors, PaperId, WritingTheme } from "@/lib/writing/themes";

export const PAPER_COLOURS: Record<Exclude<PaperId, "void">, PaperColors> = {
  charcoal: {
      paper: "#1F2023",
      ink: "#D2CFC8",
      inkStrong: "#F2EFE8",
      inkSoft: "#A8A49C",
      inkFaint: "#8F8C85",
      rule: "#3A3B40",
      selection: "#3D5A4C",
      wash: "#342D1B",
    },
  black: {
      paper: "#000000",
      ink: "#C4C4C4",
      inkStrong: "#EDEDED",
      inkSoft: "#9A9A9A",
      inkFaint: "#858585",
      rule: "#2B2B2B",
      selection: "#2F4A3D",
      wash: "#2E2812",
    },
  parchment: {
      paper: "#F8F0DF",
      ink: "#43382E",
      inkStrong: "#2E251D",
      inkSoft: "#6B5B4B",
      inkFaint: "#76664F",
      rule: "#DCCFB4",
      selection: "#D9E3CB",
      wash: "#F3DFA6",
    },
  cream: {
      paper: "#FBF8F1",
      ink: "#33302B",
      inkStrong: "#1F1D1A",
      inkSoft: "#625D54",
      inkFaint: "#6F6A60",
      rule: "#E2DCCD",
      selection: "#D5E4DA",
      wash: "#F5E6B4",
    },
  grey: {
      paper: "#E3E3DF",
      ink: "#2A2C2F",
      inkStrong: "#17181A",
      inkSoft: "#53565B",
      inkFaint: "#5C5F64",
      rule: "#C6C6C1",
      selection: "#C0D3C7",
      wash: "#E4D59B",
    },
  terminal: {
      paper: "#0D1208",
      ink: "#33FF33",
      inkStrong: "#7DFF7D",
      inkSoft: "#22CC22",
      inkFaint: "#1FA81F",
      rule: "#1E3A16",
      selection: "#1F4A1A",
      wash: "#141E0C",
    },
  signal: {
      paper: "#0A1628",
      ink: "#6FB1FF",
      inkStrong: "#A9D0FF",
      inkSoft: "#5B9BEF",
      inkFaint: "#5490DD",
      rule: "#1D3353",
      selection: "#1F3F6B",
      wash: "#0F1F38",
    },
};

/** Default Void·Teal paper, for when live tokens cannot be read (tests, SSR). */
export const VOID_PAPER_FALLBACK: PaperColors = {
  paper: "#0A0E17",
  ink: "#C9CDD3",
  inkStrong: "#FAFAFA",
  inkSoft: "#A7AAB0",
  inkFaint: "#9799A0",
  rule: "#41454C",
  selection: "#273249",
  wash: "#1B2334",
};

/** The pre-1.7 writing themes, still offered by the legacy editors. */
export const LEGACY_WRITING_THEMES: WritingTheme[] = [
  {
    id: "captains-log",
    name: "Captain's Log",
    description: "Warm cream paper, classic writing surface",
    colors: {
      background: "#F5F3EF",
      text: "#1A1A2E",
      caret: "#5B8DEF",
      selection: "rgba(91, 141, 239, 0.2)",
      headingText: "#1A1A2E",
      blockquoteBorder: "rgba(91, 141, 239, 0.3)",
      blockquoteText: "#3A3A5C",
      codeBackground: "rgba(91, 141, 239, 0.08)",
    },
    swatch: ["#F5F3EF", "#1A1A2E", "#5B8DEF"],
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Dark void with cool off-white text",
    colors: {
      background: "#0A0E17",
      text: "#E0E4E8",
      caret: "#3DFFCD",
      selection: "rgba(61, 255, 205, 0.15)",
      headingText: "#E0E4E8",
      blockquoteBorder: "rgba(61, 255, 205, 0.3)",
      blockquoteText: "#B0B8C4",
      codeBackground: "rgba(61, 255, 205, 0.08)",
    },
    swatch: ["#0A0E17", "#E0E4E8", "#3DFFCD"],
  },
  {
    id: "crt-terminal",
    name: "CRT Terminal",
    description: "Retro green phosphor on dark",
    colors: {
      background: "#0D1208",
      text: "#33FF33",
      caret: "#66FF66",
      selection: "rgba(51, 255, 51, 0.15)",
      headingText: "#33FF33",
      blockquoteBorder: "rgba(51, 255, 51, 0.3)",
      blockquoteText: "#22CC22",
      codeBackground: "rgba(51, 255, 51, 0.08)",
    },
    swatch: ["#0D1208", "#33FF33", "#66FF66"],
  },
  {
    id: "comm-channel",
    name: "Comm Channel",
    description: "Ship communications, deep blue with azure signal text",
    colors: {
      background: "#0A1628",
      text: "#4D9FFF",
      caret: "#5B8DEF",
      selection: "rgba(77, 159, 255, 0.15)",
      headingText: "#4D9FFF",
      blockquoteBorder: "rgba(77, 159, 255, 0.3)",
      blockquoteText: "#5B8DEF",
      codeBackground: "rgba(77, 159, 255, 0.08)",
    },
    swatch: ["#0A1628", "#4D9FFF", "#5B8DEF"],
  },
];
