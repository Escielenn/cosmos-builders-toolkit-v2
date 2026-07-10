/**
 * Pure text helpers shared by the editor, Studio, and streak math.
 * No framework imports — keep it that way so it stays trivially testable.
 */

/** Word count from HTML or plain text (tags → spaces, entities normalized). */
export function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
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
