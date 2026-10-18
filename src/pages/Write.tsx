/**
 * /write/:docId — the ONE writing surface (Studio editor).
 * Operates on world_entries documents (the manuscript store), with the
 * full entity/reference tool in the inspector. Register: WRITER (Lora).
 * Supersedes the old /worlds/:id/write "Writing Space" (which now
 * redirects here). SF-II: one writing model, no parallel tables.
 */
import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { writingSurfaceStyle } from "@/lib/writing-surface-style";
import { TypographyMenu } from "@/components/writing/TypographyMenu";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { Wordmark } from "@/components/brand/Wordmark";
import { WritingEntityPanel } from "@/components/writing/WritingEntityPanel";
import { WorldInfluencePanel } from "@/components/writing/WorldInfluencePanel";
import { WorldRefsPanel } from "@/components/writing/WorldRefsPanel";
import { InlineRefCards } from "@/components/writing/InlineRefCards";
import { StudioWorldProvider, useStudioWorldIndex, type StudioWorld } from "@/components/writing/studio-world";
import { DocumentInspector, type InspectorPane } from "@/components/writing/DocumentInspector";
import { BinderTree } from "@/components/writing/BinderTree";
import { SnapshotCompareDialog } from "@/components/writing/SnapshotCompareDialog";
import { LabelManagerDialog } from "@/components/writing/LabelManagerDialog";
// Import pulls in the readers (and, on use, jszip and mammoth): load on open.
const ImportManuscriptDialog = lazy(() => import("@/components/writing/ImportManuscriptDialog"));
import { ContradictionLedger } from "@/components/writing/ContradictionLedger";
import { CaptureGutter } from "@/components/writing/CaptureGutter";
import { useCanonCapture } from "@/hooks/use-canon-capture";
import { contradictionSummaryLine } from "@/lib/writing/capture/ledger";
import { FindReplaceBar } from "@/components/writing/FindReplaceBar";
import { Corkboard } from "@/components/writing/Corkboard";
import { Outliner } from "@/components/writing/Outliner";
import { Scrivenings } from "@/components/writing/Scrivenings";
import {
  SplitDivider,
  SplitPane,
  clampRatio,
  type SplitOrientation,
  type SplitSource,
} from "@/components/writing/SplitPane";
import {
  BinderSearchInput,
  BinderSearchResults,
  CollectionsSection,
  SelectionBar,
} from "@/components/writing/BinderSearch";
import { TargetsStatus } from "@/components/writing/TargetsPopover";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import type { Editor, JSONContent } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  compileManuscriptDocx,
  compileManuscriptMarkdown,
  compileManuscriptPlainText,
} from "@/lib/manuscript-compile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  useWritingDocuments, useCreateDocument, useUpdateDocumentContent,
  useCreateFolder, useRenameDocument, useReorderDocuments,
  useDeleteDocument, useTrashedDocuments, useRestoreDocument,
  usePurgeDocument, purgeExpiredTrash, useUpdateDocumentMeta, useMoveBinderItem,
  useRenameFolder, useDeleteFolder,
} from "@/hooks/use-writing-documents";
import { useDocumentVersions, type DocumentSnapshot } from "@/hooks/use-document-versions";
import { useWritingLabels } from "@/hooks/use-writing-labels";
import { Trash2, RotateCcw, X, ArrowLeft, Columns2, Check, AlertTriangle, WifiOff, LifeBuoy } from "lucide-react";
import { useWriteDoc, useLatestDoc, rollWordSession, countWords } from "@/hooks/use-write-doc";
import { useSessionTarget } from "@/hooks/use-session-target";
import { useWorldSetting } from "@/hooks/use-world-setting";
import { useTypewriterScroll } from "@/hooks/use-typewriter-scroll";
import { primeDocCaches } from "@/hooks/use-doc-autosave";
import { docsUnderFolder, inReadingOrder } from "@/lib/binder-tree";
import { useCanonChanges } from "@/hooks/use-canon-changes";
import { canonSummaryLine, pruneTree } from "@/lib/writing/canon-changes";
import { buildMatcher, type SearchHit, type SearchOptions } from "@/lib/binder-search";
import { selectMatch } from "@/lib/editor-text-map";
import {
  COLLECTIONS_KEY,
  newCollectionId,
  sanitizeCollections,
  type WritingCollection,
} from "@/lib/writing-collections";
import { PROJECT_KEY, sanitizeProjectTarget, type ProjectTarget } from "@/lib/writing-targets";
import { reportWordsWritten } from "@/lib/session-words-bus";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { useWritingPins } from "@/hooks/use-writing-pins";
import { readDocMeta } from "@/lib/document-meta";
import { ENTITY_TYPE_COLORS, type Entity } from "@/services/entity-graph-types";
import { getActiveEditor } from "@/lib/writing/live-facts";
import { factToRefAttrs, sourceLine, type WorldFact } from "@/lib/writing/world-index";
import { buildSceneContext } from "@/lib/writing/scene-context";
import { buildPlaceChoices, buildPovChoices, resolveSceneWorld } from "@/lib/writing/scene-world";
import type { PinnedItem } from "@/hooks/use-writing-pins";
import type { WorldEntry } from "@/services/world-data";
import { useMetaTags } from "@/hooks/use-meta-tags";
import {
  decideRecovery,
  deriveSaveState,
  deviceStorage,
  dropJournal,
  readJournal,
  retryDelay,
  settleJournal,
  writeJournal,
  type SaveState,
} from "@/lib/writing/save-journal";
import { exportAuthor } from "@/lib/writing/export-author";

/**
 * Words found in this device's journal for the open document (see
 * lib/writing/save-journal.ts). "recovered": already restored into the
 * editor, not yet saved. "older": the server copy moved on after they were
 * written, so they are only offered.
 */
interface RecoveryNotice {
  docId: string;
  kind: "recovered" | "older";
  journalHtml: string;
  /** The text the recovered words would replace (snapshotted before saving). */
  replacedHtml: string;
  /** replacedHtml is on file as a snapshot (once per notice). */
  replacedKept: boolean;
}

type WriteView = "editor" | "board" | "outline" | "scrivenings";

const VIEW_LABELS: Record<Exclude<WriteView, "scrivenings">, { label: string; hint: string }> = {
  editor: { label: "Editor", hint: "One document at a time" },
  board: { label: "Board", hint: "Index cards for every scene, to see the shape of the manuscript" },
  outline: { label: "Outline", hint: "The binder as a table: synopsis, label, status, words, targets" },
};

interface SplitState {
  open: boolean;
  orientation: SplitOrientation;
  ratio: number;
  source: SplitSource | null;
}

const DEFAULT_SPLIT: SplitState = { open: false, orientation: "side", ratio: 0.5, source: null };

function readSplit(worldId: string): SplitState {
  try {
    const raw = JSON.parse(localStorage.getItem(`sf-write-split:${worldId}`) ?? "null") as Partial<SplitState> | null;
    if (!raw || typeof raw !== "object") return DEFAULT_SPLIT;
    const src = raw.source;
    const source =
      src && typeof src === "object" && typeof src.id === "string" &&
      (src.kind === "doc" || src.kind === "entity" || src.kind === "worksheet")
        ? (src as SplitSource)
        : null;
    return {
      open: raw.open === true,
      orientation: raw.orientation === "stacked" ? "stacked" : "side",
      ratio: clampRatio(typeof raw.ratio === "number" ? raw.ratio : 0.5),
      source,
    };
  } catch {
    return DEFAULT_SPLIT;
  }
}

function writeSplit(worldId: string, s: SplitState): void {
  try {
    localStorage.setItem(`sf-write-split:${worldId}`, JSON.stringify(s));
  } catch {
    /* no storage */
  }
}

export default function Write(): JSX.Element {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const { data: doc, isLoading: docLoading, isFetching: docFetching } = useWriteDoc(docId);
  // Sticky while the next document loads, so a click in the binder does not
  // blank the binder, the split pane and Scrivenings for a round-trip.
  const lastWorldId = useRef<string | undefined>(undefined);
  if (doc?.world_id) lastWorldId.current = doc.world_id;
  const worldId = doc?.world_id ?? (docLoading ? lastWorldId.current : undefined);

  // `data` excludes folders by design, so folders/unfiledDocs must come from
  // the hook too. Re-deriving folders from `data` (as this once did) always
  // yielded an empty list, which made the folder UI dead code.
  const {
    data: entries,
    folders: folderRows,
    unfiledDocs,
    tree: binderTree,
    entries: binderEntries,
    orderedDocs,
  } = useWritingDocuments(worldId);
  // Every document in binder reading order: Scrivenings, search, the split
  // pane's picker and collections all walk this.
  const readingDocs = useMemo(() => orderedDocs.map((o) => o.doc), [orderedDocs]);
  const qc = useQueryClient();
  // Failures show in the footer (UNSAVED, RETRYING) and one toast per run.
  const updateContent = useUpdateDocumentContent(worldId, { silentErrors: true });
  // The mutation result is a new object every render; its mutateAsync is the
  // observer's bound method and stable. flushPending depends on this, not the
  // object, so its identity (and the flush-on-leave cleanup keyed on it) does
  // not churn on every render and fire saves, or retries, ahead of the
  // debounce and the backoff.
  const saveContent = updateContent.mutateAsync;
  const createDoc = useCreateDocument(worldId);
  const createFolder = useCreateFolder(worldId);
  const reorderDocs = useReorderDocuments(worldId);
  const trashDoc = useDeleteDocument(worldId);
  const restoreDoc = useRestoreDocument(worldId);
  const purgeDoc = usePurgeDocument(worldId);
  const { data: trashed } = useTrashedDocuments(worldId);
  const renameDoc = useRenameDocument(worldId);
  const renameFolder = useRenameFolder(worldId);
  const deleteFolder = useDeleteFolder(worldId);
  const updateMeta = useUpdateDocumentMeta(worldId);
  const { pins, addPin, removePin } = useWritingPins(worldId ?? "");
  const moveItem = useMoveBinderItem(worldId);
  const {
    labels,
    isLocal: labelsLocal,
    saveLabels,
    isSaving: labelsSaving,
  } = useWritingLabels(worldId);
  const [labelsOpen, setLabelsOpen] = useState(false);
  // IMPORT: binder action, the fresh-world prompt, and /write/:id?import=1
  // (the Studio's "Bring a manuscript" link lands here).
  const [importOpen, setImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("import") === "1") {
      setImportOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("import");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Snapshots. The hook's content argument is the last SAVED text (auto
  // snapshots every 5 minutes use it); manual snapshots and restores pass the
  // live editor HTML explicitly.
  const {
    snapshots,
    loading: snapshotsLoading,
    usingFallback: snapshotsLocal,
    createSnapshot,
    restoreVersion,
    deleteSnapshot,
  } = useDocumentVersions(doc?.id ?? null, doc?.title ?? "", doc?.content ?? "");
  const [comparing, setComparing] = useState<DocumentSnapshot | null>(null);
  const [docPane, setDocPane] = useState<InspectorPane>("card");

  const [focus, setFocus] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  // Editor (one document), Board (index cards), Outline (table) or
  // Scrivenings (several documents as one text). Editor/Board/Outline persist
  // because a writer restructuring an act stays there across reloads;
  // Scrivenings needs a selection, so a reload returns to the editor.
  const [view, setViewState] = useState<WriteView>(() => {
    try {
      const v = localStorage.getItem("sf-write-view");
      return v === "board" || v === "outline" ? v : "editor";
    } catch {
      return "editor";
    }
  });
  useEffect(() => {
    try { localStorage.setItem("sf-write-view", view === "scrivenings" ? "editor" : view); } catch { /* no storage */ }
  }, [view]);
  const [scriv, setScriv] = useState<{ ids: string[]; title: string } | null>(null);
  const effectiveView: WriteView = view === "scrivenings" && !scriv ? "editor" : view;

  // The main editor, with the document it was mounted for. The pair matters:
  // for one render after a navigation the old instance is still on hand, and
  // a search jump must never select text in the wrong document.
  const docIdRef = useRef(docId);
  docIdRef.current = docId;
  const [editorState, setEditorState] = useState<{ editor: Editor; docId: string } | null>(null);
  const onEditorReady = useCallback(
    (ed: Editor | null) => setEditorState(ed ? { editor: ed, docId: docIdRef.current ?? "" } : null),
    [],
  );
  const editorInstance = editorState?.editor ?? null;

  // Binder multi-selection, binder search, collections.
  const [selection, setSelection] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpts, setSearchOpts] = useState<SearchOptions>({ regex: false, caseSensitive: false });
  const searchRef = useRef<HTMLInputElement>(null);
  const [jump, setJump] = useState<{ docId: string; hit: SearchHit; query: string; opts: SearchOptions } | null>(null);
  const collections = useWorldSetting<WritingCollection[]>(
    worldId,
    COLLECTIONS_KEY,
    sanitizeCollections,
    "COLLECTION NOT SAVED.",
  );
  const [collectPrompt, setCollectPrompt] = useState<
    null | { kind: "search" } | { kind: "manual"; ids: string[] }
  >(null);
  useEffect(() => {
    setSelection([]);
    setScriv(null);
  }, [worldId]);

  // Targets: session (the daily goal, unified) and project (on the world).
  const session = useSessionTarget();
  const refreshToday = session.refreshToday;
  const project = useWorldSetting<ProjectTarget>(worldId, PROJECT_KEY, sanitizeProjectTarget, "TARGET NOT SAVED.");

  // Split editor: per world, per browser.
  const [split, setSplit] = useState<SplitState>(DEFAULT_SPLIT);
  useEffect(() => {
    if (!worldId) return;
    setSplit(readSplit(worldId));
  }, [worldId]);
  const updateSplit = useCallback(
    (patch: Partial<SplitState>) =>
      setSplit((prev) => {
        const next = { ...prev, ...patch };
        if (worldId) writeSplit(worldId, next);
        return next;
      }),
    [worldId],
  );
  const mainRef = useRef<HTMLElement>(null);
  const splitScrollRef = useRef<HTMLDivElement>(null);
  const splitBoxRef = useRef<HTMLDivElement>(null);
  const [inspector, setInspector] = useState<"doc" | "entities" | "world" | "reference" | "continuity">("doc");
  const [mobilePanel, setMobilePanel] = useState<"binder" | "inspector" | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [words, setWords] = useState(0);
  const lastCount = useRef<number | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<{ docId: string; html: string; words: number } | null>(null);
  const lastSent = useRef<{ docId: string; html: string } | null>(null);

  // SAVE SAFETY -------------------------------------------------------------
  // Words the editor holds that its 1.5s debounce has not handed over yet.
  const editorUnsent = useRef(false);
  // Words anywhere between the keyboard and a confirmed save, for the footer.
  const [dirty, setDirty] = useState(false);
  const inFlight = useRef(0);
  // Consecutive failed saves (retry backoff), and the timer for the next.
  const failures = useRef(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  // The server updated_at each document's edits sit on (journal base).
  const serverBase = useRef(new Map<string, string | null>());
  const journalTimer = useRef<ReturnType<typeof setTimeout>>();
  const [recovery, setRecovery] = useState<RecoveryNotice | null>(null);
  const recoveryRef = useRef<RecoveryNotice | null>(null);
  recoveryRef.current = recovery;
  const recoveryChecked = useRef<string | null>(null);

  useEffect(() => {
    if (doc) {
      serverBase.current.set(doc.id, doc.updated_at ?? null);
      setTitle(doc.title ?? "");
      const w = countWords(doc.content);
      setWords(w);
      lastCount.current = w;
    }
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live title: follows the open document. Renders "<doc> | StellarForge".
  useMetaTags({ title: doc?.title || "Write" });

  // "Saved · Ns ago" was computed during render with nothing scheduling a
  // re-render, so it froze at the first value and still read "1s ago" an hour
  // later. A ticker keeps it honest.
  const [savedAgo, setSavedAgo] = useState("just now");
  useEffect(() => {
    if (!savedAt) return;
    const tick = () => {
      const s = Math.round((Date.now() - savedAt.getTime()) / 1000);
      setSavedAgo(
        s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`,
      );
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [savedAt]);

  // Auto-purge trash older than 90 days (idempotent, fire-and-forget)
  useEffect(() => {
    if (worldId) purgeExpiredTrash(worldId).catch(() => {});
  }, [worldId]);

  // Binder groups come straight from the hook, which already nests each
  // folder's documents and collects the unfiled ones.
  //
  // Memoised because `?? []` mints a new array identity on every render, which
  // would invalidate chapterList (and anything else keyed on them) each time.
  const folders = useMemo(() => folderRows ?? [], [folderRows]);
  const unfiled = useMemo(() => unfiledDocs ?? [], [unfiledDocs]);

  // Every keyword used anywhere in this manuscript, for the inspector's
  // keyword suggestions.
  const keywordSuggestions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries ?? []) {
      for (const k of readDocMeta(e.metadata).keywords) {
        if (!seen.has(k.toLowerCase())) seen.set(k.toLowerCase(), k);
      }
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const { preferences, updatePreferences } = useWritingPreferences();

  // Spacing, font and column width, as CSS custom properties. They are read
  // by `.sf-writing-serif .ProseMirror` rather than inherited: a declaration
  // on .ProseMirror beats a value inherited from a wrapper, which is why the
  // previous `style={{ lineHeight, fontFamily }}` here never took effect.
  const editorStyle = useMemo(
    () => writingSurfaceStyle(preferences) as CSSProperties,
    [preferences],
  );

  // Whole-manuscript words for the project target: every document's saved
  // count, with the open one's live count in its place.
  const manuscriptWords = useMemo(() => {
    let n = 0;
    for (const d of readingDocs) n += d.id === docId ? words : countWords(d.content);
    return n;
  }, [readingDocs, docId, words]);

  const typewriterMain = preferences.typewriter && (effectiveView === "editor" || effectiveView === "scrivenings");
  const showSplit = split.open && !focus && !!worldId;
  useTypewriterScroll(mainRef, typewriterMain);
  useTypewriterScroll(splitScrollRef, preferences.typewriter && showSplit);
  const fadeClass = preferences.fadeOthers ? " sf-fade-others" : "";

  // Card fields for the open document. metadata is untyped, so this tolerates
  // whatever is already in the column.
  const docMeta = useMemo(() => readDocMeta(doc?.metadata), [doc?.metadata]);

  // THE WORLD IN THE ROOM ----------------------------------------------------
  // One index of every fact and entity on file, shared by the rail, the
  // world palette in every editor, and the hover cards. Rebuilt when data
  // changes, never per keystroke.
  const worldIndex = useStudioWorldIndex(worldId);

  // CANON CHANGED (charter 2.5) ----------------------------------------------
  // Documents citing a value or a name the world has since moved past. Read
  // off the binder's own content and the index above; no fetch of its own.
  const canon = useCanonChanges(binderEntries, worldIndex);
  const canonAffected = canon.affected.size;
  const [canonFilter, setCanonFilter] = useState(false);
  useEffect(() => {
    if (canonAffected === 0) setCanonFilter(false);
  }, [canonAffected]);
  useEffect(() => setCanonFilter(false), [worldId]);
  const shownTree = useMemo(
    () => (canonFilter ? pruneTree(binderTree, canon.affected) : binderTree),
    [canonFilter, binderTree, canon.affected],
  );

  // The scene as the rail ranks it: the prose as last handed to the binder
  // cache (the editor's own 1.5s debounce), deferred so ranking yields to
  // typing.
  const sceneHtml = useMemo(
    () => readingDocs.find((d) => d.id === docId)?.content ?? doc?.content ?? "",
    [readingDocs, docId, doc?.content],
  );
  const deferredSceneHtml = useDeferredValue(sceneHtml);
  const sceneWorld = useMemo(
    () =>
      resolveSceneWorld({
        worldId: worldId ?? "",
        meta: docMeta,
        entities: worldIndex.entities,
        worksheets: worldIndex.worksheets,
        simulations: worldIndex.simulations,
        subjects: worldIndex.subjects,
        branches: worldIndex.branches,
      }),
    [worldId, docMeta, worldIndex],
  );
  const scene = useMemo(
    () =>
      buildSceneContext({
        html: deferredSceneHtml,
        povEntityId: sceneWorld.povEntityId,
        povDossierId: sceneWorld.povDossierId,
        povOriginSheetIds: sceneWorld.povOriginSheetIds,
        setInPlaceId: docMeta.setInPlaceId || null,
        settingBodyId: sceneWorld.bodyEntityId,
        subjectEntityId: docMeta.subjectEntityId || null,
        connections: worldIndex.connections,
      }),
    [deferredSceneHtml, sceneWorld, docMeta.setInPlaceId, docMeta.subjectEntityId, worldIndex.connections],
  );
  const studioWorld = useMemo<StudioWorld>(() => ({ ...worldIndex, scene, focus }), [worldIndex, scene, focus]);

  // CANON CAPTURE + CONTRADICTION LEDGER (charter 2.2, 2.3) ------------------
  // Claims in the prose, read on idle 1200ms after the last edit; never on
  // the typing path, never an edit to the prose. The ledger lives in the
  // Check tab; markers sit in the margin; the world-level contradiction
  // count sits in the footer.
  const openDocRef = useRef<(id: string) => void>(() => undefined);
  const openDocStable = useCallback((id: string) => openDocRef.current(id), []);
  const captureScene = useMemo(
    () => ({
      subjectEntityId: docMeta.subjectEntityId || null,
      settingBodyId: sceneWorld.bodyEntityId,
      setInPlaceId: docMeta.setInPlaceId || null,
      povEntityId: sceneWorld.povEntityId,
    }),
    [docMeta.subjectEntityId, docMeta.setInPlaceId, sceneWorld.bodyEntityId, sceneWorld.povEntityId],
  );
  const capture = useCanonCapture({
    editor: editorState?.editor ?? null,
    editorDocId: editorState?.docId ?? null,
    docId: doc?.id,
    docs: binderEntries,
    world: worldIndex,
    scene: captureScene,
    resolutions: docMeta.captureResolutions,
    openDoc: openDocStable,
  });
  const [captureFocus, setCaptureFocus] = useState<string | null>(null);
  const docTitleOf = useCallback(
    (id: string) => binderEntries?.find((e) => e.id === id)?.title || "Untitled",
    [binderEntries],
  );
  const povOptions = useMemo(
    () => buildPovChoices(worldIndex.worksheets, worldIndex.subjects, worldIndex.entities),
    [worldIndex.worksheets, worldIndex.subjects, worldIndex.entities],
  );
  const placeOptions = useMemo(() => buildPlaceChoices(worldIndex.entities), [worldIndex.entities]);

  // Commit any pending edit immediately.
  //
  // The pending payload carries its own docId: the debounce used to fire after
  // the doc-change effect had already rebased lastCount to the NEW document,
  // so the timer committed (old doc's words - new doc's baseline) to the streak
  // ledger and painted the old count while the new doc was on screen.
  //
  // Returns a promise that settles once the save has landed (or failed), so a
  // structural operation (restore, trash) can wait for the latest words to be
  // on the server before it acts. Fire-and-forget callers can ignore it.
  const flushPending = useCallback((): Promise<void> => {
    if (debounce.current) {
      clearTimeout(debounce.current);
      debounce.current = undefined;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    }
    const p = pending.current;
    if (!p) return Promise.resolve();
    pending.current = null;
    lastSent.current = { docId: p.docId, html: p.html };

    const delta =
      p.docId === docId && lastCount.current !== null ? p.words - lastCount.current : 0;
    if (p.docId === docId) {
      lastCount.current = p.words;
      setWords(p.words);
    }

    // Recovered words are about to replace the server copy: put the copy
    // they replace on file first (once). Saving is the writer's choice made
    // by KEEP RECOVERED, RESTORE, or simply writing on.
    const r = recoveryRef.current;
    let gate: Promise<unknown> = Promise.resolve();
    if (r && r.docId === p.docId && r.kind === "recovered" && !r.replacedKept) {
      r.replacedKept = true;
      gate = createSnapshot({ name: "Before recovered words", content: r.replacedHtml }).catch(() => null);
      setRecovery(null);
    }

    inFlight.current += 1;
    return gate
      .then(() => saveContent({ docId: p.docId, content: p.html }))
      .then((row) => {
        setSavedAt(new Date());
        failures.current = 0;
        setSaveFailed(false);
        // Confirmed: this device's copy of exactly this text can go.
        serverBase.current.set(p.docId, row?.updated_at ?? null);
        settleJournal(deviceStorage(), p.docId, p.html, row?.updated_at ?? null);
        if (user && delta > 0) {
          // Await nothing, but refresh the footer once the ledger is written
          // so today's total advances as you type instead of on next refetch.
          reportWordsWritten(delta);
          rollWordSession(user.id, delta).then(() => refreshToday());
        }
      })
      .catch(() => {
        // Keep the text queued (it is also in the device journal) and retry
        // on a backoff while it is unsaved; at once when the line returns.
        if (!pending.current) pending.current = p;
        failures.current += 1;
        setSaveFailed(true);
        if (failures.current === 1) {
          toast({
            title: "SAVE FAILED.",
            description: "Your words are held on this device. Retrying.",
            variant: "destructive",
          });
        }
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          retryTimer.current = undefined;
          if (typeof navigator !== "undefined" && navigator.onLine === false) return;
          void flushRef.current();
        }, retryDelay(failures.current));
      })
      .finally(() => {
        inFlight.current -= 1;
        if (inFlight.current === 0 && !pending.current && !editorUnsent.current) setDirty(false);
      });
  }, [docId, saveContent, user, refreshToday, createSnapshot, toast]);
  const flushRef = useRef(flushPending);
  flushRef.current = flushPending;

  function onContentChange(html: string) {
    if (!docId) return;
    // Tiptap reports an "update" on mount (setEditable) and the editor
    // reports on every blur; neither is a change worth a write.
    // Compared with the last text sent (or, before any, the loaded text), so
    // typing back to an earlier state after a save is still written.
    const lastText =
      lastSent.current?.docId === docId
        ? lastSent.current.html
        : doc?.id === docId
          ? doc.content ?? ""
          : null;
    editorUnsent.current = false;
    if (!pending.current && html === lastText) {
      if (inFlight.current === 0) setDirty(false);
      return;
    }
    pending.current = { docId, html, words: countWords(html) };
    setDirty(true);
    // On this device before it is sent; cleared when the save is confirmed.
    writeJournal(deviceStorage(), docId, html, serverBase.current.get(docId) ?? null);
    // The binder list is what Scrivenings and the split pane open from.
    primeDocCaches(qc, worldId, docId, html, false);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(flushPending, 1200);
  }

  // Commit before leaving the document, and before the tab closes — otherwise
  // the last <=1.2s of typing is silently lost.
  useEffect(() => () => void flushPending(), [docId, flushPending]);

  /**
   * A keystroke changed the document. Called before the editor's debounce,
   * so the footer and the close-tab guard know at once, and the words reach
   * the device journal within a moment rather than at the next save.
   */
  const onEditorDirty = useCallback(() => {
    editorUnsent.current = true;
    setDirty(true);
    if (journalTimer.current) clearTimeout(journalTimer.current);
    const target = editorState;
    journalTimer.current = setTimeout(() => {
      if (!target || target.editor.isDestroyed) return;
      writeJournal(
        deviceStorage(),
        target.docId,
        target.editor.getHTML(),
        serverBase.current.get(target.docId) ?? null,
      );
    }, 400);
  }, [editorState]);

  // The latest handOffMain for window listeners (it closes over the editor).
  const handOffRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pending.current && !editorUnsent.current && inFlight.current === 0) return;
      handOffRef.current();
      e.preventDefault();
    };
    // Hidden may mean never coming back (mobile, tab discard): send now.
    const onHide = () => {
      if (document.visibilityState === "hidden") handOffRef.current();
    };
    const onPageHide = () => handOffRef.current();
    const onOnline = () => {
      setOnline(true);
      handOffRef.current();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
  useEffect(
    () => () => {
      if (journalTimer.current) clearTimeout(journalTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  // The live text: the editor is authoritative; the pending buffer and the
  // last saved copy are fallbacks for the instant before it mounts.
  const liveHtml = useCallback(
    (): string => editorInstance?.getHTML() ?? pending.current?.html ?? doc?.content ?? "",
    [editorInstance, doc?.content],
  );

  // SNAPSHOTS ----------------------------------------------------------------

  const takeSnapshot = useCallback(
    async (name?: string): Promise<boolean> => {
      if (!doc) return false;
      const html = liveHtml();
      if (countWords(html) === 0) {
        toast({ title: "NOTHING TO SNAPSHOT.", description: "This document is empty." });
        return false;
      }
      void flushPending();
      const snap = await createSnapshot({ name, content: html, title: title || doc.title });
      if (snap) {
        toast({
          title: "SNAPSHOT TAKEN.",
          description: snap.name ? `“${snap.name}” · ${snap.wordCount.toLocaleString()} words` : `${snap.wordCount.toLocaleString()} words`,
        });
        return true;
      }
      toast({ title: "SNAPSHOT FAILED.", description: "Nothing was changed. Try again.", variant: "destructive" });
      return false;
    },
    [doc, liveHtml, flushPending, createSnapshot, title, toast],
  );
  const takeSnapshotRef = useRef(takeSnapshot);
  takeSnapshotRef.current = takeSnapshot;

  /** Restore a snapshot. The current text is snapshotted first, always. */
  const restoreSnapshot = useCallback(
    async (snap: DocumentSnapshot): Promise<boolean> => {
      if (!doc || !editorInstance) return false;
      await flushPending();
      const found = await restoreVersion(snap.id, liveHtml());
      if (!found) {
        toast({
          title: "RESTORE HALTED.",
          description: "The current text could not be snapshotted first, so nothing was replaced.",
          variant: "destructive",
        });
        return false;
      }
      editorInstance.commands.setContent(found.content, { emitUpdate: false });
      // A restore is not writing: rebase the counter so the streak ledger
      // neither gains nor loses words for it.
      const restoredWords = countWords(found.content);
      lastCount.current = restoredWords;
      setWords(restoredWords);
      try {
        await updateContent.mutateAsync({ docId: doc.id, content: found.content });
        setSavedAt(new Date());
      } catch {
        return false;
      }
      toast({ title: "VERSION RESTORED.", description: "The text it replaced is on file as a snapshot." });
      return true;
    },
    [doc, editorInstance, flushPending, restoreVersion, liveHtml, updateContent, toast],
  );

  // RECOVERY -----------------------------------------------------------------
  // Once per document opening, after the server copy has settled and the
  // editor is mounted on it: words this device holds that the server never
  // confirmed are restored (or offered), never silently dropped.
  useEffect(() => {
    if (!doc || docFetching) return;
    if (!editorState || editorState.docId !== doc.id || editorState.editor.isDestroyed) return;
    if (recoveryChecked.current === doc.id) return;
    recoveryChecked.current = doc.id;

    const storage = deviceStorage();
    const entry = readJournal(storage, doc.id);
    const decision = decideRecovery(entry, { content: doc.content, updated_at: doc.updated_at });
    if (decision === "settled") {
      dropJournal(storage, doc.id);
      return;
    }
    if (!entry || (decision !== "recover" && decision !== "older")) return;

    const ed = editorState.editor;
    const live = ed.getHTML();
    // Words already typed in this session are not overwritten automatically.
    const typedHere = editorUnsent.current || pending.current?.docId === doc.id;
    if (decision === "recover" && !typedHere) {
      ed.commands.setContent(entry.html, { emitUpdate: false });
      setWords(countWords(entry.html));
      setRecovery({ docId: doc.id, kind: "recovered", journalHtml: entry.html, replacedHtml: live, replacedKept: false });
    } else {
      setRecovery({ docId: doc.id, kind: "older", journalHtml: entry.html, replacedHtml: live, replacedKept: false });
    }
  }, [doc, docFetching, editorState]);

  // A notice belongs to one document.
  useEffect(() => {
    setRecovery((r) => (r && r.docId !== docId ? null : r));
  }, [docId]);

  /** Keep the recovered words: the text they replace goes on file first. */
  const keepRecovered = useCallback(() => {
    const r = recoveryRef.current;
    if (!r || !editorState || editorState.docId !== r.docId || editorState.editor.isDestroyed) return;
    const ed = editorState.editor;
    if (r.kind === "older") {
      // Restoring now: snapshot whatever is on screen, then put them back.
      r.replacedHtml = ed.getHTML();
      ed.commands.setContent(r.journalHtml, { emitUpdate: false });
      setWords(countWords(r.journalHtml));
      r.kind = "recovered";
    }
    onContentChange(ed.getHTML());
    void flushPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState, flushPending]);

  /**
   * Discard the device's words. The writer chose it; they still go on file
   * as a snapshot, because words are never thrown away outright.
   */
  const discardRecovered = useCallback(() => {
    const r = recoveryRef.current;
    if (!r) return;
    setRecovery(null);
    void createSnapshot({ name: "Unsaved words, discarded", content: r.journalHtml }).catch(() => null);
    dropJournal(deviceStorage(), r.docId);
    if (r.kind === "recovered" && editorState && editorState.docId === r.docId && !editorState.editor.isDestroyed) {
      editorState.editor.commands.setContent(r.replacedHtml, { emitUpdate: false });
      setWords(countWords(r.replacedHtml));
      if (pending.current?.docId === r.docId) pending.current = null;
      editorUnsent.current = false;
      if (inFlight.current === 0) setDirty(false);
    }
  }, [createSnapshot, editorState]);

  const saveState: SaveState = deriveSaveState({
    online,
    dirty,
    saving: updateContent.isPending,
    failed: saveFailed,
    savedOnce: !!savedAt,
  });

  /** Trash a document, saving any unsaved words first (the hook snapshots it). */
  const trashDocument = useCallback(
    async (id: string) => {
      if (id === docId) await flushPending();
      trashDoc.mutate(id);
    },
    [docId, flushPending, trashDoc],
  );

  // VIEWS --------------------------------------------------------------------

  /**
   * Hand the main editor's newest words over before it unmounts: its own
   * debounce may still hold up to 1.5s of typing, and the next surface
   * (Scrivenings, a split pane) opens from the binder cache.
   */
  const handOffMain = useCallback(() => {
    if (doc && editorInstance && !editorInstance.isDestroyed) {
      const html = editorInstance.getHTML();
      if (html !== (pending.current?.html ?? doc.content ?? "")) onContentChange(html);
    }
    void flushPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, editorInstance, flushPending]);
  handOffRef.current = handOffMain;

  const switchView = (v: Exclude<WriteView, "scrivenings">) => {
    if (effectiveView === "editor" && v !== "editor") handOffMain();
    setScriv(null);
    setViewState(v);
  };

  const openScrivenings = (ids: string[], scrivTitle: string) => {
    const docs = inReadingOrder(binderTree, ids);
    if (docs.length === 0) {
      toast({ title: "NOTHING TO SHOW.", description: "That selection holds no documents." });
      return;
    }
    if (effectiveView === "editor") handOffMain();
    setScriv({ ids: docs.map((d) => d.id), title: scrivTitle });
    setViewState("scrivenings");
    setSelection([]);
    setMobilePanel(null);
  };
  const scrivDocs = useMemo(
    () => (scriv ? inReadingOrder(binderTree, scriv.ids) : []),
    [scriv, binderTree],
  );

  // SEARCH -------------------------------------------------------------------

  const jumpTo = (targetId: string, hit: SearchHit) => {
    if (effectiveView !== "editor") switchView("editor");
    setJump({ docId: targetId, hit, query: searchQuery, opts: searchOpts });
    if (targetId !== docId) {
      handOffMain();
      navigate(`/write/${targetId}`);
    }
    setMobilePanel(null);
  };

  // Land on the match once the target document's editor is mounted. Card
  // fields open the inspector pane that holds them instead.
  useEffect(() => {
    if (!jump || jump.docId !== docId) return;
    const field = jump.hit.field;
    if (field !== "text") {
      if (field === "synopsis" || field === "keywords") {
        setInspector("doc");
        setDocPane("card");
      } else if (field === "notes") {
        setInspector("doc");
        setDocPane("notes");
      }
      setJump(null);
      return;
    }
    if (!editorState || editorState.docId !== jump.docId) return;
    const { re } = buildMatcher(jump.query, jump.opts);
    const ed = editorState.editor;
    const occurrence = jump.hit.occurrence;
    setJump(null);
    // After the editor's own first content sync, which resets the selection.
    setTimeout(() => {
      if (re && !ed.isDestroyed) selectMatch(ed, re, occurrence);
    }, 80);
  }, [jump, docId, editorState]);

  const focusSearch = useCallback(() => {
    setFocus(false);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobilePanel("binder");
    }
    setTimeout(() => searchRef.current?.focus(), 60);
  }, []);

  const saveCollection = (name: string) => {
    const clean = name.trim();
    if (!clean || !collectPrompt) return;
    const c: WritingCollection =
      collectPrompt.kind === "search"
        ? {
            id: newCollectionId(),
            name: clean,
            kind: "search",
            query: searchQuery,
            regex: searchOpts.regex,
            caseSensitive: searchOpts.caseSensitive,
          }
        : { id: newCollectionId(), name: clean, kind: "manual", docIds: collectPrompt.ids };
    collections.save([...collections.value, c]);
    toast({ title: "COLLECTION SAVED.", description: clean });
    if (collectPrompt.kind === "manual") setSelection([]);
    setCollectPrompt(null);
  };

  // The live editor bound no shortcuts at all: Ctrl+S did nothing and focus
  // mode had no way out but the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd+Alt+S: take a snapshot. Scrivener's Cmd+5 is a browser tab
      // switch; Mod+Shift+S is Tiptap's strikethrough (and Firefox's
      // screenshot). Matched on e.code because Option+S types "ß" on a Mac,
      // and skipped for AltGr so a writer typing "ś" on a Polish layout is
      // never intercepted. Checked before plain Ctrl+S.
      if (
        (e.metaKey || e.ctrlKey) &&
        e.altKey &&
        !e.shiftKey &&
        e.code === "KeyS" &&
        !e.getModifierState?.("AltGraph")
      ) {
        e.preventDefault();
        void takeSnapshotRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Including the words still inside the editor's debounce.
        handOffRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        // Ctrl/Cmd+Shift+F: search the whole binder.
        e.preventDefault();
        focusSearch();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        // Override the browser's find: it cannot replace, and a writer asking
        // for find in an editor means find-in-document.
        e.preventDefault();
        setFindOpen(true);
        return;
      }
      if (e.key === "Escape" && focus) setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flushPending, focus, focusSearch]);

  // Export just this document, reusing the manuscript exporters with a
  // single-chapter list so the formatting matches a compiled manuscript.
  const exportDoc = useCallback(
    async (format: "docx" | "md" | "txt") => {
      if (!doc) return;
      // The words on screen, not the last fetched copy: hand the editor's
      // debounced text over and let the save land before reading.
      handOffMain();
      await flushPending();
      const html =
        editorState && editorState.docId === doc.id && !editorState.editor.isDestroyed
          ? editorState.editor.getHTML()
          : liveHtml();

      const name = title.trim() || doc.title || "Untitled";
      const meta = {
        title: name,
        author: exportAuthor(profile?.display_name, user?.user_metadata),
      };
      const chapters = [{ id: doc.id, title: name, content: html }];
      const safeName = name.replace(/[^\w\d-]+/g, "-").replace(/^-+|-+$/g, "") || "document";

      try {
        if (format === "docx") {
          await compileManuscriptDocx(meta, chapters);
          return;
        }
        const text =
          format === "md"
            ? compileManuscriptMarkdown(meta, chapters)
            : compileManuscriptPlainText(meta, chapters);
        const blob = new Blob([text], {
          type: format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Revoke late; revoking immediately can cancel the download in some browsers.
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch {
        toast({
          title: "EXPORT FAILED.",
          description: "Could not generate the file. Try another format.",
          variant: "destructive",
        });
      }
    },
    [doc, user, profile, title, handOffMain, flushPending, editorState, liveHtml, toast],
  );

  // INSERTING FROM THE RAIL --------------------------------------------------
  // Into the editor the writer was last in (main, split or Scrivenings), at
  // its caret, as real nodes: a cited fact, an @mention or a [[wiki link]]
  // that carry ids. The old path typed plain text through execCommand into
  // whichever .tiptap came first in the DOM.
  const insertNodes = useCallback(
    (content: JSONContent | JSONContent[]) => {
      const ed =
        getActiveEditor() ?? (editorInstance && !editorInstance.isDestroyed ? editorInstance : null);
      if (!ed || !ed.isEditable) {
        toast({ title: "NO DOCUMENT OPEN.", description: "Open a document in the editor, then insert." });
        return;
      }
      ed.chain().focus().insertContent(content).run();
    },
    [editorInstance, toast],
  );
  const insertMention = useCallback(
    (e: Entity) =>
      insertNodes([
        {
          type: "entityMention",
          attrs: {
            id: e.id,
            label: e.name,
            entityType: e.entity_type,
            color: e.color || ENTITY_TYPE_COLORS[e.entity_type] || ENTITY_TYPE_COLORS.custom,
          },
        },
        { type: "text", text: " " },
      ]),
    [insertNodes],
  );
  const insertWikiLink = useCallback(
    (e: Entity) =>
      insertNodes({ type: "wikiLink", attrs: { elementId: e.id, title: e.name, elementType: e.entity_type } }),
    [insertNodes],
  );
  const citeFact = useCallback(
    (f: WorldFact) => insertNodes({ type: "factRef", attrs: factToRefAttrs(f) }),
    [insertNodes],
  );
  const insertPlainFact = useCallback(
    (f: WorldFact) => insertNodes({ type: "text", text: f.insert }),
    [insertNodes],
  );
  const unpin = useCallback((p: PinnedItem) => removePin(p.id, p.type), [removePin]);

  // CLICKING A MENTION ------------------------------------------------------
  // @mentions and [[wiki links]] dispatch sf-navigate-entity/-element. Only
  // WorldLayout listened, and /write sits outside it, so a click did nothing.
  // Here it opens the entity beside the prose, read only, with OPEN CODEX.
  const openBeside = useCallback(
    (id: string) => {
      if (!worldId) return;
      const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
      const isEntity = worldIndex.entityById.has(id);
      const isDoc = !isEntity && id !== docId && readingDocs.some((d) => d.id === id);
      if (narrow || (!isEntity && !isDoc)) {
        navigate(isDoc ? `/write/${id}` : `/worlds/${worldId}/codex/${id}`);
        return;
      }
      if (!split.open && effectiveView === "editor") handOffMain();
      setFocus(false);
      updateSplit({ open: true, source: isEntity ? { kind: "entity", id } : { kind: "doc", id } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worldId, worldIndex.entityById, docId, readingDocs, split.open, effectiveView, updateSplit, navigate],
  );
  const openBesideRef = useRef(openBeside);
  openBesideRef.current = openBeside;
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ elementId?: string; entityId?: string }>).detail;
      const id = detail?.elementId ?? detail?.entityId;
      if (id) openBesideRef.current(id);
    };
    window.addEventListener("sf-navigate-element", handler);
    window.addEventListener("sf-navigate-entity", handler);
    return () => {
      window.removeEventListener("sf-navigate-element", handler);
      window.removeEventListener("sf-navigate-entity", handler);
    };
  }, []);

  function saveTitle() {
    if (docId && worldId && title !== (doc?.title ?? "")) {
      renameDoc.mutate({ docId, title });
    }
  }

  async function newDocument() {
    if (!worldId) return;
    createDoc.mutate(
      { title: "Untitled", parentId: null },
      { onSuccess: (d: WorldEntry) => navigate(`/write/${d.id}`) },
    );
  }

  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (!docLoading && doc === null) return <Navigate to="/studio" replace />;

  // open a doc from the binder; on mobile also close the sheet
  // Opening one document leaves Scrivenings (the binder's click means "this
  // one"); Board and Outline stay put, as before.
  const openDoc = (id: string) => {
    if (effectiveView === "scrivenings") switchView("editor");
    else if (effectiveView === "editor" && id !== docId) handOffMain();
    navigate(`/write/${id}`);
    setMobilePanel(null);
  };
  openDocRef.current = openDoc;

  // Shared binder content (renders in the desktop column AND the mobile sheet)
  const binderContent = (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col border-r border-sf-line-hairline">
      {worldId && (
        <BinderSearchInput
          query={searchQuery}
          onQuery={setSearchQuery}
          opts={searchOpts}
          onOpts={setSearchOpts}
          inputRef={searchRef}
        />
      )}
      {selection.length > 0 && (
        <SelectionBar
          count={selection.length}
          onScrivenings={() => openScrivenings(selection, `${selection.length} selected documents`)}
          onSave={() => setCollectPrompt({ kind: "manual", ids: inReadingOrder(binderTree, selection).map((d) => d.id) })}
          onClear={() => setSelection([])}
        />
      )}
      {worldId && canonAffected > 0 && !searchQuery.trim() && (
        // Charter 2.5: a small mono marker and a filter, not a modal.
        <div className="flex items-center gap-2 border-b border-sf-line-hairline px-3">
          <button
            type="button"
            onClick={() => setCanonFilter((f) => !f)}
            aria-pressed={canonFilter}
            className={`flex min-h-hit min-w-0 flex-1 items-center gap-1.5 text-left font-mono text-[12px] uppercase transition-colors duration-fast ${
              canonFilter ? "text-sf-amber-text" : "text-t3 hover:text-t1"
            }`}
          >
            <span className="text-sf-amber-text" aria-hidden="true">//</span>
            <span className="truncate">
              {canonFilter ? `Canon-changed only (${canonAffected})` : `Show canon-changed (${canonAffected})`}
            </span>
          </button>
          {canonFilter && (
            <button
              type="button"
              onClick={() => setCanonFilter(false)}
              className="min-h-hit shrink-0 px-1 font-mono text-[12px] uppercase text-t3 transition-colors duration-fast hover:text-sf-primary-text"
            >
              Show all
            </button>
          )}
        </div>
      )}
      <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto py-2">
        {worldId && searchQuery.trim() ? (
          <BinderSearchResults
            docs={readingDocs}
            query={searchQuery}
            opts={searchOpts}
            activeDocId={docId}
            onJump={jumpTo}
            onSave={() => setCollectPrompt({ kind: "search" })}
            onScrivenings={(ids) => openScrivenings(ids, `Search: ${searchQuery}`)}
          />
        ) : (
        <>
        {worldId && (
          <CollectionsSection
            collections={collections.value}
            docs={readingDocs}
            activeDocId={docId}
            local={collections.isLocal}
            onOpenDoc={openDoc}
            onScrivenings={openScrivenings}
            onRunSearch={(c) => {
              if (c.kind !== "search") return;
              setSearchOpts({ regex: c.regex, caseSensitive: c.caseSensitive });
              setSearchQuery(c.query);
            }}
            onDelete={(c) => {
              if (window.confirm(`Delete the collection "${c.name}"? No document is affected.`)) {
                collections.save(collections.value.filter((x) => x.id !== c.id));
              }
            }}
          />
        )}
        {worldId && (
          <BinderTree
            selection={selection}
            onSelectionChange={setSelection}
            onScrivenings={(folderId) => {
              const folder = binderEntries.find((e) => e.id === folderId);
              openScrivenings(
                docsUnderFolder(binderTree, folderId).map((d) => d.id),
                folder?.title || "Untitled folder",
              );
            }}
            worldId={worldId}
            tree={shownTree}
            canonCounts={canon.counts}
            expandAll={canonFilter}
            entries={binderEntries}
            activeDocId={docId}
            labels={labels}
            onOpen={openDoc}
            onMove={(plan) => moveItem.mutate(plan)}
            onTrash={(id) => void trashDocument(id)}
            onCreateDoc={(parentId) =>
              createDoc.mutate(
                { title: "Untitled", parentId },
                { onSuccess: (d: WorldEntry) => openDoc(d.id) },
              )
            }
            onCreateFolder={(parentId) => createFolder.mutate({ title: "New folder", parentId })}
            onRename={(id, kind, newTitle) => {
              if (kind === "doc") {
                renameDoc.mutate({ docId: id, title: newTitle });
                if (id === docId) setTitle(newTitle);
              } else {
                renameFolder.mutate({ folderId: id, title: newTitle });
              }
            }}
            onDeleteFolder={(id, folderTitle) => {
              if (window.confirm(`Delete the folder "${folderTitle}"? Everything inside it moves up one level. No document is deleted.`)) {
                deleteFolder.mutate(id);
              }
            }}
          />
        )}
        {(entries?.length ?? 0) === 0 && (
          <p className="px-3 py-4 font-serif text-[13px] italic text-t4">No documents yet.</p>
        )}
        {worldId && (entries?.length ?? 0) <= 1 && !(entries ?? []).some((e) => countWords(e.content) > 0) && (
          <div className="mx-3 mt-3 border-t border-sf-line-hairline pt-3">
            <p className="font-serif text-[14px] italic text-t3">Writing this book somewhere else?</p>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="mt-1 min-h-hit text-left font-sans text-[13px] text-sf-primary-text underline-offset-4 transition-colors duration-fast hover:underline"
            >
              Bring the manuscript in: Scrivener, Word, Markdown
            </button>
          </div>
        )}
        {(trashed?.length ?? 0) > 0 && (
          <div className="mt-3 border-t border-sf-line-hairline pt-2">
            <button
              onClick={() => setTrashOpen((o) => !o)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-heading text-[12px] uppercase tracking-wide text-t4 hover:text-t2"
              aria-expanded={trashOpen}
            >
              <Trash2 className="h-3 w-3" /> Trash ({trashed!.length})
              <span className="ml-auto text-[12px]">{trashOpen ? "▾" : "▸"}</span>
            </button>
            {trashOpen && (
              <div className="pb-1">
                <p className="px-3 pb-1 font-serif text-[12px] italic text-t4">Auto-emptied after 90 days.</p>
                {trashed!.map((d) => (
                  <div key={d.id} className="group flex items-center gap-1 pr-1">
                    <span className="min-w-0 flex-1 truncate py-1.5 pl-3 font-serif text-[13px] text-t4 line-through">{d.title || "Untitled"}</span>
                    <button onClick={() => restoreDoc.mutate(d.id)} aria-label={`Restore ${d.title || "Untitled"}`} title="Restore"
                      className="transition-colors duration-base shrink-0 p-1.5 text-t4 hover:text-sf-primary-text">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${d.title || "Untitled"}" forever? This cannot be undone.`)) {
                          purgeDoc.mutate(d.id);
                        }
                      }}
                      aria-label={`Delete ${d.title || "Untitled"} permanently`} title="Delete forever"
                      className="transition-colors duration-base shrink-0 p-1.5 text-t4 hover:text-sf-crimson-text">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
      {worldId && (
        <div className="flex flex-wrap gap-2 border-t border-sf-line-hairline p-3">
          <button onClick={newDocument} className="min-h-hit flex-auto whitespace-nowrap border border-sf-line px-3 py-1.5 text-[12px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">+ Document</button>
          <button onClick={() => createFolder.mutate("New folder")} className="min-h-hit flex-auto whitespace-nowrap border border-sf-line px-3 py-1.5 text-[12px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">+ Folder</button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            title="Import a manuscript: Scrivener, Word, Markdown, text"
            className="min-h-hit flex-auto whitespace-nowrap border border-sf-line px-3 py-1.5 text-[12px] text-t2 transition-colors hover:border-sf-primary hover:text-t1"
          >
            Import
          </button>
        </div>
      )}
    </div>
  );

  // Shared inspector content (desktop column AND mobile sheet). The rail
  // itself never scrolls (Studio Charter: one screen); each pane scrolls
  // inside it.
  const inspectorContent = worldId ? (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-sf-line-hairline">
      <div className="flex shrink-0 border-b border-sf-line-hairline" role="tablist" aria-label="Inspector">
        {(["doc", "entities", "world", "reference", "continuity"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={inspector === t} onClick={() => setInspector(t)}
            className={`min-h-[44px] flex-1 border-b-2 px-1 py-2.5 text-[13px] capitalize transition-colors ${inspector === t ? "border-sf-primary text-t1" : "border-transparent text-t3 hover:text-t1"}`}>
            {t === "doc" ? "Doc" : t === "entities" ? "Entities" : t === "world" ? "World" : t === "reference" ? "Refs" : "Check"}
            {t === "continuity" && capture.items.length > 0 && (
              <span className="ml-1 font-mono text-[12px] text-sf-amber-text">
                {capture.items.length}
                <span className="sr-only"> items in the ledger</span>
              </span>
            )}
          </button>
        ))}
      </div>
      {inspector === "doc" && doc && (
        <div className="min-h-0 flex-1">
          <DocumentInspector
            key={doc.id}
            meta={docMeta}
            onChange={(patch) => updateMeta.mutate({ docId: doc.id, patch })}
            words={words}
            labels={labels}
            onManageLabels={() => setLabelsOpen(true)}
            keywordSuggestions={keywordSuggestions}
            pane={docPane}
            onPaneChange={setDocPane}
            snapshots={snapshots}
            snapshotsLoading={snapshotsLoading}
            snapshotsLocal={snapshotsLocal}
            onTakeSnapshot={takeSnapshot}
            onCompare={(s) => {
              void flushPending();
              setComparing(s);
            }}
            onDeleteSnapshot={(s) => {
              void deleteSnapshot(s.id).then((ok) =>
                toast(ok ? { title: "SNAPSHOT DELETED." } : { title: "DELETE FAILED.", variant: "destructive" }),
              );
            }}
            povOptions={povOptions}
            placeOptions={placeOptions}
            branchOptions={worldIndex.branches}
          />
        </div>
      )}
      {inspector === "entities" && (
        <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
        <WritingEntityPanel
          worldId={worldId}
          open
          onToggle={() => {}}
          onInsertMention={insertMention}
          onInsertWikiLink={insertWikiLink}
          onPinEntity={(e: Entity) => {
            addPin({ id: e.id, type: "entity", title: e.name, content: e.summary || "" });
            toast({ title: `${e.name.toUpperCase()} PINNED.` });
          }}
          pins={pins}
          onUnpin={unpin}
          embedded
        />
        </div>
      )}
      {inspector === "continuity" && (
        <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
          {doc ? (
            <ContradictionLedger
              worldId={worldId}
              docId={doc.id}
              content={doc.content}
              entityId={docMeta.subjectEntityId || undefined}
              onSetEntityId={(id) =>
                docId && updateMeta.mutate({ docId, patch: { subjectEntityId: id } })
              }
              items={capture.items}
              elsewhere={capture.elsewhere}
              docTitle={docTitleOf}
              resolutions={docMeta.captureResolutions ?? {}}
              focusKey={captureFocus}
              onResolve={(key, resolution) =>
                updateMeta.mutate({ docId: doc.id, patch: { captureResolutions: { [key]: resolution } } })
              }
              onLocate={capture.locate}
              onLocateIn={capture.locateIn}
            />
          ) : null}
        </div>
      )}
      {inspector === "world" && (
        <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
          <WorldInfluencePanel
            worldId={worldId}
            content={deferredSceneHtml}
            influence={sceneWorld.influence}
            onEditCard={() => {
              setInspector("doc");
              setDocPane("card");
            }}
          />
        </div>
      )}
      {inspector === "reference" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
            <WorldRefsPanel
              pins={pins}
              onUnpin={unpin}
              onCite={citeFact}
              onInsertPlain={insertPlainFact}
              onPinSource={(f) => {
                if (!f.sourceId) return;
                addPin({ id: f.sourceId, type: "worksheet", title: sourceLine(f), content: "" });
                toast({ title: "PINNED.", description: sourceLine(f) });
              }}
            />
          </div>
          <div className="border-t border-sf-line-hairline p-3">
            <Link to={`/worlds/${worldId}/codex`} className="block border border-sf-line px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">Open the Codex →</Link>
            <Link to={`/worlds/${worldId}/codex?view=web`} className="mt-2 block border border-sf-line px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">Open the entity web →</Link>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <StudioWorldProvider value={studioWorld}>
    <div className="relative z-10 grid h-screen grid-rows-[44px_1fr_44px] bg-[hsl(var(--sf-void-hsl))]">
      {/* topbar */}
      <header className="flex items-center gap-3 border-b border-sf-line-hairline px-4">
        {/* explicit way back to the Studio overview */}
        <Link
          to="/studio"
          className="flex min-h-hit items-center gap-1.5 border border-sf-line px-2.5 py-1 font-heading text-sf-eyebrow uppercase text-t3 transition-colors duration-base hover:border-sf-primary hover:text-t1"
          title="Return to Studio"
          aria-label="Return to Studio"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Studio
        </Link>
        <Wordmark size="sm" suffix="Studio" to="/studio" className="hidden sm:inline-flex" />
        <div className="hidden min-w-0 items-baseline gap-2 text-[13px] text-t4 md:flex">
          <span className="text-t4">/</span>
          {worldId && (
            <>
              <Link to={`/worlds/${worldId}`} className="hover:text-t2">World</Link>
              <span className="text-t4">/</span>
            </>
          )}
          <span className="truncate font-serif italic text-t2">{doc?.title || "Untitled"}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[12px] tracking-wider text-t4 sm:block">● {words.toLocaleString()} words</span>
          {/* mobile panel toggles — binder + inspector are sheets below lg */}
          {!focus && (
            <>
              <button onClick={() => setMobilePanel("binder")}
                className="border border-sf-line px-3 py-1 text-[12px] text-t3 transition-colors hover:border-sf-primary hover:text-t1 lg:hidden">
                Docs
              </button>
              {worldId && (
                <button onClick={() => setMobilePanel("inspector")}
                  className="border border-sf-line px-3 py-1 text-[12px] text-t3 transition-colors hover:border-sf-primary hover:text-t1 lg:hidden">
                  Inspector
                </button>
              )}
            </>
          )}
          {/* Spacing / font / width. These were a permanent row between the
              title and the first line of prose; they belong one click away,
              not in the writer's eyeline. */}
          <TypographyMenu preferences={preferences} onChange={updatePreferences} />
          {/* Per-document export. The compile page could export a whole
              manuscript, but a single document had no export path at all. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="border border-sf-line px-3 py-1 text-[12px] text-t3 transition-colors hover:border-sf-line-emphasis hover:text-t1"
                title="Export this document"
              >
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-none border-sf-line bg-sf-surface/95">
              <DropdownMenuItem onClick={() => exportDoc("docx")}>
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDoc("md")}>
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDoc("txt")}>
                Plain text (.txt)
              </DropdownMenuItem>
              {worldId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/worlds/${worldId}/compile`)}>
                    Compile full manuscript →
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* View switch. Scrivenings opens from the binder (a folder, a
              selection, a collection) and shows here while it is active. */}
          {/* Phones: the same choice as one menu, to keep the bar on one line. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border border-sf-line px-3 py-1 text-[12px] text-t3 transition-colors hover:border-sf-line-emphasis hover:text-t1 sm:hidden"
                aria-label={`View: ${effectiveView === "scrivenings" ? "Scrivenings" : VIEW_LABELS[effectiveView].label}. Change view.`}
              >
                {effectiveView === "scrivenings" ? "Scrivenings" : VIEW_LABELS[effectiveView].label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {(Object.keys(VIEW_LABELS) as Exclude<WriteView, "scrivenings">[]).map((v) => (
                <DropdownMenuItem key={v} onClick={() => switchView(v)}>
                  {VIEW_LABELS[v].label}
                  {effectiveView === v && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden items-center sm:flex" role="group" aria-label="View">
            {(Object.keys(VIEW_LABELS) as Exclude<WriteView, "scrivenings">[]).map((v, i) => (
              <button
                key={v}
                type="button"
                onClick={() => switchView(v)}
                aria-pressed={effectiveView === v}
                title={VIEW_LABELS[v].hint}
                className={`border px-3 py-1 text-[12px] transition-colors ${i > 0 ? "-ml-px" : ""} ${
                  effectiveView === v
                    ? "relative z-[1] border-sf-primary text-sf-primary-text"
                    : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
                }`}
              >
                {VIEW_LABELS[v].label}
              </button>
            ))}
            {effectiveView === "scrivenings" && (
              <span className="relative z-[1] -ml-px border border-sf-primary px-3 py-1 text-[12px] text-sf-primary-text">
                Scrivenings
              </span>
            )}
          </div>
          {!focus && worldId && (
            <button
              type="button"
              onClick={() => {
                if (!split.open && effectiveView === "editor") handOffMain();
                updateSplit({ open: !split.open });
              }}
              aria-pressed={split.open}
              aria-label={split.open ? "Close the split editor" : "Split the editor"}
              title="Split: a second document, Codex entry or worksheet beside this one"
              className={`hidden items-center gap-1.5 border px-3 py-1 text-[12px] transition-colors md:flex ${
                split.open ? "border-sf-primary text-sf-primary-text" : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" /> Split
            </button>
          )}
          <button onClick={() => setFocus(!focus)}
            title={focus ? "Leave focus mode (Esc)" : "Focus mode hides the binder and inspector. Press Esc to come back."}
            className={`border px-3 py-1 text-[12px] transition-colors ${focus ? "border-sf-primary text-sf-primary-text" : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"}`}>
            Focus
          </button>
        </div>
      </header>

      {/* mobile slide-over: binder */}
      <Sheet open={mobilePanel === "binder"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="left" className="w-[280px] border-sf-line bg-sf-surface/95 p-0">
          <div className="flex h-full flex-col pt-8">{binderContent}</div>
        </SheetContent>
      </Sheet>
      {/* mobile slide-over: inspector */}
      <Sheet open={mobilePanel === "inspector"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="right" className="w-[320px] border-sf-line bg-sf-surface/95 p-0">
          <div className="flex h-full flex-col pt-8">{inspectorContent}</div>
        </SheetContent>
      </Sheet>

      {/* body */}
      <div className={`grid min-h-0 ${focus ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]"}`}>
        {/* binder (desktop column) */}
        {!focus && (
          <aside className="hidden min-h-0 min-w-0 lg:flex">{binderContent}</aside>
        )}

        {/* editor, and the split pane beside or below it */}
        <div
          ref={splitBoxRef}
          className={`flex min-h-0 min-w-0 ${showSplit && split.orientation === "stacked" ? "flex-col" : "flex-row"}`}
        >
        <main
          ref={mainRef}
          className={`sf-sb min-h-0 min-w-0 overflow-y-auto${fadeClass}${focus ? " sf-write-focus" : ""}`}
          style={showSplit ? { flex: `0 0 calc(${split.ratio * 100}% - 6px)` } : { flex: "1 1 auto" }}
        >
          {findOpen && effectiveView === "editor" && (
            <FindReplaceBar
              editor={editorInstance}
              onClose={() => setFindOpen(false)}
            />
          )}

          {effectiveView === "board" ? (
            <Corkboard
              folders={folders}
              unfiled={unfiled}
              activeDocId={docId}
              onOpen={(id) => { switchView("editor"); openDoc(id); }}
              onReorder={(ids) => reorderDocs.mutate(ids)}
            />
          ) : effectiveView === "outline" && worldId ? (
            <Outliner
              worldId={worldId}
              tree={binderTree}
              labels={labels}
              activeDocId={docId}
              onOpen={(id) => { switchView("editor"); openDoc(id); }}
              onChangeMeta={(id, patch) => updateMeta.mutate({ docId: id, patch })}
            />
          ) : effectiveView === "scrivenings" && worldId && scriv ? (
            <Scrivenings
              key={scriv.ids.join(",")}
              worldId={worldId}
              docs={scrivDocs}
              title={scriv.title}
              editorClassName="sf-writing-serif"
              editorStyle={editorStyle}
              onOpenDoc={(id) => { switchView("editor"); openDoc(id); }}
              onClose={() => switchView("editor")}
              onWordsLedgered={refreshToday}
            />
          ) : (
          <div
            className="mx-auto px-6 py-10"
            style={{ maxWidth: "var(--sf-writing-measure, 68ch)", ...editorStyle }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="Document title"
              className="w-full border-0 border-b border-sf-line-interactive bg-transparent font-serif text-[30px] italic text-t1 transition-colors duration-base placeholder:text-t4 hover:border-sf-line-emphasis"
              aria-label="Document title"
            />
            {/* The index-card fields (synopsis, label, status, POV...) moved
                to the inspector's Doc tab, out of the writer's eyeline. */}
            <div className="my-6 text-center text-t4" aria-hidden="true">· · ·</div>
            {recovery && doc && recovery.docId === doc.id && (
              <div
                role="status"
                className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border border-sf-line bg-sf-surface px-4 py-3"
              >
                <LifeBuoy className="h-4 w-4 shrink-0 text-sf-amber" aria-hidden="true" />
                <p className="min-w-[12rem] flex-1 font-mono text-[12px] uppercase text-t1">
                  {recovery.kind === "recovered"
                    ? "UNSAVED WORDS RECOVERED FROM THIS DEVICE."
                    : "UNSAVED WORDS FOUND ON THIS DEVICE. THE SERVER COPY IS NEWER."}
                  <span className="mt-1 block font-sans text-[13px] normal-case text-t2">
                    {recovery.kind === "recovered"
                      ? "They are on screen and not yet saved. Keeping them files the copy they replace as a snapshot."
                      : "Nothing was changed. Restoring them files the current text as a snapshot first."}
                  </span>
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={keepRecovered}
                    className="min-h-hit border border-sf-primary bg-sf-primary/[0.06] px-3 font-sans text-[12px] font-medium uppercase text-sf-primary-text transition-colors duration-base hover:border-sf-line-emphasis"
                  >
                    {recovery.kind === "recovered" ? "Keep recovered" : "Restore"}
                  </button>
                  <button
                    type="button"
                    onClick={discardRecovered}
                    className="min-h-hit border border-sf-line px-3 font-sans text-[12px] font-medium uppercase text-t2 transition-colors duration-base hover:border-sf-line-emphasis hover:text-t1"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
            {doc && (
              <div className="relative">
              <CaptureGutter
                editor={editorState && editorState.docId === doc.id ? editorState.editor : null}
                paragraphs={capture.paragraphs}
                items={capture.items}
                hidden={focus || !worldId}
                onSelect={(item) => {
                  setInspector("continuity");
                  if (window.matchMedia("(max-width: 1023px)").matches) setMobilePanel("inspector");
                  // Re-set even when it is the same item, so it scrolls again.
                  setCaptureFocus(null);
                  requestAnimationFrame(() => setCaptureFocus(item.key));
                }}
              />
              <StellarForgeEditor
                onEditorReady={onEditorReady}
                key={doc.id}
                content={doc.content ?? ""}
                onChange={onContentChange}
                onDirty={onEditorDirty}
                worldId={worldId}
                preset="full"
                placeholder="Begin writing. Use @ to mention entities, [[ to link wiki pages…"
                page
                className={`sf-writing-serif${preferences.dropCap ? " sf-writing-dropcap" : ""}`}
                minHeight="55vh"
              />
              </div>
            )}
            {!doc && !docLoading && (
              <p className="font-serif text-[15px] italic text-t4">Select or create a document.</p>
            )}
          </div>
          )}
          {/* Typewriter scrolling needs room under the last line. */}
          {typewriterMain && <div aria-hidden="true" style={{ height: "50vh" }} />}
        </main>
        {showSplit && worldId && (
          <>
            <SplitDivider
              orientation={split.orientation}
              ratio={split.ratio}
              onRatio={(ratio) => updateSplit({ ratio })}
              containerRef={splitBoxRef}
            />
            <div className={`min-h-0 min-w-0 flex-1${fadeClass}`}>
              <SplitPane
                worldId={worldId}
                docs={readingDocs}
                excludeIds={effectiveView === "scrivenings" && scriv ? [...scriv.ids, ...(docId ? [docId] : [])] : docId ? [docId] : []}
                source={split.source}
                onSourceChange={(source) => updateSplit({ source })}
                orientation={split.orientation}
                onOrientationChange={(orientation) => updateSplit({ orientation })}
                onClose={() => updateSplit({ open: false })}
                editorClassName="sf-writing-serif"
                editorStyle={editorStyle}
                scrollRef={splitScrollRef}
                tailSpacer={preferences.typewriter}
                onWordsLedgered={refreshToday}
              />
            </div>
          </>
        )}
        </div>

        {/* inspector — the full entity/reference tool (desktop column) */}
        {!focus && worldId && (
          <aside className="hidden min-h-0 lg:block">{inspectorContent}</aside>
        )}
      </div>

      {/* status bar */}
      <footer className="flex items-center justify-between border-t border-sf-line-hairline pl-4 pr-20">
        {/* Save state: icon and words, never colour alone. A failed save
            used to read "Saved" here. */}
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          {saveState === "offline" ? (
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-sf-amber" aria-hidden="true" />
          ) : saveState === "retrying" ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-sf-crimson" aria-hidden="true" />
          ) : saveState === "saving" ? (
            <span className="h-1.5 w-1.5 shrink-0 bg-sf-primary animate-sf-pulse" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5 shrink-0 text-sf-primary" aria-hidden="true" />
          )}
          <span
            className={`font-mono text-[12px] uppercase ${
              saveState === "retrying"
                ? "text-sf-crimson-text"
                : saveState === "offline"
                  ? "text-sf-amber-text"
                  : "text-t3"
            }`}
          >
            {saveState === "offline"
              ? "OFFLINE · HELD ON THIS DEVICE"
              : saveState === "retrying"
                ? "UNSAVED, RETRYING"
                : saveState === "saving"
                  ? "SAVING"
                  : saveState === "saved"
                    ? `SAVED · ${savedAgo.toUpperCase()}`
                    : "READY"}
          </span>
        </div>
        {/* World-level canon line: documents citing what the world has since
            revised. Click filters the binder to them. */}
        {canonAffected > 0 && !focus && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCanonFilter(true);
              if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
                setMobilePanel("binder");
              }
            }}
            title="Show the affected documents in the binder"
            className="hidden min-h-hit min-w-0 items-center gap-1.5 px-2 font-mono text-[12px] uppercase text-sf-amber-text transition-colors duration-fast hover:text-t1 md:flex"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{canonSummaryLine(canonAffected)}</span>
          </button>
        )}
        {/* World-level contradiction count (charter 2.3). Opens the ledger. */}
        {capture.worldContradictions > 0 && !focus && (
          <button
            type="button"
            onClick={() => {
              setInspector("continuity");
              if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
                setMobilePanel("inspector");
              }
            }}
            title="Open the Contradiction Ledger"
            className="hidden min-h-hit min-w-0 items-center gap-1.5 px-2 font-mono text-[12px] uppercase text-sf-amber-text transition-colors duration-fast hover:text-t1 md:flex"
          >
            <span aria-hidden="true">≠</span>
            <span className="truncate">{contradictionSummaryLine(capture.worldContradictions)}</span>
          </button>
        )}
        {/* Progress toward today's goal, not an astronomical date. The editor
            already wrote session words to writing_sessions and never read them
            back, so the writer's own number was invisible while writing. */}
        <div className="flex items-center gap-3 font-mono text-[12px] tracking-wide text-t4">
          <span>{words.toLocaleString()} WORDS</span>
          <span aria-hidden="true">·</span>
          {/* Session (the daily goal, now with a per-session reset), document
              and project targets. Absorbs the old GoalSetting popover. */}
          <TargetsStatus
            session={session}
            docWords={words}
            docTarget={docMeta.target}
            manuscriptWords={manuscriptWords}
            project={project.value}
            projectLocal={project.isLocal}
            onProjectChange={(t) => project.save(t)}
          />
        </div>
      </footer>

      <SnapshotCompareDialog
        snapshot={comparing}
        currentHtml={comparing ? liveHtml() : ""}
        onOpenChange={(o) => !o && setComparing(null)}
        onRestore={restoreSnapshot}
      />
      <PromptDialog
        open={collectPrompt !== null}
        onOpenChange={(o) => !o && setCollectPrompt(null)}
        title={collectPrompt?.kind === "search" ? "SAVE SEARCH AS COLLECTION" : "COLLECT SELECTED DOCUMENTS"}
        description={
          collectPrompt?.kind === "search"
            ? "A saved search re-runs every time, so it stays current as the manuscript changes."
            : "A named set of documents, kept at the top of the binder."
        }
        label="Collection name"
        placeholder={collectPrompt?.kind === "search" ? searchQuery : "Act two"}
        defaultValue={collectPrompt?.kind === "search" ? searchQuery : ""}
        confirmLabel="Save collection"
        onSubmit={saveCollection}
      />
      <LabelManagerDialog
        open={labelsOpen}
        onOpenChange={setLabelsOpen}
        labels={labels}
        onSave={(next) => saveLabels(next)}
        saving={labelsSaving}
        local={labelsLocal}
      />
      {worldId && importOpen && (
        <Suspense fallback={null}>
          <ImportManuscriptDialog
            worldId={worldId}
            open={importOpen}
            onOpenChange={setImportOpen}
            onOpenDocument={(id) => openDoc(id)}
          />
        </Suspense>
      )}
      <InlineRefCards onOpenBeside={openBeside} />
    </div>
    </StudioWorldProvider>
  );
}

/** /write with no id — open the latest manuscript document, else Studio. */
export function WriteIndex(): JSX.Element {
  const { user, loading } = useAuth();
  const { data: latest, isLoading } = useLatestDoc();
  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (isLoading || loading) return <div />;
  return <Navigate to={latest ? `/write/${latest.id}` : "/studio"} replace />;
}

/** Legacy /worlds/:worldId/write → Studio editor on that world's latest doc.
 *  Unifies the old "Writing Space" into Studio (one writing surface). */
export function WorldWriteRedirect(): JSX.Element {
  const { worldId } = useParams<{ worldId: string }>();
  const { user, loading } = useAuth();
  const { data: entries, isLoading } = useWritingDocuments(worldId);
  const createDoc = useCreateDocument(worldId);
  const navigate = useNavigate();
  const kicked = useRef(false);
  // Carry ?import=1 through (the Studio's "Bring a manuscript" link).
  const [params] = useSearchParams();
  const suffix = params.get("import") === "1" ? "?import=1" : "";

  useEffect(() => {
    // Wait for auth. useWritingDocuments is gated only on worldId, so without
    // this guard `isLoading` can settle before the session resolves and a plain
    // navigation would fire a document-create for a signed-out visitor.
    if (loading || !user) return;
    if (isLoading || !worldId || kicked.current) return;

    const docs = (entries ?? []).filter((e) => e.entry_type !== "folder");
    if (docs.length > 0) {
      kicked.current = true;
      navigate(`/write/${docs[0].id}${suffix}`, { replace: true });
      return;
    }
    // Only latch once the create is under way, so a failure can retry instead
    // of stranding the user on the blank <div /> below.
    kicked.current = true;
    createDoc.mutate(
      { title: "Untitled", parentId: null },
      {
        onSuccess: (d) => navigate(`/write/${d.id}${suffix}`, { replace: true }),
        onError: () => { kicked.current = false; },
      },
    );
  }, [entries, isLoading, worldId, loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !user) return <Navigate to="/auth" replace />;
  return <div />;
}
