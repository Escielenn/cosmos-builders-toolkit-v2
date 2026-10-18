// ---------------------------------------------------------------------------
// html, imported HTML reduced to what the Studio editor can hold.
//
// DOCX (through mammoth) and Markdown both arrive as HTML of unknown shape.
// The editor's schema is small: paragraphs, headings 1-3, bold, italic,
// underline, strikethrough, bullet and numbered lists, blockquote, links,
// line breaks and horizontal rules. Everything else is unwrapped (its text
// kept) or, for things that are never prose (scripts, styles, images,
// tables' chrome), dropped. Words are never dropped: a table's cells become
// paragraphs, a <div> becomes its children, an <h5> becomes an <h3>.
//
// Uses DOMParser (browser and jsdom). Pure otherwise.
// ---------------------------------------------------------------------------

const DROP = new Set(["script", "style", "noscript", "template", "img", "svg", "picture", "video", "audio", "iframe", "object", "embed", "head", "title", "meta", "link"]);

const INLINE_MAP: Record<string, string> = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  cite: "em",
  u: "u",
  ins: "u",
  s: "s",
  strike: "s",
  del: "s",
};

const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "hr", "div", "section", "article", "table", "tr", "td", "th", "tbody", "thead", "pre", "dl", "dt", "dd", "figure", "figcaption", "header", "footer", "main", "aside", "nav"]);

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, "&quot;");
}

function safeHref(href: string | null): string | null {
  if (!href) return null;
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h)) return h;
  return null;
}

/** Serialise inline content of a node (text + inline marks only). */
function inline(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      out += escapeText((child.textContent ?? "").replace(/\s+/g, " "));
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) return;
    if (tag === "br") {
      out += "<br>";
      return;
    }
    const mark = INLINE_MAP[tag];
    const inner = inline(el);
    if (mark) {
      out += inner.trim() ? `<${mark}>${inner}</${mark}>` : inner;
      return;
    }
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href"));
      out += href && inner.trim() ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner;
      return;
    }
    if (tag === "span") {
      // Word and Google Docs carry formatting as inline style.
      const style = (el.getAttribute("style") ?? "").toLowerCase();
      let s = inner;
      if (/font-weight:\s*(bold|[6-9]00)/.test(style)) s = `<strong>${s}</strong>`;
      if (/font-style:\s*italic/.test(style)) s = `<em>${s}</em>`;
      if (/text-decoration[^;]*underline/.test(style)) s = `<u>${s}</u>`;
      out += s;
      return;
    }
    out += inner;
  });
  return out;
}

function hasBlockChild(el: Element): boolean {
  return Array.from(el.children).some((c) => BLOCKS.has(c.tagName.toLowerCase()));
}

function para(html: string): string {
  const t = html.replace(/^(\s|<br>)+|(\s|<br>)+$/g, "");
  return t ? `<p>${t}</p>` : "";
}

/** Serialise one block-level element (and its subtree) to schema HTML. */
function block(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (DROP.has(tag)) return "";
  if (/^h[1-6]$/.test(tag)) {
    const level = Math.min(3, Number(tag[1]));
    const inner = inline(el).trim();
    return inner ? `<h${level}>${inner}</h${level}>` : "";
  }
  if (tag === "hr") return "<hr>";
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(el.children)
      .filter((c) => c.tagName.toLowerCase() === "li")
      .map((li) => {
        const body = hasBlockChild(li) ? blocks(li) : para(inline(li));
        return body ? `<li>${body}</li>` : "";
      })
      .filter(Boolean)
      .join("");
    return items ? `<${tag}>${items}</${tag}>` : "";
  }
  if (tag === "blockquote") {
    const body = hasBlockChild(el) ? blocks(el) : para(inline(el));
    return body ? `<blockquote>${body}</blockquote>` : "";
  }
  if (tag === "p" || tag === "pre" || tag === "dt" || tag === "dd" || tag === "figcaption" || tag === "td" || tag === "th") {
    if (hasBlockChild(el)) return blocks(el);
    return para(inline(el));
  }
  // Containers (div, section, table, tr, li outside a list, …): their children.
  return blocks(el);
}

/** Serialise the children of a container, wrapping loose inline runs in <p>. */
function blocks(container: Element): string {
  let out = "";
  let pending = "";
  const flush = () => {
    out += para(pending);
    pending = "";
  };
  container.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      pending += escapeText((child.textContent ?? "").replace(/\s+/g, " "));
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (BLOCKS.has(tag) || tag === "body") {
      flush();
      out += block(el);
      return;
    }
    // Inline element at block level: gather it into the pending paragraph.
    const wrapper = el.ownerDocument.createElement("span");
    wrapper.appendChild(el.cloneNode(true));
    pending += inline(wrapper);
  });
  flush();
  return out;
}

/**
 * Reduce arbitrary HTML to the editor's schema. Text is preserved; structure
 * the editor cannot hold is flattened into paragraphs.
 */
export function sanitizeImportHtml(html: string): string {
  if (!html || !html.trim()) return "";
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
  return blocks(doc.body);
}

/** Plain text to paragraphs. Blank lines separate paragraphs when present;
 *  otherwise every line is its own paragraph (one-paragraph-per-line files). */
export function plainTextToHtml(text: string): string {
  const norm = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "");
  if (!norm.trim()) return "";
  const hasBlank = /\n[ \t]*\n/.test(norm);
  const paras = hasBlank ? norm.split(/\n[ \t]*\n+/) : norm.split("\n");
  return paras
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.split("\n").map((l) => escapeText(l.trim())).join("<br>")}</p>`)
    .join("");
}
