// ---------------------------------------------------------------------------
// proofread-plugin, the assistant's underlines.
//
// Decorations only. This plugin never writes to the document: it draws under
// ranges the checker flagged and moves them as the writer types. Every
// replacement is a separate, ordinary transaction the writer asked for.
//
// Incremental by construction:
//   - on an edit the set is MAPPED through the change, not rebuilt
//   - underlines the edit touched are dropped at once (the word under the
//     caret is being rewritten; a stale squiggle there is noise)
//   - a paragraph's fresh result replaces only that paragraph's underlines
//
// While registered it also turns the browser's own spellcheck off for the
// editor, so two dictionaries never underline the same word.
// ---------------------------------------------------------------------------

import { Plugin, PluginKey, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { WireSuggestion } from "./protocol";

export interface ProofIssue {
  id: string;
  problem: string;
  message: string;
  kind: string;
  /** Identifies this occurrence for "ignore": the lint and its surroundings. */
  key: string;
  spelling: boolean;
  /** The flagged word opens its sentence (capital by grammar, not by name). */
  sentenceStart: boolean;
  suggestions: WireSuggestion[];
  /** A world name this unknown word resembles. */
  match?: {
    name: string;
    entityId?: string;
    kind: "case" | "plural" | "near";
    replacement: string;
  };
}

export interface PlacedIssue extends ProofIssue {
  from: number;
  to: number;
}

export type ProofMeta =
  | { type: "replaceRange"; from: number; to: number; issues: PlacedIssue[] }
  | { type: "replaceAll"; issues: PlacedIssue[] }
  | { type: "remove"; ids: string[] }
  | { type: "clear" };

export interface ProofState {
  decos: DecorationSet;
  /** Bumps whenever the SET of issues changes (not when it merely moves). */
  version: number;
  count: number;
}

export const proofreadKey = new PluginKey<ProofState>("sfProofread");

function decoFor(issue: PlacedIssue): Decoration {
  const { from, to, ...rest } = issue;
  return Decoration.inline(
    from,
    to,
    {
      class: `sf-proof ${issue.spelling ? "sf-proof-spelling" : "sf-proof-grammar"}`,
      "data-proof-id": issue.id,
    },
    { id: issue.id, issue: rest as ProofIssue, inclusiveStart: false, inclusiveEnd: false },
  );
}

function valid(issue: PlacedIssue, size: number): boolean {
  return issue.from >= 0 && issue.from < issue.to && issue.to <= size;
}

function applyMeta(meta: ProofMeta | ProofMeta[], prev: ProofState, tr: Transaction): ProofState {
  if (Array.isArray(meta)) return meta.reduce((acc, m) => applyMeta(m, acc, tr), prev);
  const size = tr.doc.content.size;
  let decos = prev.decos;
  if (meta.type === "clear") {
    if (prev.count === 0) return prev;
    return { decos: DecorationSet.empty, version: prev.version + 1, count: 0 };
  }
  if (meta.type === "replaceAll") {
    decos = DecorationSet.create(tr.doc, meta.issues.filter((i) => valid(i, size)).map(decoFor));
  } else if (meta.type === "replaceRange") {
    const old = decos.find(meta.from, meta.to).filter((d) => d.from >= meta.from && d.to <= meta.to);
    decos = decos.remove(old).add(tr.doc, meta.issues.filter((i) => valid(i, size)).map(decoFor));
  } else {
    const ids = new Set(meta.ids);
    const gone = decos.find(undefined, undefined, (spec) => ids.has(spec.id as string));
    if (gone.length === 0) return prev;
    decos = decos.remove(gone);
  }
  return { decos, version: prev.version + 1, count: decos.find().length };
}

function applyEdit(prev: ProofState, tr: Transaction): ProofState {
  if (prev.count === 0) return prev;
  let decos = prev.decos.map(tr.mapping, tr.doc);
  const touched: Decoration[] = [];
  tr.mapping.maps.forEach((map, i) => {
    const rest = tr.mapping.slice(i + 1);
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      const from = rest.map(newStart, -1);
      const to = rest.map(newEnd, 1);
      for (const d of decos.find(from, to)) touched.push(d);
    });
  });
  if (touched.length) decos = decos.remove(touched);
  const count = decos.find().length;
  return { decos, count, version: count === prev.count ? prev.version : prev.version + 1 };
}

export interface ProofreadPluginOptions {
  /** The set of issues changed. Never called for a pure move. */
  onChange(state: EditorState): void;
  /** The writer clicked an underlined word. */
  onPick(id: string): void;
}

export function proofreadPlugin(options: ProofreadPluginOptions): Plugin<ProofState> {
  return new Plugin<ProofState>({
    key: proofreadKey,
    state: {
      init: () => ({ decos: DecorationSet.empty, version: 0, count: 0 }),
      apply(tr, prev) {
        let next = tr.docChanged ? applyEdit(prev, tr) : prev;
        const meta = tr.getMeta(proofreadKey) as ProofMeta | ProofMeta[] | undefined;
        if (meta) next = applyMeta(meta, next, tr);
        return next;
      },
    },
    props: {
      decorations: (state) => proofreadKey.getState(state)?.decos ?? null,
      attributes: { spellcheck: "false" },
      handleClick(view, pos) {
        const ps = proofreadKey.getState(view.state);
        if (!ps || ps.count === 0) return false;
        const hit = ps.decos.find(pos, pos)[0];
        if (hit) options.onPick(hit.spec.id as string);
        // Never consume the click: the caret still lands where it was put.
        return false;
      },
    },
    view: () => ({
      update(view, prevState) {
        const now = proofreadKey.getState(view.state);
        const before = proofreadKey.getState(prevState);
        if (now && now.version !== before?.version) options.onChange(view.state);
      },
    }),
  });
}

/** Every issue with its current position, in document order. */
export function listIssues(state: EditorState): PlacedIssue[] {
  const ps = proofreadKey.getState(state);
  if (!ps || ps.count === 0) return [];
  return ps.decos
    .find()
    .map((d) => ({ ...(d.spec.issue as ProofIssue), from: d.from, to: d.to }))
    .sort((a, b) => a.from - b.from);
}

export function findIssue(state: EditorState, id: string): PlacedIssue | null {
  const ps = proofreadKey.getState(state);
  if (!ps) return null;
  const d = ps.decos.find(undefined, undefined, (spec) => spec.id === id)[0];
  return d ? { ...(d.spec.issue as ProofIssue), from: d.from, to: d.to } : null;
}
