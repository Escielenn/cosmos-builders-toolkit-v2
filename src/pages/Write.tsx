/**
 * /write/:docId — the ONE writing surface (Studio editor).
 * Operates on world_entries documents (the manuscript store), with the
 * full entity/reference tool in the inspector. Register: WRITER (Lora).
 * Supersedes the old /worlds/:id/write "Writing Space" (which now
 * redirects here). SF-II: one writing model, no parallel tables.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { WritingEntityPanel } from "@/components/writing/WritingEntityPanel";
import { useToast } from "@/hooks/use-toast";
import {
  useWritingDocuments, useCreateDocument, useUpdateDocumentContent,
  useCreateFolder, useRenameDocument,
} from "@/hooks/use-writing-documents";
import { useWriteDoc, useLatestDoc, rollWordSession, countWords } from "@/hooks/use-write-doc";
import type { Entity } from "@/services/entity-graph-types";
import type { WorldEntry } from "@/services/world-data";

function julianDay(): number {
  return Math.round((Date.now() / 86_400_000 + 2440587.5) * 10) / 10;
}

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

  const { data: entries } = useWritingDocuments(worldId);
  const updateContent = useUpdateDocumentContent(worldId);
  const createDoc = useCreateDocument(worldId);
  const createFolder = useCreateFolder(worldId);
  const renameDoc = useRenameDocument(worldId);

  const [focus, setFocus] = useState(false);
  const [inspector, setInspector] = useState<"entities" | "reference">("entities");
  const [title, setTitle] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [words, setWords] = useState(0);
  const lastCount = useRef<number | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

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
    document.title = doc?.title ? `${doc.title} — Studio` : "Write — Studio";
    return () => { document.title = prev; };
  }, [doc?.title]);

  // group binder: folders → their docs; unfiled docs at root
  const { folders, unfiled } = useMemo(() => {
    const all = entries ?? [];
    const fol = all.filter((e) => e.entry_type === "folder");
    const docs = all.filter((e) => e.entry_type !== "folder");
    return {
      folders: fol.map((f) => ({ folder: f, docs: docs.filter((d) => d.parent_id === f.id) })),
      unfiled: docs.filter((d) => !d.parent_id || !fol.some((f) => f.id === d.parent_id)),
    };
  }, [entries]);

  function onContentChange(html: string) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if (!docId) return;
      const w = countWords(html);
      const delta = lastCount.current === null ? 0 : w - lastCount.current;
      lastCount.current = w;
      setWords(w);
      updateContent.mutate(
        { docId, content: html },
        {
          onSuccess: () => {
            setSavedAt(new Date());
            if (user && delta > 0) rollWordSession(user.id, delta);
          },
        },
      );
    }, 1200);
  }

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

  return (
    <div className="relative z-10 grid h-screen grid-rows-[44px_1fr_32px] bg-[hsl(var(--sf-void))]">
      {/* topbar */}
      <header className="flex items-center gap-3 border-b border-sf-border px-4">
        {/* explicit way back to the Studio overview */}
        <Link
          to="/studio"
          className="flex items-center gap-1.5 border border-sf-border px-2.5 py-1 text-[12px] text-t3 transition-colors hover:border-sf-teal hover:text-t1"
          title="Back to all your projects"
        >
          <span aria-hidden="true">←</span> Studio
        </Link>
        <Link to="/studio" className="hidden items-baseline gap-1.5 sm:flex">
          <span className="font-display text-[14px] font-light tracking-sf-title text-t1">
            <span className="text-sf-teal">Stellar</span>forge
          </span>
          <span className="font-serif text-[13px] italic text-t2">Studio</span>
        </Link>
        <div className="hidden min-w-0 items-baseline gap-2 text-[12px] text-t4 md:flex">
          <span className="text-t5">/</span>
          {worldId && (
            <>
              <Link to={`/worlds/${worldId}`} className="hover:text-t2">World</Link>
              <span className="text-t5">/</span>
            </>
          )}
          <span className="truncate font-serif italic text-t2">{doc?.title || "Untitled"}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-[10px] tracking-[1px] text-t4 sm:block">● {words.toLocaleString()} words</span>
          <button onClick={() => setFocus(!focus)}
            className={`border px-2.5 py-1 text-[11px] transition-colors ${focus ? "border-sf-teal text-sf-teal" : "border-sf-border text-t3 hover:text-t1"}`}>
            Focus
          </button>
        </div>
      </header>

      {/* body */}
      <div className={`grid min-h-0 ${focus ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[260px_1fr_320px]"}`}>
        {/* binder */}
        {!focus && (
          <aside className="sf-sb sf-sb--slim hidden min-h-0 flex-col overflow-y-auto border-r border-sf-border lg:flex">
            <div className="flex-1 py-3">
              {folders.map(({ folder, docs }) => (
                <div key={folder.id} className="mb-2">
                  <div className="px-3 py-1 font-heading text-[11px] uppercase tracking-[1.5px] text-t4">{folder.title}</div>
                  {docs.map((d) => (
                    <DocRow key={d.id} d={d} active={d.id === docId} onOpen={() => navigate(`/write/${d.id}`)} />
                  ))}
                </div>
              ))}
              {unfiled.map((d) => (
                <DocRow key={d.id} d={d} active={d.id === docId} onOpen={() => navigate(`/write/${d.id}`)} />
              ))}
              {(entries?.length ?? 0) === 0 && (
                <p className="px-3 py-4 font-serif text-[13px] italic text-t4">No documents yet.</p>
              )}
            </div>
            {worldId && (
              <div className="flex gap-1 border-t border-sf-border p-2">
                <button onClick={newDocument} className="flex-1 border border-sf-border px-2 py-1.5 text-[11px] text-t2 transition-colors hover:border-sf-teal hover:text-t1">+ Document</button>
                <button onClick={() => createFolder.mutate("New folder")} className="flex-1 border border-sf-border px-2 py-1.5 text-[11px] text-t2 transition-colors hover:border-sf-teal hover:text-t1">+ Folder</button>
              </div>
            )}
          </aside>
        )}

        {/* editor */}
        <main className="sf-sb sf-sb--idle min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-6 py-10">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="Document title"
              className="w-full bg-transparent font-serif text-[30px] italic text-t1 outline-none placeholder:text-t4"
              aria-label="Document title"
            />
            <div className="my-6 text-center text-t5" aria-hidden="true">· · ·</div>
            {doc && (
              <StellarForgeEditor
                key={doc.id}
                content={doc.content ?? ""}
                onChange={onContentChange}
                worldId={worldId}
                preset="full"
                placeholder="Begin writing. Use @ to mention entities, [[ to link wiki pages…"
                className="sf-writing-serif"
                minHeight="55vh"
              />
            )}
            {!doc && !docLoading && (
              <p className="font-serif text-[15px] italic text-t4">Select or create a document.</p>
            )}
          </div>
        </main>

        {/* inspector — the full entity/reference tool */}
        {!focus && worldId && (
          <aside className="sf-sb sf-sb--slim hidden min-h-0 overflow-y-auto border-l border-sf-border lg:block">
            <div className="flex border-b border-sf-border" role="tablist" aria-label="Inspector">
              {(["entities", "reference"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={inspector === t} onClick={() => setInspector(t)}
                  className={`flex-1 border-b-2 px-3 py-2.5 text-[12px] capitalize transition-colors ${inspector === t ? "border-sf-teal text-t1" : "border-transparent text-t3 hover:text-t1"}`}>
                  {t === "entities" ? "Entities" : "References"}
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
                onPinEntity={(e: Entity) => toast({ title: `Pinned ${e.name}` })}
                embedded
              />
            )}
            {inspector === "reference" && (
              <div className="p-4">
                <p className="mb-3 font-serif text-[13px] italic text-t4">
                  Notes, worksheets, and pinned references from this world.
                </p>
                <Link to={`/worlds/${worldId}/wiki`} className="block border border-sf-border px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1">Open the wiki →</Link>
                <Link to={`/worlds/${worldId}/graph`} className="mt-2 block border border-sf-border px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1">Open the entity graph →</Link>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* status bar */}
      <footer className="flex items-center justify-between border-t border-sf-border px-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-sf-teal ${updateContent.isPending ? "animate-sf-pulse" : ""}`} aria-hidden="true" />
          <span className="font-serif text-[11px] italic text-t3">
            {updateContent.isPending ? "Saving…" : savedAt ? `Saved · ${Math.max(1, Math.round((Date.now() - savedAt.getTime()) / 1000))}s ago` : "Ready"}
          </span>
        </div>
        <div className="font-mono text-[9px] tracking-[1.5px] text-t5">{words.toLocaleString()} WORDS · JD {julianDay().toFixed(1)}</div>
      </footer>
    </div>
  );
}

function DocRow({ d, active, onOpen }: { d: WorldEntry; active: boolean; onOpen: () => void }): JSX.Element {
  return (
    <button onClick={onOpen}
      className={`flex w-full items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-left font-serif text-[13px] transition-colors ${active ? "border-sf-teal bg-sf-teal/[0.06] text-t1" : "border-transparent text-t2 hover:text-t1"}`}>
      <span className="truncate">{d.title || "Untitled"}</span>
    </button>
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
    if (isLoading || !worldId || kicked.current) return;
    const docs = (entries ?? []).filter((e) => e.entry_type !== "folder");
    kicked.current = true;
    if (docs.length > 0) {
      navigate(`/write/${docs[0].id}`, { replace: true });
    } else {
      createDoc.mutate(
        { title: "Untitled", parentId: null },
        { onSuccess: (d) => navigate(`/write/${d.id}`, { replace: true }) },
      );
    }
  }, [entries, isLoading, worldId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !user) return <Navigate to="/auth" replace />;
  return <div />;
}
