/**
 * useToolWorksheet — the one save path for every worksheet tool page.
 *
 * Owns: loading by ?worksheetId= / world, create-on-first-save, rename,
 * tags, the signed-out browser draft (and filing it on sign-in), optional
 * debounced draft autosave, dirty tracking for the unsaved-changes guard,
 * and the post-save hook a page uses for its canon emit. The rules
 * themselves are pure and live in lib/tool-worksheet.
 *
 * A page keeps its own form shape: it hands over a codec (defaults,
 * hydrate, serialize) and gets back `state` / `setState` plus props to
 * spread on ToolPageLayout and WorksheetSelectorDialog.
 *
 * Ctrl/Cmd+S is wired in ToolPageLayout and calls `save` via onSave.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTags } from "@/hooks/use-tags";
import { useWorldId } from "@/hooks/use-world-id";
import {
  useRenameWorksheet,
  useWorksheet,
  useWorksheets,
  useWorksheetsByType,
  type Worksheet,
} from "@/hooks/use-worksheets";
import { mapError, VOICE } from "@/lib/ship-voice";
import {
  clearUnfiled,
  hasUnfiledDraft,
  LOCAL_MODE_NOTICE,
  readDraft,
  saveRoute,
  shouldLoadDraft,
  shouldMigrateDraft,
  stateKey,
  withWorksheetParams,
  writeDraft,
  type ToolWorksheetCodec,
} from "@/lib/tool-worksheet";

export interface UseToolWorksheetOptions<S> extends ToolWorksheetCodec<S> {
  /** Display name, used as the title of a sheet created on first save. */
  displayName: string;
  /** Browser draft key. Omit for a tool with no browser draft. */
  localKey?: string;
  /** Read a browser draft. Defaults to `hydrate`. */
  hydrateDraft?: (raw: unknown, defaults: S) => S;
  /** Title for a sheet created on first save. Falls back to displayName. */
  titleFor?: (state: S) => string | null | undefined;
  /** Dirty-tracking key. Defaults to JSON of the whole state. */
  dirtyKey?: (state: S) => string;
  /** Debounced browser-draft autosave (standalone mode), for tools that had one. */
  autosaveDraftMs?: number;
  /** After a successful cloud save (canon emit lives here). Errors are the caller's to report. */
  onSaved?: (state: S, ctx: { worksheetId: string; created: boolean }) => void | Promise<void>;
  /** After any new sheet is created (first save, selector, draft filing). */
  onCreated?: (worksheetId: string) => void;
  /** After a cloud worksheet is hydrated into the page. */
  onLoaded?: (worksheet: Worksheet, state: S) => void;
  /** Passed to useWorksheets: entity-match check after the draft wiki page syncs. */
  onDraftCreated?: (worksheetId: string, title: string) => void;
  /** Toast when a cloud worksheet opens (Goldilocks and a few others did). */
  loadedToast?: boolean;
  /** Open the selector when a world is bound with no worksheet. Default true. */
  autoOpenSelector?: boolean;
}

export interface ToolWorksheet<S> {
  state: S;
  setState: Dispatch<SetStateAction<S>>;
  worldId: string | null;
  /** The open sheet: the one this page created or loaded, else the URL's. */
  worksheetId: string | null;
  worksheetTitle: string | null;
  tags: string[];
  /** The URL-requested sheet is still loading. */
  isLoading: boolean;
  /** This tool's sheets in the bound world (for the selector). */
  worksheets: Worksheet[];
  worksheetsLoading: boolean;
  dirty: boolean;
  isSaving: boolean;
  /** Signed in with a world: saves reach the cloud. */
  isCloud: boolean;
  isLoggedIn: boolean;
  save: () => Promise<void>;
  rename: (title: string) => Promise<void>;
  setTags: (tags: string[]) => void;
  /** Point the page at a sheet (selector pick). */
  select: (worksheetId: string) => void;
  /** Create a named sheet from the page's current state (selector create). */
  create: (name: string) => Promise<string>;
  /** Treat the current state as saved (after a page-specific write). */
  markSaved: (state?: S) => void;
  selectorOpen: boolean;
  setSelectorOpen: (open: boolean) => void;
  createWorksheet: ReturnType<typeof useWorksheets>["createWorksheet"];
  updateWorksheet: ReturnType<typeof useWorksheets>["updateWorksheet"];
  /** Spread on ToolPageLayout. */
  layoutProps: {
    onSave: () => void;
    onOpen: (() => void) | undefined;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    isCloudEnabled: boolean;
    worksheetId: string | null;
    worksheetTitle: string | null;
    onRenameWorksheet: (title: string) => Promise<void>;
    worksheetLoading: boolean;
    worksheetTags: string[];
    onTagsChange: (tags: string[]) => void;
    isLoggedIn: boolean;
  };
  /** Spread on WorksheetSelectorDialog (add toolDisplayName / worldName). */
  selectorProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    worldId: string;
    toolType: string;
    worksheets: { id: string; title: string | null; updated_at: string; tags?: string[] }[];
    isLoading: boolean;
    onSelect: (worksheetId: string) => void;
    onCreate: (name: string) => Promise<string>;
  };
}

export function useToolWorksheet<S>(toolType: string, options: UseToolWorksheetOptions<S>): ToolWorksheet<S> {
  const { defaults, serialize, displayName, localKey, autosaveDraftMs, loadedToast } = options;
  const autoOpenSelector = options.autoOpenSelector ?? true;
  // Callbacks change identity every render; read them through a ref.
  const opts = useRef(options);
  opts.current = options;

  const { user, loading: authLoading } = useAuth();
  const signedIn = !!user;
  const { toast } = useToast();
  const worldId = useWorldId();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlWorksheetId = searchParams.get("worksheetId");

  const [state, setState] = useState<S>(defaults);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [tags, setTagsState] = useState<string[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const keyOf = useCallback((s: S) => (opts.current.dirtyKey ?? stateKey)(s), []);
  const [savedKey, setSavedKey] = useState<string>(() => keyOf(defaults));
  const [defaultsKey] = useState<string>(() => keyOf(defaults));
  /** Still showing the untouched defaults (so a browser draft may replace it). */
  const pristine = useRef(true);
  pristine.current = keyOf(state) === defaultsKey;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: (id, t) => opts.current.onDraftCreated?.(id, t),
  });
  const { data: loaded, isLoading: loadingSheet } = useWorksheet(urlWorksheetId || undefined);
  const { data: sheets = [], isLoading: sheetsLoading } = useWorksheetsByType(worldId || undefined, toolType);
  const renameMutation = useRenameWorksheet();
  const { updateWorksheetTags } = useTags();

  const worksheetId = currentId || urlWorksheetId;
  const isCloud = !!(worldId && signedIn);

  // ── Load: a cloud worksheet ────────────────────────────────────────
  useEffect(() => {
    if (!loaded || loaded.data == null) return;
    let next: S;
    try {
      next = opts.current.hydrate(loaded.data, opts.current.defaults);
    } catch {
      toast({ title: VOICE.genericError, description: "WORKSHEET DATA UNREADABLE.", variant: "destructive" });
      return;
    }
    setState(next);
    setSavedKey(keyOf(next));
    setCurrentId(loaded.id);
    setTitle(loaded.title);
    setTagsState(loaded.tags ?? []);
    opts.current.onLoaded?.(loaded, next);
    if (loadedToast) toast({ title: "WORKSHEET LOADED.", description: "WORK RESTORED FROM CLOUD." });
    // Only a newly fetched row reloads the page; edits are never overwritten by a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ── Load: the browser draft (standalone mode) ──────────────────────
  const draftLoadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!localKey) return;
    const ctx = { worldId, worksheetId: urlWorksheetId, signedIn, authLoading };
    if (!shouldLoadDraft(ctx)) return;
    const k = `${worldId ?? ""}|${signedIn}`;
    if (draftLoadedFor.current === k) return;
    draftLoadedFor.current = k;
    const raw = readDraft(localKey);
    if (raw == null) return;
    // Never replace edits already made on this page.
    if (pristine.current === false) return;
    try {
      const next = (opts.current.hydrateDraft ?? opts.current.hydrate)(raw, opts.current.defaults);
      setState(next);
      setSavedKey(keyOf(next));
    } catch {
      // Corrupt draft: start from defaults.
    }
  }, [localKey, worldId, urlWorksheetId, signedIn, authLoading, keyOf]);

  // ── File a signed-out draft once signed in with a world ────────────
  const migrating = useRef(false);
  const unfiled = !!localKey && hasUnfiledDraft(localKey);
  const migrate = shouldMigrateDraft({ worldId, worksheetId, signedIn }, unfiled);
  useEffect(() => {
    if (!migrate || !localKey || !worldId || migrating.current) return;
    const raw = readDraft(localKey);
    if (raw == null) {
      clearUnfiled(localKey);
      return;
    }
    migrating.current = true;
    let draft: S;
    try {
      draft = (opts.current.hydrateDraft ?? opts.current.hydrate)(raw, opts.current.defaults);
    } catch {
      clearUnfiled(localKey);
      migrating.current = false;
      return;
    }
    const name = opts.current.titleFor?.(draft)?.trim() || displayName;
    createWorksheet
      .mutateAsync({ worldId, toolType, title: name, data: opts.current.serialize(draft) })
      .then((ws) => {
        clearUnfiled(localKey);
        setState(draft);
        setSavedKey(keyOf(draft));
        setCurrentId(ws.id);
        opts.current.onCreated?.(ws.id);
        setTitle(ws.title);
        setTagsState(ws.tags ?? []);
        setSelectorOpen(false);
        setSearchParams(withWorksheetParams(searchParams, worldId, ws.id), { replace: true });
        toast({ title: "LOCAL DRAFT FILED.", description: "SIGNED-OUT WORK SECURED TO THIS WORLD." });
        return opts.current.onSaved?.(draft, { worksheetId: ws.id, created: true });
      })
      .catch(() => {
        // createWorksheet reports the failure in Ship's Voice; the draft and its marker stay.
      })
      .finally(() => {
        migrating.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migrate, localKey, worldId]);

  // ── Selector: a world with no sheet open asks which one ────────────
  useEffect(() => {
    if (autoOpenSelector && worldId && !urlWorksheetId && !sheetsLoading && signedIn && !migrate) {
      setSelectorOpen(true);
    }
  }, [autoOpenSelector, worldId, urlWorksheetId, sheetsLoading, signedIn, migrate]);

  // ── Debounced browser-draft autosave ───────────────────────────────
  // Only real edits are written, and never before auth has settled and the
  // draft has had its chance to load: an early write of the defaults would
  // overwrite the very draft about to be restored.
  const pendingEdit = keyOf(state) !== savedKey;
  useEffect(() => {
    if (!localKey || !autosaveDraftMs || authLoading || !pendingEdit) return;
    const t = window.setTimeout(() => {
      writeDraft(localKey, state, { worldId, signedIn });
    }, autosaveDraftMs);
    return () => window.clearTimeout(t);
    // worldId/user come from the same render as state; a context change alone is not an edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Save ───────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    const snapshot = state;
    let draftFailed = false;
    if (localKey) draftFailed = writeDraft(localKey, snapshot, { worldId, signedIn }) === "failed";

    const route = saveRoute({ worldId, signedIn, worksheetId });
    if (route === "local") {
      if (draftFailed || !localKey) {
        toast({ title: VOICE.saveFailed, description: LOCAL_MODE_NOTICE, variant: "destructive" });
        return;
      }
      setSavedKey(keyOf(snapshot));
      toast(
        signedIn
          ? { title: "DRAFT SAVED.", description: "WORK SECURED TO LOCAL STORAGE." }
          : { title: "DRAFT SAVED.", description: LOCAL_MODE_NOTICE },
      );
      return;
    }

    try {
      let id = worksheetId!;
      if (route === "update") {
        await updateWorksheet.mutateAsync({ worksheetId: id, data: serialize(snapshot) });
      } else {
        const name = opts.current.titleFor?.(snapshot)?.trim() || displayName;
        const ws = await createWorksheet.mutateAsync({
          worldId: worldId!,
          toolType,
          title: name,
          data: serialize(snapshot),
        });
        id = ws.id;
        setCurrentId(ws.id);
        opts.current.onCreated?.(ws.id);
        setTitle(ws.title);
        setSearchParams(withWorksheetParams(searchParams, worldId, ws.id));
      }
      if (localKey) clearUnfiled(localKey);
      setSavedKey(keyOf(snapshot));
      try {
        await opts.current.onSaved?.(snapshot, { worksheetId: id, created: route === "create" });
      } catch (err) {
        toast({ title: VOICE.genericError, description: mapError(err), variant: "destructive" });
      }
    } catch {
      // The worksheet mutation reports its own failure in Ship's Voice (mapError).
    }
  }, [state, localKey, worldId, signedIn, worksheetId, toast, keyOf, updateWorksheet, createWorksheet, serialize, displayName, toolType, setSearchParams, searchParams]);

  const select = useCallback(
    (id: string) => {
      setSearchParams(withWorksheetParams(searchParams, worldId, id));
      setSelectorOpen(false);
    },
    [searchParams, setSearchParams, worldId],
  );

  const create = useCallback(
    async (name: string): Promise<string> => {
      // The new sheet starts from what is on the page (defaults on a fresh
      // page), so work done before a world was chosen is never thrown away
      // when the new row loads back in.
      const snapshot = state;
      const ws = await createWorksheet.mutateAsync({
        worldId: worldId!,
        toolType,
        title: name,
        data: serialize(snapshot),
      });
      setCurrentId(ws.id);
      opts.current.onCreated?.(ws.id);
      setTitle(ws.title);
      setSavedKey(keyOf(snapshot));
      if (localKey) clearUnfiled(localKey);
      setSearchParams(withWorksheetParams(searchParams, worldId, ws.id));
      return ws.id;
    },
    [state, createWorksheet, worldId, toolType, serialize, keyOf, localKey, setSearchParams, searchParams],
  );

  const rename = useCallback(
    async (next: string) => {
      if (!worksheetId) return;
      await renameMutation.mutateAsync({ worksheetId, title: next });
      setTitle(next);
    },
    [worksheetId, renameMutation],
  );

  const setTags = useCallback(
    (next: string[]) => {
      setTagsState(next);
      if (worksheetId) updateWorksheetTags.mutate({ worksheetId, tags: next });
    },
    [worksheetId, updateWorksheetTags],
  );

  const markSaved = useCallback((s?: S) => setSavedKey(keyOf(s ?? state)), [keyOf, state]);

  const dirty = useMemo(() => keyOf(state) !== savedKey, [keyOf, state, savedKey]);
  const isSaving = createWorksheet.isPending || updateWorksheet.isPending;
  const onSave = useCallback(() => {
    void save();
  }, [save]);
  const openSelector = useCallback(() => setSelectorOpen(true), []);

  const selectorSheets = useMemo(
    () => sheets.map((w) => ({ id: w.id, title: w.title, updated_at: w.updated_at, tags: w.tags || undefined })),
    [sheets],
  );

  return {
    state,
    setState,
    worldId,
    worksheetId,
    worksheetTitle: title,
    tags,
    isLoading: !!urlWorksheetId && loadingSheet,
    worksheets: sheets,
    worksheetsLoading: sheetsLoading,
    dirty,
    isSaving,
    isCloud,
    isLoggedIn: signedIn,
    save,
    rename,
    setTags,
    select,
    create,
    markSaved,
    selectorOpen,
    setSelectorOpen,
    createWorksheet,
    updateWorksheet,
    layoutProps: {
      onSave,
      onOpen: worldId ? openSelector : undefined,
      hasUnsavedChanges: dirty,
      isSaving,
      isCloudEnabled: isCloud,
      worksheetId,
      worksheetTitle: title,
      onRenameWorksheet: rename,
      worksheetLoading: !!urlWorksheetId && loadingSheet,
      worksheetTags: tags,
      onTagsChange: setTags,
      isLoggedIn: signedIn,
    },
    selectorProps: {
      open: selectorOpen,
      onOpenChange: setSelectorOpen,
      worldId: worldId || "",
      toolType,
      worksheets: selectorSheets,
      isLoading: sheetsLoading,
      onSelect: select,
      onCreate: create,
    },
  };
}
