// ---------------------------------------------------------------------------
// back-matter, graph-derived back matter for a compiled manuscript
// (Studio Charter 2.7): generated at compile time, never hand-maintained.
//
//   GLOSSARY            every Codex entry mentioned in the compiled text,
//                       alphabetical, with its summary. Characters move to
//                       the Dramatis Personae when that is on.
//   DRAMATIS PERSONAE   every character mentioned, by first appearance, with
//                       role and summary.
//   SERIES BIBLE        the world's CANON facts (never proposed, never
//                       projected), grouped by cascade layer.
//
// "Mentioned" means either a real reference in the prose (an @mention or a
// [[wiki link]] carrying the entry's id) or the entry's name, or one of its
// aliases, as a whole word with its own capitalisation. Only documents that
// are in the compile count, so excluding a chapter drops whoever appears
// only there.
//
// Pure: DOMParser for the HTML, nothing else. Tested in
// src/lib/__tests__/back-matter.test.ts.
// ---------------------------------------------------------------------------

import type { Block, Run } from "./blocks";

export type BackMatterLayer =
  | "physics"
  | "environment"
  | "biology"
  | "psychology"
  | "mythology"
  | "culture"
  | "integration"
  | "other";

/** Cascade order: Physics → Environment → Biology → Psychology → Mythology → Culture. */
export const LAYER_ORDER: BackMatterLayer[] = [
  "physics",
  "environment",
  "biology",
  "psychology",
  "mythology",
  "culture",
  "integration",
  "other",
];

export const LAYER_TITLES: Record<BackMatterLayer, string> = {
  physics: "Physics",
  environment: "Environment",
  biology: "Biology",
  psychology: "Psychology",
  mythology: "Mythology",
  culture: "Culture",
  integration: "Integration",
  other: "Other Records",
};

export interface BackMatterEntity {
  id: string;
  name: string;
  /** Entity type key ("character", "planet", …). */
  type: string;
  /** Display label of the type ("Planet"). */
  typeLabel: string;
  summary: string | null;
  /** Role in the story (characters). */
  role?: string | null;
  aliases?: string[];
}

export interface BackMatterFact {
  subjectId: string | null;
  /** The subject's name, or null for a world-level fact. */
  subjectName: string | null;
  label: string;
  valueText: string;
  /** "canon" | "proposed" | "projected"; only canon is printed. */
  confidence: string;
  layer: BackMatterLayer;
}

export interface BackMatterData {
  entities: BackMatterEntity[];
  facts: BackMatterFact[];
}

export interface BackMatterOptions {
  glossary: boolean;
  dramatis: boolean;
  seriesBible: boolean;
}

export interface BackMatterSection {
  id: "glossary" | "dramatis" | "bible";
  title: string;
  blocks: Block[];
}

export interface Mention {
  entity: BackMatterEntity;
  /** Order key of the first appearance (document index, then offset). */
  first: number;
}

/** Minimum length for a name matched as plain text ("Al" is too common). */
const MIN_NAME = 3;
const DOC_STRIDE = 1e9;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A document as plain text, plus the offsets of explicit references. */
function readDoc(html: string): { text: string; refs: { id: string; at: number }[] } {
  const refs: { id: string; at: number }[] = [];
  if (!html || !html.trim()) return { text: "", refs };
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
  let text = "";
  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        text += (child as Text).data;
        return;
      }
      if (child.nodeType !== 1) return;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;
      const id =
        tag === "entity-mention"
          ? el.getAttribute("data-id")
          : tag === "wiki-link"
            ? el.getAttribute("data-element-id")
            : null;
      if (id) refs.push({ id, at: text.length });
      if (/^(p|div|h[1-6]|li|blockquote|br|tr|td|th|pre)$/.test(tag)) text += "\n";
      walk(el);
      if (/^(p|div|h[1-6]|li|blockquote|tr|pre)$/.test(tag)) text += "\n";
    });
  };
  walk(doc.body);
  return { text, refs };
}

function namesOf(e: BackMatterEntity): string[] {
  return [e.name, ...(e.aliases ?? [])].map((n) => n.trim()).filter((n) => n.length >= MIN_NAME);
}

/**
 * Every entity the compiled documents mention, ordered by first appearance.
 * `htmls` are the included documents' stored HTML in compile order.
 */
export function mentionedEntities(htmls: string[], entities: BackMatterEntity[]): Mention[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const first = new Map<string, number>();
  const note = (id: string, at: number) => {
    const prev = first.get(id);
    if (prev === undefined || at < prev) first.set(id, at);
  };
  const matchers = entities
    .map((e) => {
      const names = namesOf(e);
      if (!names.length) return null;
      // Longest first, so "Mara Voss" wins over "Mara" at the same spot.
      const alt = names.sort((a, b) => b.length - a.length).map(escapeRegex).join("|");
      return { id: e.id, re: new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alt})(?![\\p{L}\\p{N}_])`, "u") };
    })
    .filter((m): m is { id: string; re: RegExp } => !!m);

  htmls.forEach((html, d) => {
    const { text, refs } = readDoc(html);
    const base = d * DOC_STRIDE;
    for (const r of refs) if (byId.has(r.id)) note(r.id, base + r.at);
    if (!text) return;
    for (const m of matchers) {
      const hit = m.re.exec(text);
      if (hit) note(m.id, base + hit.index);
    }
  });

  return [...first.entries()]
    .map(([id, at]) => ({ entity: byId.get(id)!, first: at }))
    .sort((a, b) => a.first - b.first || a.entity.name.localeCompare(b.entity.name));
}

const isCharacter = (e: BackMatterEntity) => e.type === "character";

/** Glossary entries: alphabetical; characters left to the Dramatis Personae when it is on. */
export function selectGlossary(mentions: Mention[], dramatisOn: boolean): BackMatterEntity[] {
  return mentions
    .map((m) => m.entity)
    .filter((e) => !(dramatisOn && isCharacter(e)))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/** Dramatis Personae: characters in order of first appearance. */
export function selectDramatis(mentions: Mention[]): BackMatterEntity[] {
  return mentions.filter((m) => isCharacter(m.entity)).map((m) => m.entity);
}

/** Series bible: canon facts only, grouped by cascade layer, in cascade order. */
export function selectSeriesBible(facts: BackMatterFact[]): { layer: BackMatterLayer; facts: BackMatterFact[] }[] {
  const canon = facts.filter((f) => f.confidence === "canon" && f.valueText.trim());
  return LAYER_ORDER.map((layer) => ({
    layer,
    facts: canon
      .filter((f) => f.layer === layer)
      .sort(
        (a, b) =>
          (a.subjectName ?? "").localeCompare(b.subjectName ?? "") || a.label.localeCompare(b.label),
      ),
  })).filter((g) => g.facts.length > 0);
}

function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function entryBlock(head: string, note: string | null, body: string): Block {
  const runs: Run[] = [{ text: head, bold: true }];
  if (note) runs.push({ text: ` (${note})` });
  if (body) runs.push({ text: `: ${body}` });
  return { type: "p", runs };
}

/** The back matter sections a compile asked for; empty ones are left out. */
export function buildBackMatter(htmls: string[], opts: BackMatterOptions, data: BackMatterData | undefined): BackMatterSection[] {
  if (!data || (!opts.glossary && !opts.dramatis && !opts.seriesBible)) return [];
  const out: BackMatterSection[] = [];
  const mentions = opts.glossary || opts.dramatis ? mentionedEntities(htmls, data.entities) : [];

  if (opts.dramatis) {
    const people = selectDramatis(mentions);
    if (people.length) {
      out.push({
        id: "dramatis",
        title: "Dramatis Personae",
        blocks: people.map((e) => entryBlock(e.name, clean(e.role) || null, clean(e.summary))),
      });
    }
  }
  if (opts.glossary) {
    const terms = selectGlossary(mentions, opts.dramatis);
    if (terms.length) {
      out.push({
        id: "glossary",
        title: "Glossary",
        blocks: terms.map((e) => entryBlock(e.name, e.typeLabel || null, clean(e.summary))),
      });
    }
  }
  if (opts.seriesBible) {
    const groups = selectSeriesBible(data.facts);
    if (groups.length) {
      const blocks: Block[] = [];
      for (const g of groups) {
        blocks.push({ type: "h", level: 2, runs: [{ text: LAYER_TITLES[g.layer] }] });
        g.facts.forEach((f, i) => {
          const runs: Run[] = [];
          if (f.subjectName) runs.push({ text: `${clean(f.subjectName)} · `, italic: true });
          runs.push({ text: `${clean(f.label)}: ${clean(f.valueText)}` });
          blocks.push({ type: "li", ordered: false, index: i + 1, depth: 0, runs });
        });
      }
      out.push({ id: "bible", title: "Appendix: Series Bible", blocks });
    }
  }
  return out;
}
