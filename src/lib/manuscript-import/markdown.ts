// ---------------------------------------------------------------------------
// markdown, a writer's Markdown to the editor's HTML.
//
// Covers what manuscripts use: ATX and setext headings, paragraphs, emphasis
// (* _ ** __ ~~), links, blockquotes, bullet and numbered lists, horizontal
// rules (scene breaks), hard line breaks (two trailing spaces or a trailing
// backslash). Code spans and fences import as plain text; front matter
// (--- yaml ---) at the very top is skipped. Raw HTML is escaped, never run.
//
// Pure: no DOM. Tested.
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Inline Markdown to HTML. */
export function markdownInline(src: string): string {
  // Protect code spans first so their contents are not parsed.
  const codes: string[] = [];
  let s = src.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(escapeHtml(c));
    return `\uE000${codes.length - 1}\uE000`;
  });
  // Backslash escapes.
  const escapes: string[] = [];
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!~>])/g, (_m, c: string) => {
    escapes.push(escapeHtml(c));
    return `\uE001${escapes.length - 1}\uE001`;
  });
  s = escapeHtml(s);
  // Links [text](url "title")
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_m, text: string, url: string) => {
    const href = url.replace(/&amp;/g, "&");
    return /^(https?:|mailto:)/i.test(href) ? `<a href="${escapeHtml(href)}">${text}</a>` : text;
  });
  s = s.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>");
  s = s.replace(/(^|[^*\w])\*(?=\S)([\s\S]*?\S)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_\w])_(?=\S)([\s\S]*?\S)_(?![_\w])/g, "$1<em>$2</em>");
  s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<s>$1</s>");
  // Hard breaks.
  s = s.replace(/( {2,}|\\)\n/g, "<br>").replace(/\n/g, " ");
  s = s.replace(/\uE001(\d+)\uE001/g, (_m, i: string) => escapes[Number(i)]);
  s = s.replace(/\uE000(\d+)\uE000/g, (_m, i: string) => codes[Number(i)]);
  return s.trim();
}

const HR = /^ {0,3}([-*_])( *\1){2,} *$/;
const ATX = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const BULLET = /^ {0,3}[-*+]\s+(.*)$/;
const ORDERED = /^ {0,3}\d{1,9}[.)]\s+(.*)$/;
const QUOTE = /^ {0,3}>\s?(.*)$/;
const FENCE = /^ {0,3}(```|~~~)/;

/** Block Markdown to HTML (headings capped at h3, the editor's limit). */
export function markdownToHtml(md: string): string {
  let text = md.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  // YAML front matter.
  if (/^---\n[\s\S]*?\n(---|\.\.\.)\n/.test(text)) text = text.replace(/^---\n[\s\S]*?\n(---|\.\.\.)\n/, "");
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  const isBlockStart = (l: string) =>
    HR.test(l) || ATX.test(l) || BULLET.test(l) || ORDERED.test(l) || QUOTE.test(l) || FENCE.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (FENCE.test(line)) {
      const fence = line.trim().slice(0, 3);
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) body.push(lines[i++]);
      i++;
      if (body.length) out.push(`<p>${body.map(escapeHtml).join("<br>")}</p>`);
      continue;
    }
    const atx = ATX.exec(line);
    if (atx) {
      const level = Math.min(3, atx[1].length);
      const inner = markdownInline(atx[2]);
      if (inner) out.push(`<h${level}>${inner}</h${level}>`);
      i++;
      continue;
    }
    if (HR.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (QUOTE.test(lines[i]) || (lines[i].trim() && !isBlockStart(lines[i]) && body.length))) {
        const m = QUOTE.exec(lines[i]);
        body.push(m ? m[1] : lines[i]);
        i++;
      }
      const inner = markdownToHtml(body.join("\n"));
      if (inner) out.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }
    if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = ORDERED.test(line);
      const re = ordered ? ORDERED : BULLET;
      const items: string[] = [];
      while (i < lines.length) {
        const m = re.exec(lines[i]);
        if (m) {
          items.push(m[1]);
          i++;
          continue;
        }
        // Lazy continuation of the previous item.
        if (lines[i].trim() && /^\s+/.test(lines[i]) && items.length) {
          items[items.length - 1] += "\n" + lines[i].trim();
          i++;
          continue;
        }
        break;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((it) => `<li><p>${markdownInline(it)}</p></li>`).join("")}</${tag}>`);
      continue;
    }
    // Paragraph (with setext heading detection).
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      const next = lines[i + 1];
      if (body.length === 0 && next !== undefined && /^ {0,3}(=+|-+)\s*$/.test(next) && lines[i].trim()) {
        break;
      }
      body.push(lines[i]);
      i++;
    }
    if (body.length === 0) {
      // Setext heading.
      const level = /^ {0,3}=/.test(lines[i + 1]) ? 1 : 2;
      out.push(`<h${level}>${markdownInline(lines[i].trim())}</h${level}>`);
      i += 2;
      continue;
    }
    const inner = markdownInline(body.join("\n"));
    if (inner) out.push(`<p>${inner}</p>`);
  }
  return out.join("");
}
