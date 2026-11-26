// ---------------------------------------------------------------------------
// engine, the writing assistant at work.
//
// Owns the checker's worker and the editor binding. Loaded on demand (the
// controller imports this file only when the writer turns the assistant on),
// stopped completely when they turn it off or leave the Manuscript.
//
// What runs when:
//   typing          the plugin maps its underlines; one timer is re-armed.
//                   Nothing is sent, nothing is re-checked.
//   a 1.2 s pause   the ACTIVE paragraph goes to the worker, once. A
//                   paragraph node the checker has already seen is skipped
//                   (ProseMirror nodes are immutable, so identity is the
//                   cache key).
//   Review document every paragraph, in small batches, up to 100,000
//                   characters and 100 suggestions.
//
// It never changes the document on its own. apply/link run only from a
// click, as ordinary transactions, so undo takes them back.
// ---------------------------------------------------------------------------

import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { matchName } from "./entity-match";
import { linkSpan } from "./entity-match";
import { blockText, collectBlocks, spanToRange, type BlockText } from "./spans";
import {
  findIssue,
  listIssues,
  proofreadKey,
  proofreadPlugin,
  type PlacedIssue,
  type ProofIssue,
  type ProofMeta,
} from "./proofread-plugin";
import { SUGGEST_INSERT_AFTER, SUGGEST_REMOVE, type FromWorker, type ToWorker, type WireLint } from "./protocol";
import type { WorldLexicon } from "@/lib/writing/lexicon";

export const PAUSE_MS = 1200;
export const REVIEW_MAX_CHARS = 100_000;
export const REVIEW_MAX_ISSUES = 100;
const BATCH_CHARS = 6000;
const BATCH_BLOCKS = 24;

export type EnginePhase = "loading" | "ready" | "checking" | "failed";

export interface EngineUpdate {
  phase?: EnginePhase;
  issues?: ProofIssue[];
  note?: string;
  picked?: string | null;
}

export interface EngineOptions {
  dialect: number;
  auto: boolean;
  lexicon: WorldLexicon | null;
  onUpdate(update: EngineUpdate): void;
}

export interface MentionAttrs {
  id: string;
  label: string;
  entityType: string;
  color: string | null;
}

interface Pending {
  kind: "paragraph" | "review";
  nodes: PMNode[];
}

interface ReviewJob {
  queue: Array<{ node: PMNode; text: string }>;
  total: number;
  done: number;
  found: number;
  limited: boolean;
  capped: boolean;
}

function plural(n: number, one: string): string {
  return `${n.toLocaleString()} ${one}${n === 1 ? "" : "S"}`;
}

/** Positions of the given textblock nodes in `doc`, by identity. */
function positionsOf(doc: PMNode, nodes: readonly PMNode[]): Map<PMNode, number> {
  const want = new Set(nodes);
  const out = new Map<PMNode, number>();
  doc.descendants((node, pos) => {
    if (out.size === want.size) return false;
    if (!node.isTextblock) return true;
    if (want.has(node)) out.set(node, pos);
    return false;
  });
  return out;
}

export class AssistantEngine {
  private editor: Editor | null = null;
  private worker: Worker | null = null;
  private workerReady = false;
  private dead = false;
  private sentConfig = "";
  private checked = new WeakSet<PMNode>();
  private ignored = new Set<string>();
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private review: ReviewJob | null = null;
  private detach: (() => void) | null = null;
  private dialect: number;
  private auto: boolean;
  private lexicon: WorldLexicon | null;
  private readonly onUpdate: (u: EngineUpdate) => void;

  constructor(options: EngineOptions) {
    this.dialect = options.dialect;
    this.auto = options.auto;
    this.lexicon = options.lexicon;
    this.onUpdate = options.onUpdate;
    this.startWorker();
  }

  // -- worker ---------------------------------------------------------------

  private startWorker(): void {
    try {
      const worker = new Worker(new URL("./harper.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<FromWorker>) => this.onMessage(e.data);
      worker.onerror = () => this.fail();
      worker.onmessageerror = () => this.fail();
      this.worker = worker;
      this.onUpdate({ phase: "loading", note: "LOADING CHECKER. ABOUT 20 MB, FIRST USE ONLY." });
      this.sendConfig();
    } catch {
      this.fail();
    }
  }

  private post(message: ToWorker): void {
    this.worker?.postMessage(message);
  }

  private sendConfig(): void {
    if (!this.worker) return;
    const signature = `${this.dialect}|${this.lexicon?.signature ?? ""}`;
    if (signature === this.sentConfig) return;
    this.sentConfig = signature;
    this.post({ type: "configure", dialect: this.dialect, words: this.lexicon?.words ?? [] });
  }

  /** The checker could not load or crashed: stop cleanly, leave the editor alone. */
  private fail(): void {
    if (this.dead) return;
    this.dead = true;
    this.stopWork();
    this.unbind();
    this.worker?.terminate();
    this.worker = null;
    this.onUpdate({
      phase: "failed",
      issues: [],
      note: "CHECKER DID NOT LOAD. THE EDITOR IS UNAFFECTED.",
    });
  }

  private onMessage(message: FromWorker): void {
    if (this.dead) return;
    if (message.type === "ready") {
      if (!this.workerReady) {
        this.workerReady = true;
        this.onUpdate({ phase: "ready", note: "CHECKER READY. ON THIS DEVICE." });
        this.schedule(200);
      }
      return;
    }
    if (message.type === "error") {
      if (message.fatal) {
        this.fail();
        return;
      }
      if (message.id !== undefined) this.pending.delete(message.id);
      this.review = null;
      this.onUpdate({ phase: "ready", note: "// CHECK DID NOT COMPLETE. TRY AGAIN." });
      return;
    }
    this.onResult(message.id, message.blocks, message.capped);
  }

  // -- editor binding -------------------------------------------------------

  /** Follow the Manuscript's open editor. Safe to call often. */
  syncEditor(editor: Editor | null): void {
    if (this.dead) return;
    const next = editor && !editor.isDestroyed ? editor : null;
    if (next === this.editor) return;
    this.stopWork();
    this.unbind();
    this.onUpdate({ issues: [], picked: null });
    if (!next) return;
    this.bind(next);
  }

  private bind(editor: Editor): void {
    try {
      editor.registerPlugin(
        proofreadPlugin({
          onChange: (state) => this.onUpdate({ issues: listIssues(state).map(strip) }),
          onPick: (id) => this.onUpdate({ picked: id }),
        }),
      );
    } catch {
      // An editor that refuses a plugin keeps working without underlines.
      return;
    }
    const onEdit = () => this.schedule();
    const onDestroy = () => {
      if (this.editor === editor) {
        this.stopWork();
        this.editor = null;
        this.detach = null;
        this.onUpdate({ issues: [], picked: null });
      }
    };
    editor.on("update", onEdit);
    editor.on("selectionUpdate", onEdit);
    editor.on("destroy", onDestroy);
    this.editor = editor;
    this.detach = () => {
      editor.off("update", onEdit);
      editor.off("selectionUpdate", onEdit);
      editor.off("destroy", onDestroy);
      if (!editor.isDestroyed) {
        try {
          editor.unregisterPlugin(proofreadKey);
        } catch {
          /* the editor went away between the check and the call */
        }
      }
    };
    this.schedule();
  }

  private unbind(): void {
    this.detach?.();
    this.detach = null;
    this.editor = null;
  }

  private stopWork(): void {
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
    this.pending.clear();
    this.review = null;
  }

  private live(): Editor | null {
    return this.editor && !this.editor.isDestroyed ? this.editor : null;
  }

  private dispatch(meta: ProofMeta | ProofMeta[]): void {
    const editor = this.live();
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta(proofreadKey, meta).setMeta("addToHistory", false));
  }

  // -- settings -------------------------------------------------------------

  configure(next: { dialect: number; auto: boolean }): void {
    const dialectChanged = next.dialect !== this.dialect;
    this.dialect = next.dialect;
    this.auto = next.auto;
    if (dialectChanged) {
      this.checked = new WeakSet();
      this.sendConfig();
      this.dispatch({ type: "clear" });
    }
    if (this.auto) this.schedule();
    else if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  /** The world's dictionary changed (a Codex rename, a new term). */
  setLexicon(lexicon: WorldLexicon | null): void {
    const before = this.lexicon?.signature;
    this.lexicon = lexicon;
    if (lexicon?.signature === before) {
      // Same words; the names may still carry new entity ids.
      this.rematch();
      return;
    }
    this.checked = new WeakSet();
    this.sendConfig();
    this.rematch();
  }

  /** Drop flags the lexicon now accepts and refresh every "Did you mean". */
  private rematch(): void {
    const editor = this.live();
    if (!editor) return;
    const current = listIssues(editor.state);
    if (current.length === 0) return;
    const next: PlacedIssue[] = [];
    let changed = false;
    for (const issue of current) {
      if (issue.spelling && this.lexicon?.accepts(issue.problem)) {
        changed = true;
        continue;
      }
      const match = issue.spelling ? this.matchFor(issue.problem) : undefined;
      if (JSON.stringify(match) !== JSON.stringify(issue.match)) changed = true;
      next.push({ ...issue, match });
    }
    if (changed) this.dispatch({ type: "replaceAll", issues: next });
  }

  private matchFor(problem: string): ProofIssue["match"] {
    if (!this.lexicon) return undefined;
    const m = matchName(problem, this.lexicon.names);
    if (!m) return undefined;
    return { name: m.name.name, entityId: m.name.entityId, kind: m.kind, replacement: m.replacement };
  }

  // -- checks ---------------------------------------------------------------

  private schedule(delay = PAUSE_MS): void {
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
    if (!this.auto || this.dead) return;
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      this.checkParagraph(false);
    }, delay);
  }

  /** Check the paragraph the caret is in. `force` re-checks one already seen. */
  checkParagraph(force = true): void {
    const editor = this.live();
    if (!editor || !this.workerReady || this.review) return;
    const { $from } = editor.state.selection;
    const node = $from.parent;
    if (!node.isTextblock || $from.depth === 0 || node.type.name === "codeBlock") return;
    if (!force && this.checked.has(node)) return;
    if (editor.view.composing) {
      this.schedule();
      return;
    }
    const pos = $from.before();
    const block = blockText(node, pos);
    if (!block.text.trim()) {
      this.checked.add(node);
      this.dispatch({ type: "replaceRange", from: pos, to: pos + node.nodeSize, issues: [] });
      return;
    }
    const id = this.nextId++;
    this.pending.set(id, { kind: "paragraph", nodes: [node] });
    this.onUpdate({ phase: "checking", note: "CHECKING PARAGRAPH." });
    this.post({ type: "lint", id, blocks: [{ key: 0, text: block.text }], max: REVIEW_MAX_ISSUES });
  }

  /** Review the whole document, bounded. */
  reviewDocument(): void {
    const editor = this.live();
    if (!editor || !this.workerReady) return;
    this.stopWork();
    const { blocks, limited } = collectBlocks(editor.state.doc, REVIEW_MAX_CHARS);
    this.dispatch({ type: "clear" });
    if (blocks.length === 0) {
      this.onUpdate({ phase: "ready", note: "NOTHING TO REVIEW." });
      return;
    }
    this.review = {
      queue: blocks.map((b) => ({ node: b.node, text: b.block.text })),
      total: blocks.length,
      done: 0,
      found: 0,
      limited,
      capped: false,
    };
    this.onUpdate({ phase: "checking", note: "REVIEWING DOCUMENT. 0%." });
    this.nextBatch();
  }

  private nextBatch(): void {
    const job = this.review;
    if (!job) return;
    if (job.queue.length === 0 || job.found >= REVIEW_MAX_ISSUES) {
      if (job.queue.length > 0) job.capped = true;
      this.review = null;
      const parts = [`REVIEW COMPLETE. ${plural(job.found, "SUGGESTION")}.`];
      if (job.capped) parts.push(`FIRST ${REVIEW_MAX_ISSUES} SHOWN.`);
      if (job.limited) parts.push("FIRST 100,000 CHARACTERS CHECKED. USE PARAGRAPH CHECKS BEYOND THAT.");
      this.onUpdate({ phase: "ready", note: parts.join(" ") });
      return;
    }
    const batch: Array<{ node: PMNode; text: string }> = [];
    let chars = 0;
    while (job.queue.length && batch.length < BATCH_BLOCKS && (batch.length === 0 || chars < BATCH_CHARS)) {
      const next = job.queue.shift() as { node: PMNode; text: string };
      batch.push(next);
      chars += next.text.length;
    }
    const id = this.nextId++;
    this.pending.set(id, { kind: "review", nodes: batch.map((b) => b.node) });
    this.post({
      type: "lint",
      id,
      blocks: batch.map((b, key) => ({ key, text: b.text })),
      max: REVIEW_MAX_ISSUES - job.found,
    });
  }

  private onResult(id: number, blocks: Array<{ key: number; lints: WireLint[] }>, capped: boolean): void {
    const request = this.pending.get(id);
    this.pending.delete(id);
    const editor = this.live();
    if (!request || !editor) return;
    if (editor.view.composing) {
      // Mid-composition (an IME): redrawing under the caret can break it.
      // The paragraph is checked again at the next pause.
      if (request.kind === "review") this.review = null;
      this.onUpdate({ phase: "ready" });
      this.schedule();
      return;
    }
    const where = positionsOf(editor.state.doc, request.nodes);
    const metas: ProofMeta[] = [];
    let found = 0;
    for (const result of blocks) {
      const node = request.nodes[result.key];
      const pos = node ? where.get(node) : undefined;
      // The paragraph was edited while the checker worked: its answer is
      // about text that no longer exists. The next pause re-checks it.
      if (!node || pos === undefined) continue;
      const block = blockText(node, pos);
      const issues = this.place(block, result.lints, `${id}.${result.key}`);
      found += issues.length;
      this.checked.add(node);
      metas.push({ type: "replaceRange", from: pos, to: pos + node.nodeSize, issues });
    }
    if (metas.length) this.dispatch(metas);

    if (request.kind === "review" && this.review) {
      this.review.done += request.nodes.length;
      this.review.found += found;
      this.review.capped = this.review.capped || capped;
      const pct = Math.round((this.review.done / this.review.total) * 100);
      this.onUpdate({ note: `REVIEWING DOCUMENT. ${pct}%.` });
      this.nextBatch();
      return;
    }
    if (request.kind === "paragraph") {
      this.onUpdate({
        phase: "ready",
        note: found ? `PARAGRAPH CHECKED. ${plural(found, "SUGGESTION")}.` : "PARAGRAPH CHECKED. CLEAR.",
      });
    }
  }

  private place(block: BlockText, lints: readonly WireLint[], prefix: string): PlacedIssue[] {
    const out: PlacedIssue[] = [];
    lints.forEach((lint, n) => {
      const spelling = lint.kind === "Spelling";
      if (spelling && this.lexicon?.accepts(lint.problem)) return;
      const range = spanToRange(block, lint.start, lint.end);
      if (!range) return;
      const key = `${lint.kind}|${lint.problem}|${lint.message}|${block.text.slice(Math.max(0, lint.start - 10), lint.start)}|${block.text.slice(lint.end, lint.end + 10)}`;
      if (this.ignored.has(key)) return;
      const before = block.text.slice(0, lint.start).trimEnd();
      out.push({
        id: `${prefix}.${n}`,
        from: range.from,
        to: range.to,
        problem: lint.problem,
        message: lint.message,
        kind: lint.kind,
        key,
        spelling,
        sentenceStart: before === "" || /[.!?:\n"“‘(]$/.test(before),
        suggestions: lint.suggestions,
        match: spelling ? this.matchFor(lint.problem) : undefined,
      });
    });
    return out;
  }

  // -- the writer's clicks --------------------------------------------------

  /** The issue as it stands now, or null when its text has changed under it. */
  private current(id: string): { editor: Editor; issue: PlacedIssue } | null {
    const editor = this.live();
    if (!editor) return null;
    const issue = findIssue(editor.state, id);
    if (!issue) return null;
    if (editor.state.doc.textBetween(issue.from, issue.to, "\n", "\n") !== issue.problem) {
      this.dispatch({ type: "remove", ids: [id] });
      return null;
    }
    return { editor, issue };
  }

  /** Apply one of the checker's suggestions. One transaction; undo reverses it. */
  apply(id: string, index: number): void {
    const hit = this.current(id);
    const suggestion = hit?.issue.suggestions[index];
    if (!hit || !suggestion) return;
    const { from, to } = hit.issue;
    hit.editor
      .chain()
      .focus()
      .command(({ tr }) => {
        if (suggestion.kind === SUGGEST_INSERT_AFTER) tr.insertText(suggestion.text, to);
        else if (suggestion.kind === SUGGEST_REMOVE || !suggestion.text) tr.delete(from, to);
        else tr.insertText(suggestion.text, from, to);
        tr.scrollIntoView();
        return true;
      })
      .run();
  }

  /** "Did you mean": replace the flagged word with the world's spelling. */
  replaceWith(id: string, text: string): void {
    const hit = this.current(id);
    if (!hit || !text) return;
    const { from, to } = hit.issue;
    hit.editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(text, from, to).scrollIntoView();
        return true;
      })
      .run();
  }

  canLink(): boolean {
    return !!this.live()?.schema.nodes.entityMention;
  }

  /** "Link to <Entity>": the flagged name becomes the entity's mention chip. */
  link(id: string, attrs: MentionAttrs): void {
    const hit = this.current(id);
    if (!hit || !this.canLink()) return;
    const { editor, issue } = hit;
    let range = { from: issue.from, to: issue.to };
    const $from = editor.state.doc.resolve(issue.from);
    if ($from.parent.isTextblock && $from.depth > 0) {
      const block = blockText($from.parent, $from.before());
      const start = block.map.indexOf(issue.from);
      if (start >= 0) {
        const grown = linkSpan(block.text, start, start + (issue.to - issue.from), attrs.label);
        range = spanToRange(block, grown.start, grown.end) ?? range;
      }
    }
    editor.chain().focus().insertContentAt(range, { type: "entityMention", attrs }).run();
  }

  /** Ignore this occurrence for the rest of the session. */
  ignore(id: string): void {
    const editor = this.live();
    const issue = editor ? findIssue(editor.state, id) : null;
    if (!issue) return;
    this.ignored.add(issue.key);
    this.dispatch({ type: "remove", ids: [id] });
  }

  /** Show an issue in the prose: select it and scroll to it. No edit. */
  reveal(id: string): void {
    const editor = this.live();
    const issue = editor ? findIssue(editor.state, id) : null;
    if (!editor || !issue) return;
    editor.chain().setTextSelection({ from: issue.from, to: issue.to }).scrollIntoView().run();
  }

  dispose(): void {
    this.dead = true;
    this.stopWork();
    this.unbind();
    this.worker?.terminate();
    this.worker = null;
  }
}

function strip(issue: PlacedIssue): ProofIssue {
  const { from: _from, to: _to, ...rest } = issue;
  return rest;
}
