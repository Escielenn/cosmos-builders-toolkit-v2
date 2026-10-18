// ---------------------------------------------------------------------------
// blocks, one reading of a document's HTML that every compile format shares.
//
// The editor stores Tiptap HTML. Each output (DOCX, PDF, EPUB, Markdown,
// text) used to strip it with its own regexes, which disagreed at the edges.
// Here the HTML is parsed once into paragraphs of formatted runs.
//
// Cited facts (fact-ref) print their STORED value (flattenFactRefs runs
// first: a manuscript prints what the writer inserted, never the live tool
// value). Entity mentions and wiki links print their display text: they are
// unknown inline elements whose text content is the label.
//
// Uses DOMParser (browser and jsdom); pure otherwise.
// ---------------------------------------------------------------------------

import { flattenFactRefs } from "@/lib/writing/fact-ref";

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  href?: string;
}

export type Block =
  | { type: "p"; runs: Run[] }
  | { type: "h"; level: 1 | 2 | 3; runs: Run[] }
  | { type: "quote"; runs: Run[] }
  | { type: "li"; ordered: boolean; index: number; depth: number; runs: Run[] }
  | { type: "hr" };

interface Marks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  href?: string;
}

const MARK_TAGS: Record<string, keyof Marks> = {
  strong: "bold",
  b: "bold",
  em: "italic",
  i: "italic",
  cite: "italic",
  u: "underline",
  s: "strike",
  strike: "strike",
  del: "strike",
};

const SKIP = new Set(["script", "style", "img", "svg", "video", "audio", "iframe", "template"]);

function pushRun(runs: Run[], text: string, marks: Marks): void {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (
    last &&
    text !== "\n" &&
    last.text !== "\n" &&
    !!last.bold === !!marks.bold &&
    !!last.italic === !!marks.italic &&
    !!last.underline === !!marks.underline &&
    !!last.strike === !!marks.strike &&
    last.href === marks.href
  ) {
    last.text += text;
    return;
  }
  const run: Run = { text };
  if (marks.bold) run.bold = true;
  if (marks.italic) run.italic = true;
  if (marks.underline) run.underline = true;
  if (marks.strike) run.strike = true;
  if (marks.href) run.href = marks.href;
  runs.push(run);
}

function inlineOne(child: Node, marks: Marks, runs: Run[]): void {
  if (child.nodeType === 3) {
    pushRun(runs, (child.textContent ?? "").replace(/\s+/g, " "), marks);
    return;
  }
  if (child.nodeType !== 1) return;
  const el = child as Element;
  const tag = el.tagName.toLowerCase();
  if (SKIP.has(tag)) return;
  if (tag === "br") {
    pushRun(runs, "\n", marks);
    return;
  }
  const mark = MARK_TAGS[tag];
  let next = mark ? { ...marks, [mark]: true } : marks;
  if (tag === "a") {
    const href = el.getAttribute("href");
    if (href && /^(https?:|mailto:)/i.test(href)) next = { ...next, href };
  }
  inlineRuns(el, next, runs);
}

function inlineRuns(node: Node, marks: Marks, runs: Run[]): Run[] {
  node.childNodes.forEach((child) => inlineOne(child, marks, runs));
  return runs;
}

/** Trim leading/trailing whitespace across a paragraph's runs. */
function trimRuns(runs: Run[]): Run[] {
  const out = runs.map((r) => ({ ...r }));
  while (out.length && out[0].text !== "\n" && !out[0].text.trim()) out.shift();
  while (out.length && (out[out.length - 1].text === "\n" || !out[out.length - 1].text.trim())) out.pop();
  if (out.length) {
    out[0].text = out[0].text.replace(/^\s+/, "");
    out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, "");
  }
  return out;
}

function hasText(runs: Run[]): boolean {
  return runs.some((r) => r.text.trim());
}

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "hr", "div", "section", "pre", "table", "tr", "td", "th", "tbody", "thead"]);

function walkBlocks(container: Element, out: Block[], ctx: { quote: boolean; listDepth: number }): void {
  let loose: Run[] = [];
  const flushLoose = () => {
    const runs = trimRuns(loose);
    loose = [];
    if (!hasText(runs)) return;
    out.push(ctx.quote ? { type: "quote", runs } : { type: "p", runs });
  };
  container.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      pushRun(loose, (child.textContent ?? "").replace(/\s+/g, " "), {});
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return;
    if (!BLOCK_TAGS.has(tag)) {
      inlineOne(el, {}, loose);
      return;
    }
    flushLoose();
    if (/^h[1-6]$/.test(tag)) {
      const runs = trimRuns(inlineRuns(el, {}, []));
      if (hasText(runs)) out.push({ type: "h", level: Math.min(3, Number(tag[1])) as 1 | 2 | 3, runs });
      return;
    }
    if (tag === "hr") {
      out.push({ type: "hr" });
      return;
    }
    if (tag === "blockquote") {
      walkBlocks(el, out, { ...ctx, quote: true });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      let index = 0;
      Array.from(el.children).forEach((li) => {
        if (li.tagName.toLowerCase() !== "li") return;
        index++;
        // An item's own text (its first paragraph(s)), then any nested list.
        const own: Run[] = [];
        const nested: Element[] = [];
        li.childNodes.forEach((c) => {
          if (c.nodeType === 1 && /^(ul|ol)$/i.test((c as Element).tagName)) nested.push(c as Element);
          else if (c.nodeType === 1 && (c as Element).tagName.toLowerCase() === "p") {
            if (own.length) pushRun(own, "\n", {});
            inlineRuns(c, {}, own);
          } else inlineOne(c, {}, own);
        });
        const runs = trimRuns(own);
        if (hasText(runs)) out.push({ type: "li", ordered: tag === "ol", index, depth: ctx.listDepth, runs });
        for (const n of nested) {
          const wrap = el.ownerDocument.createElement("div");
          wrap.appendChild(n.cloneNode(true));
          walkBlocks(wrap, out, { ...ctx, listDepth: ctx.listDepth + 1 });
        }
      });
      return;
    }
    if (tag === "p" || tag === "pre" || tag === "td" || tag === "th") {
      if (Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName.toLowerCase()))) {
        walkBlocks(el, out, ctx);
        return;
      }
      const runs = trimRuns(inlineRuns(el, {}, []));
      if (hasText(runs)) out.push(ctx.quote ? { type: "quote", runs } : { type: "p", runs });
      return;
    }
    walkBlocks(el, out, ctx);
  });
  flushLoose();
}

/** Parse one document's stored HTML into blocks. */
export function htmlToBlocks(html: string | null | undefined): Block[] {
  if (!html || !html.trim()) return [];
  const flat = flattenFactRefs(html);
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${flat}</body></html>`, "text/html");
  const out: Block[] = [];
  walkBlocks(doc.body, out, { quote: false, listDepth: 0 });
  return out;
}

/** Plain text of a run list (line breaks kept). */
export function runsText(runs: Run[]): string {
  return runs.map((r) => r.text).join("");
}

/** Word count over blocks, using the app's one counting rule. */
export function blocksWordCount(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    if (b.type === "hr") continue;
    const t = runsText(b.runs).trim();
    if (t) n += t.split(/\s+/).length;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function mdEscape(s: string): string {
  return s.replace(/([\\*_`[\]])/g, "\\$1");
}

export function runsToMarkdown(runs: Run[]): string {
  return runs
    .map((r) => {
      if (r.text === "\n") return "  \n";
      // Keep surrounding spaces outside the markers so emphasis stays valid.
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(r.text)!;
      let core = mdEscape(m[2]);
      if (!core) return r.text;
      if (r.strike) core = `~~${core}~~`;
      if (r.underline) core = `_${core}_`;
      if (r.italic) core = `*${core}*`;
      if (r.bold) core = `**${core}**`;
      if (r.href) core = `[${core}](${r.href})`;
      return m[1] + core + m[3];
    })
    .join("");
}

export function blocksToMarkdown(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.type === "hr") out.push("* * *");
    else if (b.type === "h") out.push(`${"#".repeat(b.level + 2 > 6 ? 6 : b.level + 2)} ${runsToMarkdown(b.runs)}`);
    else if (b.type === "quote") out.push(`> ${runsToMarkdown(b.runs).replace(/\n/g, "\n> ")}`);
    else if (b.type === "li") out.push(`${"  ".repeat(b.depth)}${b.ordered ? `${b.index}.` : "-"} ${runsToMarkdown(b.runs)}`);
    else out.push(runsToMarkdown(b.runs));
  }
  // Consecutive list items stay together; everything else is a paragraph.
  let text = "";
  blocks.forEach((b, i) => {
    const prev = blocks[i - 1];
    const tight = b.type === "li" && prev?.type === "li";
    text += (i === 0 ? "" : tight ? "\n" : "\n\n") + out[i];
  });
  return text;
}

export function blocksToText(blocks: Block[]): string {
  const out: string[] = [];
  blocks.forEach((b, i) => {
    const prev = blocks[i - 1];
    const sep = i === 0 ? "" : b.type === "li" && prev?.type === "li" ? "\n" : "\n\n";
    let line: string;
    if (b.type === "hr") line = "* * *";
    else if (b.type === "li") line = `${"  ".repeat(b.depth)}${b.ordered ? `${b.index}.` : "-"} ${runsText(b.runs)}`;
    else if (b.type === "quote") line = `    ${runsText(b.runs).replace(/\n/g, "\n    ")}`;
    else line = runsText(b.runs);
    out.push(sep + line);
  });
  return out.join("");
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Characters XML 1.0 forbids.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function runsToXhtml(runs: Run[]): string {
  return runs
    .map((r) => {
      if (r.text === "\n") return "<br/>";
      let s = escapeXml(r.text);
      if (r.strike) s = `<del>${s}</del>`;
      if (r.underline) s = `<u>${s}</u>`;
      if (r.italic) s = `<em>${s}</em>`;
      if (r.bold) s = `<strong>${s}</strong>`;
      if (r.href) s = `<a href="${escapeXml(r.href)}">${s}</a>`;
      return s;
    })
    .join("");
}

/** Blocks to XHTML (EPUB) or HTML (preview); always well-formed. */
export function blocksToXhtml(blocks: Block[]): string {
  let html = "";
  let listStack: ("ul" | "ol")[] = [];
  const closeLists = (depth: number) => {
    while (listStack.length > depth) html += `</li></${listStack.pop()}>`;
  };
  for (const b of blocks) {
    if (b.type !== "li") {
      closeLists(0);
      listStack = [];
    }
    if (b.type === "hr") html += '<p class="sep">* * *</p>';
    else if (b.type === "h") html += `<h${b.level + 2 > 6 ? 6 : b.level + 2}>${runsToXhtml(b.runs)}</h${b.level + 2 > 6 ? 6 : b.level + 2}>`;
    else if (b.type === "quote") html += `<blockquote><p>${runsToXhtml(b.runs)}</p></blockquote>`;
    else if (b.type === "li") {
      const tag = b.ordered ? "ol" : "ul";
      if (listStack.length > b.depth + 1) closeLists(b.depth + 1);
      if (listStack.length === b.depth + 1) html += "</li>";
      while (listStack.length < b.depth + 1) {
        html += `<${tag}>`;
        listStack.push(tag);
      }
      html += `<li>${runsToXhtml(b.runs)}`;
    } else html += `<p>${runsToXhtml(b.runs)}</p>`;
  }
  closeLists(0);
  return html;
}
