// ---------------------------------------------------------------------------
// useCanonCapture, Canon Capture and the Contradiction Ledger in the Studio
// (Studio Charter §2.2, §2.3; Constitution Law IV).
//
// Never on the typing path:
//   - the open document is re-read 1200ms after the last edit, in idle time,
//     in slices that yield back to the browser (detect.ts caches per
//     paragraph, so a keystroke re-reads one paragraph);
//   - every other document in the binder is read from the binder's own copy,
//     in the same idle slices, only when its content, the world or the
//     writer's resolutions change.
// It never edits prose. Locating a claim moves the selection, nothing else.
// ---------------------------------------------------------------------------

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { readDocMeta } from "@/lib/document-meta";
import {
  bindAll,
  buildBindContext,
  buildCaptureItems,
  createCaptureCache,
  indexFactsByPredicate,
  locateInParagraphs,
  paragraphsFromDoc,
  paragraphsFromHtml,
  type BindContext,
  type CaptureItem,
  type CaptureResolutions,
  type FactIndex,
  type LedgerFact,
  type LiveParagraph,
  type Paragraph,
  type PMDocLike,
  type RawClaim,
  type SceneBinding,
} from "@/lib/writing/capture";
import { detectParagraph, paragraphSignature, type CaptureCache } from "@/lib/writing/capture/detect";

/** One cache for the session: paragraphs are paragraphs, whichever document. */
const CACHE: CaptureCache = createCaptureCache();

const DEBOUNCE_MS = 1200;
/** Stop a slice when the idle deadline has less than this left. */
const SLICE_RESERVE_MS = 2;

interface IdleDeadlineLike {
  timeRemaining(): number;
}

function onIdle(fn: (d: IdleDeadlineLike) => void): () => void {
  const w = typeof window !== "undefined" ? (window as Window & typeof globalThis) : null;
  if (w && typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout: 2000 });
    return () => w.cancelIdleCallback(id);
  }
  const t = setTimeout(() => {
    const start = Date.now();
    fn({ timeRemaining: () => Math.max(0, 12 - (Date.now() - start)) });
  }, 16);
  return () => clearTimeout(t);
}

/**
 * Detect claims for many paragraphs in idle slices. Calls done with the raw
 * claims per paragraph once every paragraph is read. Returns a cancel.
 */
function detectSliced(paragraphs: readonly Paragraph[], done: (raw: RawClaim[][]) => void): () => void {
  const raw: RawClaim[][] = new Array(paragraphs.length);
  let i = 0;
  let cancel: () => void = () => undefined;
  const step = (d: IdleDeadlineLike) => {
    while (i < paragraphs.length) {
      const p = paragraphs[i];
      const sig = paragraphSignature(p);
      let hit = CACHE.get(sig);
      if (!hit) {
        if (d.timeRemaining() < SLICE_RESERVE_MS) break;
        hit = detectParagraph(p);
        CACHE.set(sig, hit);
      }
      raw[i++] = hit;
    }
    if (i < paragraphs.length) cancel = onIdle(step);
    else done(raw);
  };
  cancel = onIdle(step);
  return () => cancel();
}

export interface CaptureDoc {
  id: string;
  title: string;
  entry_type: string;
  content: string | null;
  metadata?: unknown;
}

export interface CaptureWorld {
  loading: boolean;
  facts: readonly LedgerFact[];
  entities: ReadonlyArray<{ id: string; entity_type: string }>;
}

export interface LocateTarget {
  paragraphIndex: number;
  start: number;
  end: number;
  match: string;
}

export interface CanonCaptureResult {
  /** The open document's items, from the live editor. */
  items: CaptureItem[];
  /** The open document's paragraphs, as last read (for gutter markers). */
  paragraphs: LiveParagraph[];
  /** Every other document's items, by document id. */
  elsewhere: ReadonlyMap<string, CaptureItem[]>;
  /** World-level contradiction count (open document live + the rest). */
  worldContradictions: number;
  /** Select a claim's words in the open editor. False when it is gone. */
  locate(target: LocateTarget): boolean;
  /** Open another document, then select the words once it is mounted. */
  locateIn(docId: string, target: LocateTarget): void;
}

export interface CanonCaptureInput {
  editor: Editor | null;
  /** The document the editor is mounted on. */
  editorDocId: string | null;
  docId: string | undefined;
  docs: readonly CaptureDoc[] | undefined;
  world: CaptureWorld | null;
  /** The open document's scene (Card fields, resolved setting body). */
  scene: SceneBinding;
  resolutions: CaptureResolutions | undefined;
  openDoc: (id: string) => void;
}

export function locateInEditor(editor: Editor, target: LocateTarget): boolean {
  if (editor.isDestroyed) return false;
  const paragraphs = paragraphsFromDoc(editor.state.doc as unknown as PMDocLike);
  const r = locateInParagraphs(paragraphs, target);
  if (!r) return false;
  editor.chain().focus().setTextSelection({ from: r.from, to: r.to }).scrollIntoView().run();
  return true;
}

const EMPTY_RES: CaptureResolutions = {};

export function useCanonCapture(input: CanonCaptureInput): CanonCaptureResult {
  const { editor, editorDocId, docId, world, scene, openDoc } = input;
  const resolutions = input.resolutions ?? EMPTY_RES;
  const ready = !!world && !world.loading;

  // World-derived lookups: rebuilt when the world changes, never per keystroke.
  const index = useMemo<FactIndex>(() => indexFactsByPredicate(world?.facts ?? []), [world?.facts]);
  const entities = world?.entities;
  const { subjectEntityId, settingBodyId, setInPlaceId, povEntityId } = scene;
  const openCtx = useMemo<BindContext>(
    () => buildBindContext(entities ?? [], { subjectEntityId, settingBodyId, setInPlaceId, povEntityId }),
    [entities, subjectEntityId, settingBodyId, setInPlaceId, povEntityId],
  );

  // ---- the open document, live -------------------------------------------
  const [live, setLive] = useState<{ docId: string; paragraphs: LiveParagraph[]; raw: RawClaim[][] } | null>(null);
  const liveEditor = editor && editorDocId && editorDocId === docId ? editor : null;

  useEffect(() => {
    if (!liveEditor || !editorDocId) return;
    let cancelSlice: () => void = () => undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const read = () => {
      cancelSlice();
      if (liveEditor.isDestroyed) return;
      const paragraphs = paragraphsFromDoc(liveEditor.state.doc as unknown as PMDocLike);
      cancelSlice = detectSliced(paragraphs, (raw) => setLive({ docId: editorDocId, paragraphs, raw }));
    };
    const onUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(read, DEBOUNCE_MS);
    };
    // First read on mount, in idle time.
    read();
    liveEditor.on("update", onUpdate);
    return () => {
      liveEditor.off("update", onUpdate);
      if (timer) clearTimeout(timer);
      cancelSlice();
    };
  }, [liveEditor, editorDocId]);

  const liveCurrent = live && live.docId === docId ? live : null;
  const items = useMemo<CaptureItem[]>(() => {
    if (!ready || !liveCurrent || !docId) return [];
    return buildCaptureItems(docId, bindAll(liveCurrent.paragraphs, liveCurrent.raw, openCtx), index, resolutions);
  }, [ready, liveCurrent, docId, openCtx, index, resolutions]);

  // ---- every other document ----------------------------------------------
  const deferredDocs = useDeferredValue(input.docs);
  const [elsewhere, setElsewhere] = useState<ReadonlyMap<string, CaptureItem[]>>(new Map());
  useEffect(() => {
    if (!ready || !deferredDocs) {
      setElsewhere(new Map());
      return;
    }
    const others = deferredDocs.filter((d) => d.entry_type !== "folder" && d.id !== docId && !!d.content);
    const prepared = others.map((d) => {
      const meta = readDocMeta(d.metadata);
      const ctx = buildBindContext(entities ?? [], {
        subjectEntityId: meta.subjectEntityId || null,
        setInPlaceId: meta.setInPlaceId || null,
        povEntityId: meta.povEntityId || null,
      });
      return { doc: d, meta, ctx, paragraphs: paragraphsFromHtml(d.content) };
    });
    const all: Paragraph[] = prepared.flatMap((p) => p.paragraphs);
    return detectSliced(all, (raw) => {
      const out = new Map<string, CaptureItem[]>();
      let at = 0;
      for (const p of prepared) {
        const mine = raw.slice(at, at + p.paragraphs.length);
        at += p.paragraphs.length;
        const found = buildCaptureItems(
          p.doc.id,
          bindAll(p.paragraphs, mine, p.ctx),
          index,
          p.meta.captureResolutions ?? EMPTY_RES,
        );
        if (found.length) out.set(p.doc.id, found);
      }
      setElsewhere(out);
    });
  }, [ready, deferredDocs, docId, entities, index]);

  const worldContradictions = useMemo(() => {
    let n = items.filter((i) => i.kind === "contradiction").length;
    for (const list of elsewhere.values()) n += list.filter((i) => i.kind === "contradiction").length;
    return n;
  }, [items, elsewhere]);

  // ---- locating -----------------------------------------------------------
  const locate = useCallback(
    (target: LocateTarget) => (liveEditor ? locateInEditor(liveEditor, target) : false),
    [liveEditor],
  );

  const pending = useRef<{ docId: string; target: LocateTarget } | null>(null);
  const [pendingTick, setPendingTick] = useState(0);
  const locateIn = useCallback(
    (id: string, target: LocateTarget) => {
      if (id === docId && liveEditor) {
        locateInEditor(liveEditor, target);
        return;
      }
      pending.current = { docId: id, target };
      setPendingTick((n) => n + 1);
      openDoc(id);
    },
    [docId, liveEditor, openDoc],
  );
  useEffect(() => {
    const p = pending.current;
    if (!p || !liveEditor || editorDocId !== p.docId) return;
    // After the editor's own first content sync, which resets the selection.
    const t = setTimeout(() => {
      pending.current = null;
      locateInEditor(liveEditor, p.target);
    }, 80);
    return () => clearTimeout(t);
  }, [liveEditor, editorDocId, pendingTick]);

  return {
    items,
    paragraphs: liveCurrent?.paragraphs ?? [],
    elsewhere,
    worldContradictions,
    locate,
    locateIn,
  };
}
