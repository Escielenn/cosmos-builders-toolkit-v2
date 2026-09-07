/**
 * Pure text helpers shared by the editor, Studio, and streak math.
 * No framework imports — keep it that way so it stays trivially testable.
 */

/**
 * Word count from already-separated plain text.
 *
 * THE one implementation. Every word count the writer sees goes through it,
 * because two counters that disagree teach the writer to distrust both — and
 * word count is the number a writer watches hardest. The Studio footer and
 * the editor's own readout used to differ by one word per paragraph: the
 * editor counted `doc.textContent`, which prosemirror-model defines as
 * `textBetween(0, size, "")` — an EMPTY block separator, so paragraphs are
 * glued and the boundary word is counted once instead of twice. An eight
 * paragraph scene read 133 in the editor and 140 everywhere else.
 *
 * Callers holding a ProseMirror doc must pass
 * `doc.textBetween(0, doc.content.size, " ", " ")`, never `doc.textContent`.
 */
export function countWordsInText(text: string | null | undefined): number {
  if (!text) return 0;
  const normalized = text.replace(/&nbsp;/g, " ").trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

/** Word count from HTML (tags → spaces, so block boundaries separate words). */
export function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  return countWordsInText(html.replace(/<[^>]+>/g, " "));
}

/** Last full sentence of a document's text, for the continue-writing card. */
export function lastSentence(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  const sentences = text.match(/[^.!?…]+[.!?…]+/g);
  const last = sentences ? sentences[sentences.length - 1].trim() : text;
  return last.length > 220 ? "…" + last.slice(-220) : last;
}
