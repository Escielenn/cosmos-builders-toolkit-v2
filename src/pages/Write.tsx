/**
 * /write/:docId — the ONE writing surface (Studio editor).
 * Operates on world_entries documents (the manuscript store), with the
 * full entity/reference tool in the inspector. Register: WRITER (Lora).
 * Supersedes the old /worlds/:id/write "Writing Space" (which now
 * redirects here). SF-II: one writing model, no parallel tables.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { Wordmark } from "@/components/brand/Wordmark";
import { WritingEntityPanel } from "@/components/writing/WritingEntityPanel";
import { WorldInfluencePanel } from "@/components/writing/WorldInfluencePanel";
import { WorksheetFactsPanel } from "@/components/writing/WorksheetFactsPanel";
import { DocumentMetaBar } from "@/components/writing/DocumentMetaBar";
import { ContinuityPanel } from "@/components/writing/ContinuityPanel";
import { FindReplaceBar } from "@/components/writing/FindReplaceBar";
import { Corkboard } from "@/components/writing/Corkboard";
import { GoalSetting } from "@/components/writing/GoalSetting";
import type { Editor } from "@tiptap/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  compileManuscriptDocx,
  compileManuscriptMarkdown,
  compileManuscriptPlainText,
} from "@/lib/manuscript-compile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
  useSortable, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import {
  useWritingDocuments, useCreateDocument, useUpdateDocumentContent,
  useCreateFolder, useRenameDocument, useReorderDocuments,
  useDeleteDocument, useTrashedDocuments, useRestoreDocument,
  usePurgeDocument, purgeExpiredTrash, useUpdateDocumentMeta, useMoveDocument,
  useRenameFolder, useDeleteFolder,
} from "@/hooks/use-writing-documents";
import { Trash2, RotateCcw, X, FolderInput, MoreVertical, Plus } from "lucide-react";
import { useWriteDoc, useLatestDoc, rollWordSession, countWords } from "@/hooks/use-write-doc";
import { useSessionWords } from "@/hooks/use-session-words";
import { useWritingPreferences, type WritingFont } from "@/hooks/use-writing-preferences";
import { useWritingPins } from "@/hooks/use-writing-pins";
import { readDocMeta } from "@/lib/document-meta";
import type { Entity } from "@/services/entity-graph-types";
import type { WorldEntry } from "@/services/world-data";

// insert helpers (proven pattern from the mature editor)
function insertIntoEditor(text: string) {
  const el = document.querySelector(".tiptap") as HTMLElement | null;
  if (!el) return;
  el.focus();
  setTimeout(() => document.execCommand("insertText", false, text), 40);
}

export default function Write(): JSX.Element {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const { data: doc, isLoading: docLoading } = useWriteDoc(docId);
  const worldId = doc?.world_id;

  // `data` excludes folders by design, so folders/unfiledDocs must come from
  // the hook too. Re-deriving folders from `data` (as this once did) always
  // yielded an empty list, which made the folder UI dead code.
  const { data: entries, folders: folderRows, unfiledDocs } = useWritingDocuments(worldId);
  const updateContent = useUpdateDocumentContent(worldId);
  const createDoc = useCreateDocument(worldId);
  const createFolder = useCreateFolder(worldId);
  const reorderDocs = useReorderDocuments(worldId);
  const trashDoc = useDeleteDocument(worldId);
  const restoreDoc = useRestoreDocument(worldId);
  const purgeDoc = usePurgeDocument(worldId);
  const { data: trashed } = useTrashedDocuments(worldId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const renameDoc = useRenameDocument(worldId);
  const renameFolder = useRenameFolder(worldId);
  const deleteFolder = useDeleteFolder(worldId);
  const updateMeta = useUpdateDocumentMeta(worldId);
  const { addPin } = useWritingPins(worldId ?? "");
  const moveDoc = useMoveDocument(worldId);

  // Inline rename, shared by both folder headers and document rows in the
  // binder below — one piece of state, matching the pattern already proven
  // in ChapterTree.tsx (the version of this UI that was never routed; ported
  // here rather than left as unreachable dead code).
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const beginRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };
  const commitRename = (kind: "doc" | "folder") => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      if (kind === "doc") renameDoc.mutate({ docId: renamingId, title: trimmed });
      else renameFolder.mutate({ folderId: renamingId, title: trimmed });
    }
    setRenamingId(null);
  };
  const cancelRename = () => setRenamingId(null);
  const renameKeyDown = (kind: "doc" | "folder") => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitRename(kind);
    if (e.key === "Escape") cancelRename();
  };

  const [focus, setFocus] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  // Manuscript (single scene) vs Board (all scenes as index cards). Persisted
  // because a writer restructuring an act stays on the board across reloads.
  const [view, setView] = useState<"editor" | "board">(() => {
    try {
      return localStorage.getItem("sf-write-view") === "board" ? "board" : "editor";
    } catch {
      return "editor";
    }
  });
  useEffect(() => {
    try { localStorage.setItem("sf-write-view", view); } catch { /* no storage */ }
  }, [view]);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [inspector, setInspector] = useState<"entities" | "world" | "reference" | "continuity">("entities");
  const [mobilePanel, setMobilePanel] = useState<"binder" | "inspector" | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [words, setWords] = useState(0);
  const lastCount = useRef<number | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<{ docId: string; html: string; words: number } | null>(null);

  useEffect(() => {
    if (doc) {
      setTitle(doc.title ?? "");
      const w = countWords(doc.content);
      setWords(w);
      lastCount.current = w;
    }
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prev = document.title;
    document.title = doc?.title ? `${doc.title} · Studio` : "Write · Studio";
    return () => { document.title = prev; };
  }, [doc?.title]);

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
  // Chapters a scene can be filed into. useMoveDocument existed in the hooks
  // but was never wired up, so filing was impossible in the live editor.
  const chapterList = useMemo(
    () => folders.map((f) => ({ id: f.id, title: f.title })),
    [folders],
  );

  // Today's progress against the goal the writer already set in Studio.
  const { sessionWords, refresh: refreshSessionWords } = useSessionWords();
  const { preferences, updatePreferences } = useWritingPreferences();
  const dailyGoalWords = preferences.dailyGoalWords || 500;

  // Line-spacing + font are applied via inherited CSS on a wrapper div (the
  // editor takes no style prop), matching the pattern from the pre-Studio
  // writing surface this replaced.
  const editorStyle = useMemo(() => ({
    lineHeight: preferences.lineSpacing === "2" ? 2 : preferences.lineSpacing === "1.5" ? 1.625 : 1.5,
    fontFamily:
      preferences.writingFont === "Georgia" ? "Georgia, serif" :
      preferences.writingFont === "Merriweather" ? "'Merriweather', Georgia, serif" :
      preferences.writingFont === "Times New Roman" ? "'Times New Roman', Times, serif" :
      preferences.writingFont === "Courier New" ? "'Courier New', Courier, monospace" :
      preferences.writingFont === "Lora" ? "'Lora', Georgia, serif" :
      undefined,
  }), [preferences.lineSpacing, preferences.writingFont]);
  const goalPct = Math.min(100, Math.round((sessionWords / dailyGoalWords) * 100));
  const goalMet = sessionWords >= dailyGoalWords;

  // Card fields for the open document. metadata is untyped, so this tolerates
  // whatever is already in the column.
  const docMeta = useMemo(() => readDocMeta(doc?.metadata), [doc?.metadata]);

  // Commit any pending edit immediately.
  //
  // The pending payload carries its own docId: the debounce used to fire after
  // the doc-change effect had already rebased lastCount to the NEW document,
  // so the timer committed (old doc's words - new doc's baseline) to the streak
  // ledger and painted the old count while the new doc was on screen.
  const flushPending = useCallback(() => {
    if (debounce.current) {
      clearTimeout(debounce.current);
      debounce.current = undefined;
    }
    const p = pending.current;
    if (!p) return;
    pending.current = null;

    const delta =
      p.docId === docId && lastCount.current !== null ? p.words - lastCount.current : 0;
    if (p.docId === docId) {
      lastCount.current = p.words;
      setWords(p.words);
    }
    updateContent.mutate(
      { docId: p.docId, content: p.html },
      {
        onSuccess: () => {
          setSavedAt(new Date());
          if (user && delta > 0) {
            // Await nothing, but refresh the footer once the ledger is written
            // so today's total advances as you type instead of on next refetch.
            rollWordSession(user.id, delta).then(() => refreshSessionWords());
          }
        },
      },
    );
  }, [docId, updateContent, user, refreshSessionWords]);

  function onContentChange(html: string) {
    if (!docId) return;
    pending.current = { docId, html, words: countWords(html) };
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(flushPending, 1200);
  }

  // Commit before leaving the document, and before the tab closes — otherwise
  // the last <=1.2s of typing is silently lost.
  useEffect(() => flushPending, [docId, flushPending]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pending.current) return;
      flushPending();
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [flushPending]);

  // The live editor bound no shortcuts at all: Ctrl+S did nothing and focus
  // mode had no way out but the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flushPending();
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
  }, [flushPending, focus]);

  // Export just this document, reusing the manuscript exporters with a
  // single-chapter list so the formatting matches a compiled manuscript.
  const exportDoc = useCallback(
    async (format: "docx" | "md" | "txt") => {
      if (!doc) return;
      flushPending();

      const name = doc.title || "Untitled";
      const meta = {
        title: name,
        author: user?.user_metadata?.display_name ?? "Unknown Author",
      };
      const chapters = [{ id: doc.id, title: name, content: doc.content || "" }];
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
    [doc, user, flushPending, toast],
  );

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
  const openDoc = (id: string) => {
    navigate(`/write/${id}`);
    setMobilePanel(null);
  };

  // Reorder one list (a folder's docs, or unfiled) and persist sort_order.
  const reorderList = (list: WorldEntry[], activeId: string, overId: string) => {
    const oldIdx = list.findIndex((d) => d.id === activeId);
    const newIdx = list.findIndex((d) => d.id === overId);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
    reorderDocs.mutate(arrayMove(list, oldIdx, newIdx).map((d) => d.id));
  };

  // Shared binder content (renders in the desktop column AND the mobile sheet)
  const binderContent = (
    <div className="flex h-full min-h-0 flex-col border-r border-sf-line-interactive">
      <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto py-3">
        {folders.map((folder) => (
          <div key={folder.id} className="mb-2">
            <div className="group flex items-center gap-1 pr-1">
              {renamingId === folder.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename("folder")}
                  onKeyDown={renameKeyDown("folder")}
                  aria-label="Chapter name"
                  className="min-w-0 flex-1 bg-transparent px-3 py-1 font-heading text-[12px] uppercase tracking-[1.5px] text-t1 outline-none"
                />
              ) : (
                <button
                  onDoubleClick={() => beginRename(folder.id, folder.title)}
                  title="Double-click to rename"
                  className="min-w-0 flex-1 truncate px-3 py-1 text-left font-heading text-[12px] uppercase tracking-[1.5px] text-t3 hover:text-t1"
                >
                  {folder.title}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Chapter options for ${folder.title}`}
                    title="Chapter options"
                    className="shrink-0 p-1.5 text-t4 opacity-0 transition-opacity hover:text-sf-primary-text focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() =>
                      createDoc.mutate(
                        { title: "Untitled", parentId: folder.id },
                        { onSuccess: (d: WorldEntry) => openDoc(d.id) },
                      )
                    }
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" /> New document here
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => beginRename(folder.id, folder.title)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-sf-crimson-text focus:text-sf-crimson-text"
                    onClick={() => {
                      if (window.confirm(`Delete "${folder.title}"? Its documents move to Unfiled. This cannot be undone.`)) {
                        deleteFolder.mutate(folder.id);
                      }
                    }}
                  >
                    Delete chapter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => over && reorderList(folder.documents, String(active.id), String(over.id))}>
              <SortableContext items={folder.documents.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {folder.documents.map((d) => (
                  <SortableDocRow
                    key={d.id}
                    d={d}
                    active={d.id === docId}
                    onOpen={() => openDoc(d.id)}
                    onTrash={() => trashDoc.mutate(d.id)}
                    chapters={chapterList}
                    onMove={(folderId) => moveDoc.mutate({ docId: d.id, folderId })}
                    isRenaming={renamingId === d.id}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameBlur={() => commitRename("doc")}
                    onRenameKeyDown={renameKeyDown("doc")}
                    onBeginRename={() => beginRename(d.id, d.title || "Untitled")}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ))}
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => over && reorderList(unfiled, String(active.id), String(over.id))}>
          <SortableContext items={unfiled.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            {unfiled.map((d) => (
              <SortableDocRow
                key={d.id}
                d={d}
                active={d.id === docId}
                onOpen={() => openDoc(d.id)}
                onTrash={() => trashDoc.mutate(d.id)}
                chapters={chapterList}
                onMove={(folderId) => moveDoc.mutate({ docId: d.id, folderId })}
                isRenaming={renamingId === d.id}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameBlur={() => commitRename("doc")}
                onRenameKeyDown={renameKeyDown("doc")}
                onBeginRename={() => beginRename(d.id, d.title || "Untitled")}
              />
            ))}
          </SortableContext>
        </DndContext>
        {(entries?.length ?? 0) === 0 && (
          <p className="px-3 py-4 font-serif text-[13px] italic text-t4">No documents yet.</p>
        )}
        {(trashed?.length ?? 0) > 0 && (
          <div className="mt-3 border-t border-sf-line-interactive pt-2">
            <button
              onClick={() => setTrashOpen((o) => !o)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-heading text-[12px] uppercase tracking-[1.5px] text-t4 hover:text-t2"
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
                      className="shrink-0 p-1.5 text-t4 opacity-0 transition-opacity hover:text-sf-primary-text focus-visible:opacity-100 group-hover:opacity-100">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${d.title || "Untitled"}" forever? This cannot be undone.`)) {
                          purgeDoc.mutate(d.id);
                        }
                      }}
                      aria-label={`Delete ${d.title || "Untitled"} permanently`} title="Delete forever"
                      className="shrink-0 p-1.5 text-t4 opacity-0 transition-opacity hover:text-sf-crimson focus-visible:opacity-100 group-hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {worldId && (
        <div className="flex gap-1 border-t border-sf-line-interactive p-2">
          <button onClick={newDocument} className="min-h-[40px] flex-1 border border-sf-line-interactive px-2 py-1.5 text-[12px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">+ Document</button>
          <button onClick={() => createFolder.mutate("New folder")} className="min-h-[40px] flex-1 border border-sf-line-interactive px-2 py-1.5 text-[12px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">+ Folder</button>
        </div>
      )}
    </div>
  );

  // Shared inspector content (desktop column AND mobile sheet)
  const inspectorContent = worldId ? (
    <div className="sf-sb sf-sb--slim flex h-full min-h-0 flex-col overflow-y-auto border-l border-sf-line-interactive">
      <div className="flex border-b border-sf-line-interactive" role="tablist" aria-label="Inspector">
        {(["entities", "world", "reference", "continuity"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={inspector === t} onClick={() => setInspector(t)}
            className={`min-h-[44px] flex-1 border-b-2 px-2 py-2.5 text-[13px] capitalize transition-colors ${inspector === t ? "border-sf-primary text-t1" : "border-transparent text-t3 hover:text-t1"}`}>
            {t === "entities" ? "Entities" : t === "world" ? "World" : t === "reference" ? "Refs" : "Check"}
          </button>
        ))}
      </div>
      {inspector === "entities" && (
        <WritingEntityPanel
          worldId={worldId}
          open
          onToggle={() => {}}
          onInsertMention={(name) => insertIntoEditor(`@${name} `)}
          onInsertWikiLink={(name) => insertIntoEditor(`[[${name}]]`)}
          onPinEntity={(e: Entity) => {
            addPin({ id: e.id, type: "entity", title: e.name, content: e.description || e.summary || "" });
            toast({ title: `${e.name.toUpperCase()} PINNED.` });
          }}
          embedded
        />
      )}
      {inspector === "continuity" && (
        <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
          <ContinuityPanel
            worldId={worldId}
            content={doc?.content}
            entityId={docMeta.subjectEntityId || undefined}
            onSetEntityId={(id) =>
              docId && updateMeta.mutate({ docId, patch: { subjectEntityId: id } })
            }
          />
        </div>
      )}
      {inspector === "world" && (
        <WorldInfluencePanel worldId={worldId} content={doc?.content} />
      )}
      {inspector === "reference" && (
        <div className="flex h-full min-h-0 flex-col">
          <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
            <WorksheetFactsPanel worldId={worldId} onInsert={insertIntoEditor} />
          </div>
          <div className="border-t border-sf-line-interactive p-3">
            <Link to={`/worlds/${worldId}/wiki`} className="block border border-sf-line-interactive px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">Open the wiki →</Link>
            <Link to={`/worlds/${worldId}/connections`} className="mt-2 block border border-sf-line-interactive px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1">Open the entity graph →</Link>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative z-10 grid h-screen grid-rows-[44px_1fr_32px] bg-[hsl(var(--sf-void-hsl))]">
      {/* topbar */}
      <header className="flex items-center gap-3 border-b border-sf-line-interactive px-4">
        {/* explicit way back to the Studio overview */}
        <Link
          to="/studio"
          className="flex items-center gap-1.5 border border-sf-line-interactive px-2.5 py-1 text-[13px] text-t3 transition-colors hover:border-sf-primary hover:text-t1"
          title="Back to Studio"
        >
          <span aria-hidden="true">←</span> Studio
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
          <span className="hidden font-mono text-[12px] tracking-[1px] text-t4 sm:block">● {words.toLocaleString()} words</span>
          {/* mobile panel toggles — binder + inspector are sheets below lg */}
          {!focus && (
            <>
              <button onClick={() => setMobilePanel("binder")}
                className="border border-sf-line-interactive px-2.5 py-1 text-[12px] text-t3 transition-colors hover:border-sf-primary hover:text-t1 lg:hidden">
                Docs
              </button>
              {worldId && (
                <button onClick={() => setMobilePanel("inspector")}
                  className="border border-sf-line-interactive px-2.5 py-1 text-[12px] text-t3 transition-colors hover:border-sf-primary hover:text-t1 lg:hidden">
                  Inspector
                </button>
              )}
            </>
          )}
          {/* Per-document export. The compile page could export a whole
              manuscript, but a single document had no export path at all. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="border border-sf-line-interactive px-2.5 py-1 text-[12px] text-t3 transition-colors hover:text-t1"
                title="Export this document"
              >
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-none border-sf-line-interactive bg-sf-surface/95">
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
          <button
            onClick={() => setView(view === "board" ? "editor" : "board")}
            title="Index cards for every scene, to see the shape of the manuscript"
            className={`border px-2.5 py-1 text-[12px] transition-colors ${view === "board" ? "border-sf-primary text-sf-primary-text" : "border-sf-line-interactive text-t3 hover:text-t1"}`}>
            Board
          </button>
          <button onClick={() => setFocus(!focus)}
            title={focus ? "Leave focus mode (Esc)" : "Focus mode hides the binder and inspector. Press Esc to come back."}
            className={`border px-2.5 py-1 text-[12px] transition-colors ${focus ? "border-sf-primary text-sf-primary-text" : "border-sf-line-interactive text-t3 hover:text-t1"}`}>
            Focus
          </button>
        </div>
      </header>

      {/* mobile slide-over: binder */}
      <Sheet open={mobilePanel === "binder"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="left" className="w-[280px] border-sf-line-interactive bg-sf-surface/95 p-0">
          <div className="flex h-full flex-col pt-8">{binderContent}</div>
        </SheetContent>
      </Sheet>
      {/* mobile slide-over: inspector */}
      <Sheet open={mobilePanel === "inspector"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="right" className="w-[320px] border-sf-line-interactive bg-sf-surface/95 p-0">
          <div className="flex h-full flex-col pt-8">{inspectorContent}</div>
        </SheetContent>
      </Sheet>

      {/* body */}
      <div className={`grid min-h-0 ${focus ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[260px_1fr_320px]"}`}>
        {/* binder (desktop column) */}
        {!focus && (
          <aside className="hidden min-h-0 lg:flex">{binderContent}</aside>
        )}

        {/* editor */}
        <main className="sf-sb sf-sb--idle min-h-0 overflow-y-auto">
          {findOpen && view === "editor" && (
            <FindReplaceBar
              editor={editorInstance}
              onClose={() => setFindOpen(false)}
            />
          )}

          {view === "board" ? (
            <Corkboard
              folders={folders}
              unfiled={unfiled}
              activeDocId={docId}
              onOpen={(id) => { setView("editor"); openDoc(id); }}
              onReorder={(ids) => reorderDocs.mutate(ids)}
            />
          ) : (
          <div className="mx-auto max-w-[720px] px-6 py-10">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="Document title"
              className="w-full bg-transparent font-serif text-[30px] italic text-t1 outline-none placeholder:text-t4"
              aria-label="Document title"
            />
            {/* Index-card fields. Collapsed until opened so they never compete
                with the prose; these are what a corkboard/outliner will read. */}
            {doc && (
              <DocumentMetaBar
                meta={docMeta}
                onChange={(patch) => updateMeta.mutate({ docId: doc.id, patch })}
                disabled={updateMeta.isPending}
              />
            )}
            <div className="my-6 text-center text-t4" aria-hidden="true">· · ·</div>
            {doc && (
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-sans font-medium uppercase tracking-[1.5px] text-t4">Spacing</span>
                  <div className="flex">
                    {(["1", "1.5", "2"] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => updatePreferences({ lineSpacing: val })}
                        title={`${val === "1" ? "1x" : val === "1.5" ? "1.5x" : "2x"} line spacing`}
                        className={`border px-2 py-1 text-[12px] font-mono transition-colors ${val !== "1" ? "-ml-px" : ""} ${
                          preferences.lineSpacing === val
                            ? "border-sf-primary text-sf-primary-text"
                            : "border-sf-line-interactive text-t4 hover:text-t2"
                        }`}
                      >
                        {val === "1" ? "1x" : val === "1.5" ? "1.5x" : "2x"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-sans font-medium uppercase tracking-[1.5px] text-t4">Font</span>
                  <select
                    value={preferences.writingFont}
                    onChange={(e) => updatePreferences({ writingFont: e.target.value as WritingFont })}
                    aria-label="Editor font"
                    className="border border-sf-line-interactive bg-transparent px-2 py-1 text-[12px] text-t2 outline-none focus-visible:border-sf-primary"
                  >
                    <option value="DM Sans">DM Sans</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Lora">Lora</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
              </div>
            )}
            {doc && (
              <div style={editorStyle}>
                <StellarForgeEditor
                  onEditorReady={setEditorInstance}
                  key={doc.id}
                  content={doc.content ?? ""}
                  onChange={onContentChange}
                  worldId={worldId}
                  preset="full"
                  placeholder="Begin writing. Use @ to mention entities, [[ to link wiki pages…"
                  className="sf-writing-serif"
                  minHeight="55vh"
                />
              </div>
            )}
            {!doc && !docLoading && (
              <p className="font-serif text-[15px] italic text-t4">Select or create a document.</p>
            )}
          </div>
          )}
        </main>

        {/* inspector — the full entity/reference tool (desktop column) */}
        {!focus && worldId && (
          <aside className="hidden min-h-0 lg:block">{inspectorContent}</aside>
        )}
      </div>

      {/* status bar */}
      <footer className="flex items-center justify-between border-t border-sf-line-interactive px-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-sf-primary ${updateContent.isPending ? "animate-sf-pulse" : ""}`} aria-hidden="true" />
          <span className="font-serif text-[12px] italic text-t3">
            {updateContent.isPending ? "Saving…" : savedAt ? `Saved · ${savedAgo}` : "Ready"}
          </span>
        </div>
        {/* Progress toward today's goal, not an astronomical date. The editor
            already wrote session words to writing_sessions and never read them
            back, so the writer's own number was invisible while writing. */}
        <div className="flex items-center gap-3 font-mono text-[12px] tracking-[1.5px] text-t4">
          <span>{words.toLocaleString()} WORDS</span>
          <span aria-hidden="true">·</span>
          <span
            className={goalMet ? "text-sf-primary-text" : "text-t4"}
            title={`${sessionWords.toLocaleString()} words written today, goal ${dailyGoalWords.toLocaleString()}`}
          >
            {sessionWords.toLocaleString()} / {dailyGoalWords.toLocaleString()} TODAY
          </span>
          {/* The goal shown above used to be view-only — adjusting it meant
              leaving Studio for /workshop. GoalSetting is self-contained
              (own hook, own popover) so dropping it in costs nothing. */}
          <GoalSetting compact />
          <span className="hidden h-1 w-24 bg-white/10 sm:block" aria-hidden="true">
            <span
              className={`block h-full ${goalMet ? "bg-sf-primary" : "bg-sf-primary/50"}`}
              style={{ width: `${goalPct}%` }}
            />
          </span>
        </div>
      </footer>
    </div>
  );
}

function DocRow({ d, active, onOpen }: { d: WorldEntry; active: boolean; onOpen: () => void }): JSX.Element {
  return (
    <button onClick={onOpen}
      className={`flex w-full items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-left font-serif text-[13px] transition-colors ${active ? "border-sf-primary bg-sf-primary/[0.06] text-t1" : "border-transparent text-t2 hover:text-t1"}`}>
      <span className="truncate">{d.title || "Untitled"}</span>
    </button>
  );
}

/** Draggable binder row (dnd-kit). Short drag reorders; click opens; trash on hover. */
function SortableDocRow({
  d, active, onOpen, onTrash, chapters, onMove,
  isRenaming, renameValue, onRenameChange, onRenameBlur, onRenameKeyDown, onBeginRename,
}: {
  d: WorldEntry;
  active: boolean;
  onOpen: () => void;
  onTrash: () => void;
  /** Folders this scene can be filed into. */
  chapters?: { id: string; title: string }[];
  onMove?: (folderId: string | null) => void;
  isRenaming?: boolean;
  renameValue?: string;
  onRenameChange?: (value: string) => void;
  onRenameBlur?: () => void;
  onRenameKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBeginRename?: () => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: d.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`group flex touch-none items-center border-l-2 pr-1 transition-colors ${active ? "border-sf-primary bg-sf-primary/[0.06]" : "border-transparent hover:bg-white/[0.02]"}`}
    >
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange?.(e.target.value)}
          onBlur={onRenameBlur}
          onKeyDown={onRenameKeyDown}
          aria-label="Document title"
          className="min-w-0 flex-1 bg-transparent py-1.5 pl-3 pr-2 font-serif text-[13px] text-t1 outline-none"
        />
      ) : (
        <button
          onClick={onOpen}
          onDoubleClick={(e) => { e.stopPropagation(); onBeginRename?.(); }}
          {...attributes}
          {...listeners}
          className={`min-w-0 flex-1 truncate py-1.5 pl-3 pr-2 text-left font-serif text-[13px] ${active ? "text-t1" : "text-t2 hover:text-t1"}`}
        >
          {d.title || "Untitled"}
        </button>
      )}
      {chapters && chapters.length > 0 && onMove && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={`File ${d.title || "Untitled"} into a chapter`}
              title="File into a chapter"
              className="shrink-0 p-1.5 text-t4 opacity-0 transition-opacity hover:text-sf-primary-text focus-visible:opacity-100 group-hover:opacity-100"
            >
              <FolderInput className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[12px] uppercase tracking-[1.5px] text-t3">
              File into
            </DropdownMenuLabel>
            {chapters.map((c) => (
              <DropdownMenuItem
                key={c.id}
                disabled={d.parent_id === c.id}
                onClick={() => onMove(c.id)}
              >
                {c.title}
              </DropdownMenuItem>
            ))}
            {d.parent_id && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMove(null)}>
                  Remove from chapter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onTrash(); }}
        aria-label={`Move ${d.title || "Untitled"} to trash`}
        title="Move to trash"
        className="shrink-0 p-1.5 text-t4 opacity-0 transition-opacity hover:text-sf-crimson focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
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

  useEffect(() => {
    // Wait for auth. useWritingDocuments is gated only on worldId, so without
    // this guard `isLoading` can settle before the session resolves and a plain
    // navigation would fire a document-create for a signed-out visitor.
    if (loading || !user) return;
    if (isLoading || !worldId || kicked.current) return;

    const docs = (entries ?? []).filter((e) => e.entry_type !== "folder");
    if (docs.length > 0) {
      kicked.current = true;
      navigate(`/write/${docs[0].id}`, { replace: true });
      return;
    }
    // Only latch once the create is under way, so a failure can retry instead
    // of stranding the user on the blank <div /> below.
    kicked.current = true;
    createDoc.mutate(
      { title: "Untitled", parentId: null },
      {
        onSuccess: (d) => navigate(`/write/${d.id}`, { replace: true }),
        onError: () => { kicked.current = false; },
      },
    );
  }, [entries, isLoading, worldId, loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !user) return <Navigate to="/auth" replace />;
  return <div />;
}
