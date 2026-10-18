// ---------------------------------------------------------------------------
// project-replace, find and replace across the manuscript.
//
// The binder search finds; this replaces. It is an explicit writer action
// (Constitution: nothing modifies the writer's prose unless the writer
// initiates and confirms it): the writer previews every match with its
// context, includes or excludes each, and only then applies. Every affected
// document is filed as a named snapshot first (BEFORE REPLACE "X" → "Y"),
// and REVERT REPLACE puts those snapshots back.
//
// What it touches: the TEXT NODES of a document's stored HTML, and nothing
// else. Never an attribute, never a tag, never the inside of a cited fact
// (fact-ref), an @mention (entity-mention) or a [[wiki link]]: those are
// atoms whose text is a stored value or a Codex name, and rewriting them
// would forge a citation. An atom also breaks the run of text, so a match
// can never straddle one; a block boundary or a line break does the same,
// as in the in-document find. Inside a run, a match may cross formatting
// (the "wor" in <em>wor</em>ld): the replacement lands in the node where
// the match starts and the rest of the match is removed.
//
// The preview (planReplace) and the write (applyReplace) share one walk, so
// match N in the list is match N on apply.
//
// Uses DOMParser (browser and jsdom); pure otherwise. Tested in
// src/lib/__tests__/project-replace.test.ts.
// ---------------------------------------------------------------------------

import { snippetAround, type Span } from "@/lib/binder-search";

/** Elements whose text is never prose to replace (stored values, names). */
const ATOM_TAGS = new Set(["fact-ref", "entity-mention", "wiki-link"]);

/** Never descended into at all. */
const SKIP_TAGS = new Set(["script", "style", "template", "svg", "img", "video", "audio", "iframe"]);

/** Elements that start a new run of text (a match never crosses them). */
const BREAK_TAGS = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "blockquote", "pre",
  "br", "hr", "tr", "td", "th", "table", "tbody", "thead", "section", "article", "figure", "figcaption",
]);

/** Inline wrappers that may be pruned once a replacement leaves them empty. */
const PRUNABLE_INLINE = new Set(["strong", "b", "em", "i", "u", "s", "strike", "del", "code", "mark", "span", "a", "sub", "sup"]);

export interface ReplaceMatch {
  /** Index of this match in the document (0-based, document order). */
  index: number;
  before: string;
  match: string;
  after: string;
  /** What the match becomes ($1, $& … expanded for a regex). */
  replacement: string;
}

/** One stretch of text no atom, block or break interrupts. */
interface Run {
  nodes: Text[];
  text: string;
}

interface Located {
  run: Run;
  span: Span;
  replacement: string;
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
}

function isAtom(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (ATOM_TAGS.has(tag)) return true;
  // Any element Tiptap marks as an atom or mention, whatever its tag.
  return el.hasAttribute("data-fact-key") || el.getAttribute("data-type") === "mention";
}

/** Every run of replaceable text, in document order. */
function collectRuns(root: Node): Run[] {
  const runs: Run[] = [];
  let current: Run = { nodes: [], text: "" };
  const close = () => {
    if (current.nodes.length) runs.push(current);
    current = { nodes: [], text: "" };
  };
  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const t = child as Text;
        current.nodes.push(t);
        current.text += t.data;
        return;
      }
      if (child.nodeType !== 1) return;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (SKIP_TAGS.has(tag)) return;
      if (isAtom(el)) {
        close();
        return;
      }
      const breaks = BREAK_TAGS.has(tag);
      if (breaks) close();
      walk(el);
      if (breaks) close();
    });
  };
  walk(root);
  close();
  return runs;
}

/**
 * Expand a String.replace-style template against one regex match:
 * $$, $&, $`, $', $1–$99 and $<name>.
 */
export function expandReplacement(template: string, m: RegExpExecArray, input: string): string {
  return template.replace(/\$(\$|&|`|'|<([^>]*)>|(\d{1,2}))/g, (whole, tok: string, name?: string, num?: string) => {
    if (tok === "$") return "$";
    if (tok === "&") return m[0];
    if (tok === "`") return input.slice(0, m.index);
    if (tok === "'") return input.slice(m.index + m[0].length);
    if (name !== undefined) return m.groups?.[name] ?? "";
    if (num !== undefined) {
      // "$12" with one group means "$1" then "2", as String.replace does.
      const two = Number(num);
      if (two > 0 && two < m.length) return m[two] ?? "";
      const one = Number(num[0]);
      if (num.length === 2 && one > 0 && one < m.length) return (m[one] ?? "") + num[1];
      return whole;
    }
    return whole;
  });
}

/** Every non-empty match in a run, with its replacement. */
function matchesIn(run: Run, re: RegExp, replacement: string, regex: boolean): Located[] {
  const out: Located[] = [];
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = g.exec(run.text)) !== null) {
    if (m[0].length === 0) {
      g.lastIndex += 1;
      continue;
    }
    out.push({
      run,
      span: { start: m.index, end: m.index + m[0].length },
      replacement: regex ? expandReplacement(replacement, m, run.text) : replacement,
    });
  }
  return out;
}

function locateAll(root: Node, re: RegExp, replacement: string, regex: boolean): Located[] {
  return collectRuns(root).flatMap((run) => matchesIn(run, re, replacement, regex));
}

/** The preview: every match in one document, with context. */
export function planReplace(html: string | null | undefined, re: RegExp, replacement: string, regex: boolean): ReplaceMatch[] {
  if (!html) return [];
  const doc = parse(html);
  return locateAll(doc.body, re, replacement, regex).map((l, index) => ({
    index,
    ...snippetAround(l.run.text, l.span),
    replacement: l.replacement,
  }));
}

/** Map an offset in a run to the text node holding it. End offsets prefer the earlier node. */
function pointAt(run: Run, offset: number, preferEnd: boolean): { node: Text; at: number } {
  let base = 0;
  for (const node of run.nodes) {
    const len = node.data.length;
    if (preferEnd ? offset <= base + len : offset < base + len) return { node, at: offset - base };
    base += len;
  }
  const last = run.nodes[run.nodes.length - 1];
  return { node: last, at: last.data.length };
}

function pruneEmpty(node: Node | null): void {
  let n = node;
  while (n && n.nodeType === 1) {
    const el = n as Element;
    if (!PRUNABLE_INLINE.has(el.tagName.toLowerCase()) || el.childNodes.length > 0) return;
    const parent = el.parentNode;
    parent?.removeChild(el);
    n = parent;
  }
}

export interface ApplyResult {
  html: string;
  replaced: number;
}

/**
 * Apply the included matches to one document. `include` decides by match
 * index (the same indexes planReplace returned). Returns the html unchanged
 * when nothing was included.
 */
export function applyReplace(
  html: string,
  re: RegExp,
  replacement: string,
  regex: boolean,
  include: (index: number) => boolean,
): ApplyResult {
  if (!html) return { html, replaced: 0 };
  const doc = parse(html);
  const located = locateAll(doc.body, re, replacement, regex);
  const chosen = located.filter((_, i) => include(i));
  if (chosen.length === 0) return { html, replaced: 0 };

  // Back to front inside each run, so earlier offsets stay valid.
  const emptied = new Set<Text>();
  for (let i = chosen.length - 1; i >= 0; i--) {
    const { run, span, replacement: rep } = chosen[i];
    const from = pointAt(run, span.start, false);
    const to = pointAt(run, span.end, true);
    if (from.node === to.node) {
      from.node.data = from.node.data.slice(0, from.at) + rep + from.node.data.slice(to.at);
    } else {
      from.node.data = from.node.data.slice(0, from.at) + rep;
      const a = run.nodes.indexOf(from.node);
      const b = run.nodes.indexOf(to.node);
      for (let k = a + 1; k < b; k++) run.nodes[k].data = "";
      to.node.data = to.node.data.slice(to.at);
    }
    // The run's own text must follow, for the next (earlier) match.
    run.text = run.nodes.map((n) => n.data).join("");
    for (const n of run.nodes) if (!n.data) emptied.add(n);
  }
  for (const n of emptied) {
    if (n.data) continue;
    const parent = n.parentNode;
    parent?.removeChild(n);
    pruneEmpty(parent);
  }
  return { html: doc.body.innerHTML, replaced: chosen.length };
}

// ---------------------------------------------------------------------------
// Snapshot names and the per-document plan
// ---------------------------------------------------------------------------

/** Snapshot names are capped at 80 characters (use-document-versions). */
const NAME_MAX = 80;

function clip(s: string, max: number): string {
  const flat = s.replace(/\s+/g, " ");
  return flat.length > max ? `${flat.slice(0, Math.max(1, max - 1))}…` : flat;
}

/** BEFORE REPLACE "X" → "Y", kept within the snapshot name limit. */
export function replaceSnapshotName(find: string, replacement: string): string {
  const fixed = 'BEFORE REPLACE "" → ""'.length;
  const room = NAME_MAX - fixed;
  const half = Math.max(4, Math.floor(room / 2));
  let x = clip(find, half);
  const y = clip(replacement, room - x.length);
  if (x.length + y.length > room) x = clip(find, room - y.length);
  return `BEFORE REPLACE "${x}" → "${y}"`;
}

export interface ReplaceDocInput {
  id: string;
  title: string;
  content: string | null;
}

export interface DocReplacePlan {
  docId: string;
  title: string;
  matches: ReplaceMatch[];
}

/** Plan every document (pass them in reading order; results keep it). */
export function planProject(
  docs: ReplaceDocInput[],
  re: RegExp,
  replacement: string,
  regex: boolean,
): DocReplacePlan[] {
  const out: DocReplacePlan[] = [];
  for (const d of docs) {
    const matches = planReplace(d.content, re, replacement, regex);
    if (matches.length) out.push({ docId: d.id, title: d.title || "Untitled", matches });
  }
  return out;
}

/** Match key used by the preview's include/exclude state. */
export function matchKey(docId: string, index: number): string {
  return `${docId}:${index}`;
}

export interface SnapshotPlanEntry {
  docId: string;
  title: string;
  name: string;
  /** Matches that will be replaced in this document. */
  count: number;
}

/**
 * The snapshots to file before applying: one per document with at least one
 * included match, and none for a document whose every match was excluded.
 */
export function snapshotPlan(
  plans: DocReplacePlan[],
  excluded: ReadonlySet<string>,
  find: string,
  replacement: string,
): SnapshotPlanEntry[] {
  const name = replaceSnapshotName(find, replacement);
  const out: SnapshotPlanEntry[] = [];
  for (const p of plans) {
    const count = p.matches.filter((m) => !excluded.has(matchKey(p.docId, m.index))).length;
    if (count > 0) out.push({ docId: p.docId, title: p.title, name, count });
  }
  return out;
}

/**
 * Is a document's text now still what the preview was built from? Compared
 * by the matched strings in order, so a live editor's re-serialised HTML (the
 * same words, different attribute order) still counts as unchanged.
 */
export function samePlan(a: ReplaceMatch[], b: ReplaceMatch[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].match !== b[i].match || a[i].before !== b[i].before || a[i].after !== b[i].after) return false;
  }
  return true;
}
