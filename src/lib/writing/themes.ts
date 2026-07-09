/**
 * Writing surface theme definitions for the RTF editor.
 * Each theme provides colors for background, text, caret, selection, and code blocks.
 */

export interface WritingThemeColors {
  background: string;
  text: string;
  caret: string;
  selection: string;
  headingText: string;
  blockquoteBorder: string;
  blockquoteText: string;
  codeBackground: string;
}

export interface WritingTheme {
  id: string;
  name: string;
  description: string;
  colors: WritingThemeColors;
  /** Hex swatch shown in picker: [background, text, accent] */
  swatch: [string, string, string];
}

export const WRITING_THEMES: WritingTheme[] = [
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

export function getWritingThemeById(id: string): WritingTheme {
  return WRITING_THEMES.find((t) => t.id === id) || WRITING_THEMES[0];
}
