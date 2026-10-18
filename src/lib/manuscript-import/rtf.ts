// ---------------------------------------------------------------------------
// rtf, a small RTF reader for manuscript import (Scrivener stores every text
// item as RTF).
//
// It reads prose, not layout: paragraphs, line breaks, bold / italic /
// underline / strikethrough, and the character escapes (\'hh in the code
// page, \uN with its \ucN fallback count, the named punctuation words).
// Font, colour and style tables, document info, pictures, headers, footers,
// footnotes and every \* destination are skipped whole. Paragraph and page
// formatting (indents, alignment, spacing) is ignored on purpose: the
// Studio's typography is the writer's, not the file's.
//
// Pure: no DOM, no network. Tested in src/lib/__tests__/manuscript-import.test.ts.
// ---------------------------------------------------------------------------

export interface RtfRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

/** One paragraph: runs in order. A "\n" run is a line break inside it. */
export type RtfParagraph = RtfRun[];

interface CharState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  /** Characters to skip after a \uN (its ANSI fallback). */
  uc: number;
  /** Inside a destination whose text is not prose. */
  skip: boolean;
}

/** Destinations whose content is never prose. */
const SKIP_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "object",
  "header",
  "headerl",
  "headerr",
  "headerf",
  "footer",
  "footerl",
  "footerr",
  "footerf",
  "footnote",
  "listtable",
  "listoverridetable",
  "revtbl",
  "rsidtbl",
  "generator",
  "xmlnstbl",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "filetbl",
  "expandedcolortbl",
  "fldinst",
  "nonshppict",
  "shp",
  "shpinst",
  "pn",
  "pntext",
  "listtext",
  "bkmkstart",
  "bkmkend",
  "field-instruction",
]);

/** Named control words that stand for one character. */
const CHAR_WORDS: Record<string, string> = {
  emdash: "—",
  endash: "–",
  lquote: "‘",
  rquote: "’",
  ldblquote: "“",
  rdblquote: "”",
  bullet: "•",
  emspace: " ",
  enspace: " ",
  qmspace: " ",
};

/** Windows-1252 bytes 0x80-0x9F, which differ from Latin-1. */
const CP1252_HIGH: Record<number, string> = {
  0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…",
  0x86: "†", 0x87: "‡", 0x88: "ˆ", 0x89: "‰", 0x8a: "Š",
  0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž", 0x91: "‘", 0x92: "’",
  0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—",
  0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ",
  0x9e: "ž", 0x9f: "Ÿ",
};

function cp1252(byte: number): string {
  return CP1252_HIGH[byte] ?? String.fromCharCode(byte);
}

/**
 * Parse RTF into paragraphs of formatted runs. Never throws: malformed input
 * yields whatever text could be read.
 */
export function rtfToParagraphs(rtf: string): RtfParagraph[] {
  const paragraphs: RtfParagraph[] = [];
  let current: RtfRun[] = [];
  const stack: CharState[] = [];
  let state: CharState = { bold: false, italic: false, underline: false, strike: false, uc: 1, skip: false };
  /** Fallback characters still to drop after a \uN. */
  let pendingSkip = 0;
  /** The next control word opens a destination (we just saw "{\*" or "{"). */
  let groupStart = false;
  let starred = false;

  const emit = (text: string) => {
    if (state.skip || !text) return;
    if (pendingSkip > 0) {
      const drop = Math.min(pendingSkip, text.length);
      pendingSkip -= drop;
      text = text.slice(drop);
      if (!text) return;
    }
    const last = current[current.length - 1];
    const same =
      text !== "\n" &&
      last &&
      last.text !== "\n" &&
      !!last.bold === state.bold &&
      !!last.italic === state.italic &&
      !!last.underline === state.underline &&
      !!last.strike === state.strike;
    if (same) {
      last.text += text;
      return;
    }
    const run: RtfRun = { text };
    if (state.bold) run.bold = true;
    if (state.italic) run.italic = true;
    if (state.underline) run.underline = true;
    if (state.strike) run.strike = true;
    current.push(run);
  };

  const endParagraph = () => {
    if (state.skip) return;
    paragraphs.push(current);
    current = [];
  };

  const n = rtf.length;
  let i = 0;
  while (i < n) {
    const ch = rtf[i];
    if (ch === "{") {
      stack.push(state);
      state = { ...state };
      groupStart = true;
      starred = false;
      i++;
      continue;
    }
    if (ch === "}") {
      state = stack.pop() ?? state;
      groupStart = false;
      starred = false;
      pendingSkip = 0;
      i++;
      continue;
    }
    if (ch === "\\") {
      const next = rtf[i + 1];
      if (next === undefined) break;
      // Control symbols.
      if (next === "\\" || next === "{" || next === "}") {
        emit(next);
        groupStart = false;
        i += 2;
        continue;
      }
      if (next === "*") {
        // {\* ...} : an optional destination. We skip all of them.
        if (groupStart) starred = true;
        state.skip = true;
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.slice(i + 2, i + 4);
        const byte = parseInt(hex, 16);
        if (!Number.isNaN(byte)) emit(cp1252(byte));
        groupStart = false;
        i += 4;
        continue;
      }
      if (next === "~") {
        emit("\u00A0");
        i += 2;
        continue;
      }
      if (next === "-") {
        // optional hyphen: invisible
        i += 2;
        continue;
      }
      if (next === "_") {
        emit("\u2011");
        i += 2;
        continue;
      }
      if (next === "\n" || next === "\r") {
        // "\" + newline is \par in old writers
        endParagraph();
        i += 2;
        continue;
      }
      // Control word: letters, optional signed number, optional single space.
      let j = i + 1;
      while (j < n && /[a-zA-Z]/.test(rtf[j])) j++;
      const word = rtf.slice(i + 1, j);
      if (!word) {
        // Unknown control symbol: drop it.
        i += 2;
        continue;
      }
      let k = j;
      if (rtf[k] === "-") k++;
      while (k < n && /[0-9]/.test(rtf[k])) k++;
      const numText = rtf.slice(j, k);
      const param = numText && numText !== "-" ? parseInt(numText, 10) : null;
      if (rtf[k] === " ") k++;
      i = k;

      const wasGroupStart = groupStart;
      groupStart = false;

      if (wasGroupStart && (SKIP_DESTINATIONS.has(word) || starred)) {
        state.skip = true;
        continue;
      }

      switch (word) {
        case "par":
        case "sect":
        case "page":
        case "row":
          endParagraph();
          break;
        case "line":
          emit("\n");
          break;
        case "tab":
          emit("\t");
          break;
        case "cell":
          emit(" ");
          break;
        case "b":
          state.bold = param !== 0;
          break;
        case "i":
          state.italic = param !== 0;
          break;
        case "ul":
        case "uld":
        case "uldb":
        case "ulw":
          state.underline = param !== 0;
          break;
        case "ulnone":
          state.underline = false;
          break;
        case "strike":
        case "striked":
          state.strike = param !== 0;
          break;
        case "plain":
          state.bold = false;
          state.italic = false;
          state.underline = false;
          state.strike = false;
          break;
        case "uc":
          state.uc = param ?? 1;
          break;
        case "u": {
          if (param !== null) {
            const code = param < 0 ? param + 65536 : param;
            emit(String.fromCharCode(code));
            pendingSkip = state.uc;
          }
          break;
        }
        case "bin":
          // Binary data: skip `param` bytes.
          i += Math.max(0, param ?? 0);
          break;
        default:
          if (CHAR_WORDS[word] !== undefined) emit(CHAR_WORDS[word]);
          // Everything else is formatting we deliberately ignore.
          break;
      }
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      // Raw newlines are not content in RTF.
      i++;
      continue;
    }
    // Plain text up to the next special character.
    let j = i;
    while (j < n && rtf[j] !== "\\" && rtf[j] !== "{" && rtf[j] !== "}" && rtf[j] !== "\r" && rtf[j] !== "\n") j++;
    groupStart = false;
    emit(rtf.slice(i, j));
    i = j;
  }
  if (current.length) paragraphs.push(current);
  return paragraphs;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function runToHtml(run: RtfRun): string {
  if (run.text === "\n") return "<br>";
  let html = escapeHtml(run.text.replace(/\t/g, " "));
  if (run.strike) html = `<s>${html}</s>`;
  if (run.underline) html = `<u>${html}</u>`;
  if (run.italic) html = `<em>${html}</em>`;
  if (run.bold) html = `<strong>${html}</strong>`;
  return html;
}

/** Leading tabs and spaces are first-line indents, not words. */
function trimRuns(runs: RtfRun[]): RtfRun[] {
  const out = runs.map((r) => ({ ...r }));
  while (out.length && out[0].text !== "\n" && !out[0].text.replace(/^[\t ]+/, "")) out.shift();
  if (out.length && out[0].text !== "\n") out[0].text = out[0].text.replace(/^[\t ]+/, "");
  while (out.length && out[out.length - 1].text !== "\n" && !out[out.length - 1].text.trimEnd()) out.pop();
  if (out.length && out[out.length - 1].text !== "\n") {
    out[out.length - 1].text = out[out.length - 1].text.replace(/[\t ]+$/, "");
  }
  return out;
}

/** RTF to Tiptap-ready HTML: one <p> per non-empty paragraph. */
export function rtfToHtml(rtf: string): string {
  return rtfToParagraphs(rtf)
    .map(trimRuns)
    .filter((p) => p.some((r) => r.text !== "\n" && r.text.trim()))
    .map((p) => `<p>${p.map(runToHtml).join("")}</p>`)
    .join("");
}

/** RTF to plain text, paragraphs separated by blank lines. */
export function rtfToText(rtf: string): string {
  return rtfToParagraphs(rtf)
    .map((p) => trimRuns(p).map((r) => r.text).join(""))
    .filter((t) => t.trim())
    .join("\n\n");
}
