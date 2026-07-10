/**
 * /write/:entryId — the manuscript editor (Implementation Guide §4).
 * Reference: design/Writing.html. Register: WRITER (Lora voice).
 * Grid: 44px topbar / 1fr / 32px statusbar × binder / editor / inspector.
 * Content lives in writing_entries (the single writing model);
 * @-mentions and wiki-links come from StellarForgeEditor.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { useEntities } from "@/hooks/use-entity-graph";
import { ENTITY_TYPE_COLORS } from "@/services/entity-graph-types";
import {
  useScene, useSaveScene, useBinder, useBinderMutations,
  useScenePins, usePinMutations, useLatestEntryId,
  countWords, STATUS_DOT,
  type BinderNode, type SceneEntry, type SceneStatus,
} from "@/hooks/useManuscript";

type Mode = "outline" | "editor" | "corkboard";

function julianDay(): number {
  return Math.round((Date.now() / 86_400_000 + 2440587.5) * 10) / 10;
}

// ── binder tree ─────────────────────────────────────────────────────

function BinderRow({ node, depth, activeEntryId, childrenOf, onOpen }: {
  node: BinderNode; depth: number; activeEntryId?: string;
  childrenOf: (id: string) => BinderNode[]; onOpen: (n: BinderNode) => void;
}): JSX.Element {
  const [open, setOpen] = useState(true);
  const kids = childrenOf(node.id);
  const isScene = node.kind === "scene";
  const active = isScene && node.entry_id === activeEntryId;
  return (
    <div>
      <button
        onClick={() => (isScene ? onOpen(node) : setOpen(!open))}
        className={`flex w-full items-center gap-2 border-l-2 py-1.5 pr-2 text-left transition-colors ${
          active ? "border-sf-teal bg-sf-teal/[0.06] text-t1" : "border-transparent text-t2 hover:text-t1"
        }`}
        style={{ paddingLeft: 10 + depth * 14 }}
      >
        {!isScene && (
          <span className="text-[9px] text-t4">{open ? "▾" : "▸"}</span>
        )}
        <span className={
          node.kind === "book" ? "font-display text-[12px] uppercase tracking-[1.5px]"
          : node.kind === "chapter" ? "font-serif text-[13px] italic"
          : isScene ? "font-serif text-[13px]"
          : "text-[12px] uppercase tracking-[1px] text-t3"
        }>
          {node.title}
        </span>
        {isScene && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_DOT.draft1 }} aria-hidden="true" />
        )}
      </button>
      {open && kids.map((k) => (
        <BinderRow key={k.id} node={k} depth={depth + 1} activeEntryId={activeEntryId} childrenOf={childrenOf} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────

export default function Write(): JSX.Element {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const { data: scene } = useScene(entryId);
  const worldId = scene?.world_id ?? null;
  const save = useSaveScene(entryId);
  const { data: binder } = useBinder(worldId);
  const { createNode, createScene } = useBinderMutations(worldId);
  const { data: pins } = useScenePins(entryId);
  const { pin, unpin } = usePinMutations(entryId);
  const { data: entities } = useEntities(worldId ?? undefined);

  const [mode, setMode] = useState<Mode>("editor");
  const [focus, setFocus] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"synopsis" | "refs">("synopsis");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [pinSearch, setPinSearch] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastCount = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (scene) {
      setTitle(scene.title ?? "");
      setSynopsis(scene.synopsis ?? "");
      lastCount.current = scene.word_count ?? 0;
    }
  }, [scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prev = document.title;
    document.title = scene?.title ? `${scene.title} — Studio` : "Write — Studio";
    return () => { document.title = prev; };
  }, [scene?.title]);

  const nodesByParent = useMemo(() => {
    const map = new Map<string | null, BinderNode[]>();
    for (const n of binder?.nodes ?? []) {
      const arr = map.get(n.parent_id) ?? [];
      arr.push(n);
      map.set(n.parent_id, arr);
    }
    return map;
  }, [binder?.nodes]);
  const childrenOf = (id: string) => nodesByParent.get(id) ?? [];
  const roots = nodesByParent.get(null) ?? [];

  function onContentChange(html: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const words = countWords(html);
      const delta = lastCount.current === null ? 0 : words - lastCount.current;
      lastCount.current = words;
      save.mutate(
        { content: html, word_count: words, _wordsDelta: delta },
        { onSuccess: () => setSavedAt(new Date()) },
      );
    }, 1200);
  }

  function saveMeta(patch: Partial<SceneEntry>) {
    save.mutate(patch, { onSuccess: () => setSavedAt(new Date()) });
  }

  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (scene === null) return <Navigate to="/studio" replace />;

  const words = scene?.word_count ?? 0;
  const target = scene?.target_words ?? null;
  const filteredEntities = (entities ?? [])
    .filter((e) => !pinSearch || e.name.toLowerCase().includes(pinSearch.toLowerCase()))
    .slice(0, 8);

  const sceneNodes = (binder?.nodes ?? []).filter((n) => n.kind === "scene");
  const outlineEntries: SceneEntry[] = binder?.unfiled ?? [];

  return (
    <div className="relative z-10 grid h-screen grid-rows-[44px_1fr_32px] bg-[hsl(var(--sf-void))]">
      {/* ── topbar ── */}
      <header className="flex items-center gap-4 border-b border-sf-border px-4">
        <Link to="/studio" className="font-serif text-[14px] italic text-t1">
          Stellarforge <span className="font-display text-[10px] font-light not-italic tracking-[0.16em] text-sf-teal">STUDIO</span>
        </Link>
        <div className="flex overflow-hidden border border-sf-border" role="tablist" aria-label="Editor mode">
          {(["outline", "editor", "corkboard"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-[11px] capitalize transition-colors ${
                mode === m ? "bg-sf-teal text-[hsl(var(--accent-on-accent))]" : "text-t3 hover:text-t1"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="hidden min-w-0 items-baseline gap-2 text-[12px] text-t4 md:flex">
          {worldId && (
            <>
              <Link to={`/worlds/${worldId}`} className="hover:text-t2">World</Link>
              <span className="text-t5">/</span>
            </>
          )}
          <span className="truncate font-serif italic text-t2">{scene?.title || "Untitled"}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-[10px] tracking-[1px] text-t4 sm:block">
            ● {words.toLocaleString()}{target ? ` / ${target.toLocaleString()}` : ""}
          </span>
          <button
            onClick={() => setFocus(!focus)}
            className={`border px-2.5 py-1 text-[11px] transition-colors ${
              focus ? "border-sf-teal text-sf-teal" : "border-sf-border text-t3 hover:text-t1"
            }`}
          >
            Focus
          </button>
        </div>
      </header>

      {/* ── main grid ── */}
      <div className={`grid min-h-0 ${focus ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[280px_1fr_320px]"}`}>
        {/* binder */}
        {!focus && (
          <aside className="sf-sb sf-sb--slim hidden min-h-0 flex-col overflow-y-auto border-r border-sf-border lg:flex">
            <div className="flex-1 py-3">
              {roots.map((n) => (
                <BinderRow key={n.id} node={n} depth={0} activeEntryId={entryId} childrenOf={childrenOf}
                  onOpen={(node) => node.entry_id && navigate(`/write/${node.entry_id}`)} />
              ))}
              {(binder?.unfiled.length ?? 0) > 0 && (
                <>
                  <div className="mt-4 px-3 font-serif text-[11px] italic text-t4">Unfiled</div>
                  {binder!.unfiled.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/write/${e.id}`)}
                      className={`flex w-full items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-left font-serif text-[13px] transition-colors ${
                        e.id === entryId ? "border-sf-teal bg-sf-teal/[0.06] text-t1" : "border-transparent text-t2 hover:text-t1"
                      }`}
                    >
                      <span className="truncate">{e.title || "Untitled"}</span>
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[e.status] ?? STATUS_DOT.draft1 }} aria-hidden="true" />
                    </button>
                  ))}
                </>
              )}
            </div>
            {worldId && (
              <div className="flex gap-1 border-t border-sf-border p-2">
                <button
                  onClick={() => createScene.mutate({ title: "New scene" }, { onSuccess: (id) => navigate(`/write/${id}`) })}
                  className="flex-1 border border-sf-border px-2 py-1.5 text-[11px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
                >
                  + Scene
                </button>
                <button
                  onClick={() => createNode.mutate({ kind: "chapter", title: `Chapter ${roots.filter((r) => r.kind === "chapter").length + 1}` })}
                  className="flex-1 border border-sf-border px-2 py-1.5 text-[11px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
                >
                  + Chapter
                </button>
                <button
                  onClick={() => createNode.mutate({ kind: "folder", title: "New folder" })}
                  className="flex-1 border border-sf-border px-2 py-1.5 text-[11px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
                >
                  + Folder
                </button>
              </div>
            )}
          </aside>
        )}

        {/* center */}
        <main className="sf-sb sf-sb--idle min-h-0 overflow-y-auto">
          {mode === "editor" && (
            <div className="mx-auto max-w-[720px] px-6 py-10">
              {/* pin bar */}
              {(pins?.length ?? 0) > 0 && (
                <div className="sf-sb sf-sb--slim mb-6 flex gap-2 overflow-x-auto pb-1">
                  {pins!.map((p) => {
                    const tone = p.entity?.color || ENTITY_TYPE_COLORS[p.entity?.entity_type ?? "custom"] || "#15C17B";
                    return (
                      <span key={p.id} className="flex shrink-0 items-center gap-2 border border-sf-border bg-sf-surface/90 px-2.5 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} aria-hidden="true" />
                        <span className="font-serif text-[12px] text-t1">{p.entity?.name ?? "…"}</span>
                        <button onClick={() => unpin.mutate(p.id)} aria-label={`Unpin ${p.entity?.name}`} className="text-t4 hover:text-t1">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== (scene?.title ?? "") && saveMeta({ title })}
                placeholder="Scene title"
                className="w-full bg-transparent font-serif text-[30px] italic text-t1 outline-none placeholder:text-t4"
                aria-label="Scene title"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-t4">
                <select
                  value={scene?.status ?? "draft1"}
                  onChange={(e) => saveMeta({ status: e.target.value as SceneStatus })}
                  className="border border-sf-border bg-transparent px-2 py-1 text-[11px] text-t2"
                  aria-label="Scene status"
                >
                  <option value="todo">To do</option>
                  <option value="draft1">First draft</option>
                  <option value="draft2">Second draft</option>
                  <option value="final">Final</option>
                </select>
                <span className="font-serif italic">{words.toLocaleString()} words</span>
              </div>
              <div className="my-6 text-center text-t5" aria-hidden="true">· · ·</div>
              {scene && (
                <StellarForgeEditor
                  key={scene.id}
                  content={scene.content ?? ""}
                  onChange={onContentChange}
                  worldId={worldId ?? undefined}
                  preset="full"
                  placeholder="It begins…"
                  className="sf-writing-serif"
                  minHeight="50vh"
                />
              )}
            </div>
          )}

          {mode === "outline" && (
            <div className="mx-auto max-w-[820px] px-6 py-10">
              <h2 className="mb-5 font-serif text-[22px] italic text-t1">Outline</h2>
              <div className="divide-y divide-sf-border border-y border-sf-border">
                {sceneNodes.length === 0 && outlineEntries.length === 0 && (
                  <p className="py-6 font-serif text-[14px] italic text-t4">Nothing here yet — add a scene from the binder.</p>
                )}
                {outlineEntries.map((e) => (
                  <button key={e.id} onClick={() => { navigate(`/write/${e.id}`); setMode("editor"); }} className="flex w-full flex-wrap items-baseline gap-3 py-4 text-left hover:bg-sf-surface/60">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[e.status] ?? STATUS_DOT.draft1 }} aria-hidden="true" />
                    <span className="font-serif text-[16px] italic text-t1">{e.title || "Untitled"}</span>
                    <span className="text-[12px] text-t4">{(e.word_count ?? 0).toLocaleString()} words</span>
                    {e.synopsis && <span className="w-full pl-5 text-[13px] leading-relaxed text-t3">{e.synopsis}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "corkboard" && (
            <div className="mx-auto max-w-[1000px] px-6 py-10">
              <h2 className="mb-5 font-serif text-[22px] italic text-t1">Corkboard</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {outlineEntries.map((e) => (
                  <button key={e.id} onClick={() => { navigate(`/write/${e.id}`); setMode("editor"); }} className="border border-sf-border bg-sf-surface/90 p-4 text-left transition-colors hover:border-sf-teal/40">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[e.status] ?? STATUS_DOT.draft1 }} aria-hidden="true" />
                      <span className="font-serif text-[15px] italic text-t1">{e.title || "Untitled"}</span>
                    </div>
                    <p className="mt-2 line-clamp-4 font-serif text-[13px] leading-[1.6] text-t3">
                      {e.synopsis || "No synopsis yet."}
                    </p>
                  </button>
                ))}
                {outlineEntries.length === 0 && (
                  <p className="font-serif text-[14px] italic text-t4">Cards appear as you add scenes.</p>
                )}
              </div>
            </div>
          )}
        </main>

        {/* inspector */}
        {!focus && (
          <aside className="sf-sb sf-sb--slim hidden min-h-0 overflow-y-auto border-l border-sf-border lg:block">
            <div className="flex border-b border-sf-border" role="tablist" aria-label="Inspector">
              {(["synopsis", "refs"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={inspectorTab === t}
                  onClick={() => setInspectorTab(t)}
                  className={`flex-1 border-b-2 px-3 py-2.5 text-[12px] capitalize transition-colors ${
                    inspectorTab === t ? "border-sf-teal text-t1" : "border-transparent text-t3 hover:text-t1"
                  }`}
                >
                  {t === "refs" ? "References" : "Synopsis"}
                </button>
              ))}
            </div>

            {inspectorTab === "synopsis" && (
              <div className="space-y-5 p-4">
                <div>
                  <div className="mb-1.5 font-serif text-[12px] italic text-t4">Synopsis</div>
                  <textarea
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    onBlur={() => synopsis !== (scene?.synopsis ?? "") && saveMeta({ synopsis })}
                    rows={5}
                    placeholder="What happens in this scene…"
                    className="w-full border border-dashed border-sf-border-strong bg-transparent p-3 font-serif text-[13px] italic leading-[1.6] text-t2 outline-none placeholder:text-t4 focus:border-sf-teal/50"
                  />
                </div>
                <div>
                  <div className="mb-1.5 font-serif text-[12px] italic text-t4">Time & place</div>
                  <input
                    defaultValue={scene?.time_label ?? ""}
                    onBlur={(e) => e.target.value !== (scene?.time_label ?? "") && saveMeta({ time_label: e.target.value })}
                    placeholder="e.g. Dusk, the terminator line"
                    className="w-full border border-sf-border bg-transparent px-3 py-2 text-[13px] text-t2 outline-none placeholder:text-t4 focus:border-sf-teal/50"
                  />
                </div>
                <div>
                  <div className="mb-1.5 font-serif text-[12px] italic text-t4">Target words</div>
                  <input
                    type="number"
                    defaultValue={scene?.target_words ?? ""}
                    onBlur={(e) => saveMeta({ target_words: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 2000"
                    className="w-full border border-sf-border bg-transparent px-3 py-2 font-mono text-[13px] text-t2 outline-none placeholder:text-t4 focus:border-sf-teal/50"
                  />
                  {target ? (
                    <div className="mt-2 h-1 w-full bg-sf-surface-elevated">
                      <div className="h-1 bg-sf-teal" style={{ width: `${Math.min(100, Math.round((words / target) * 100))}%` }} />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {inspectorTab === "refs" && (
              <div className="p-4">
                <input
                  value={pinSearch}
                  onChange={(e) => setPinSearch(e.target.value)}
                  placeholder="Search world entities…"
                  className="mb-3 w-full border border-sf-border bg-transparent px-3 py-2 text-[13px] text-t2 outline-none placeholder:text-t4 focus:border-sf-teal/50"
                  aria-label="Search entities to pin"
                />
                <div className="space-y-1">
                  {filteredEntities.map((e) => {
                    const pinned = pins?.some((p) => p.entity_id === e.id);
                    const tone = e.color || ENTITY_TYPE_COLORS[e.entity_type] || "#15C17B";
                    return (
                      <div key={e.id} className="flex items-center gap-2 py-1">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tone }} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate font-serif text-[13px] text-t2">{e.name}</span>
                        <button
                          onClick={() => (pinned ? undefined : pin.mutate(e.id))}
                          disabled={pinned}
                          className={`border px-2 py-0.5 text-[10px] ${pinned ? "border-sf-border text-t5" : "border-sf-border text-t3 hover:border-sf-teal hover:text-t1"}`}
                        >
                          {pinned ? "Pinned" : "Pin"}
                        </button>
                      </div>
                    );
                  })}
                  {worldId && filteredEntities.length === 0 && (
                    <p className="font-serif text-[13px] italic text-t4">No matches in this world.</p>
                  )}
                  {!worldId && (
                    <p className="font-serif text-[13px] italic text-t4">This piece isn't attached to a world, so there are no entities to pin.</p>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── status bar ── */}
      <footer className="flex items-center justify-between border-t border-sf-border px-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-sf-teal ${save.isPending ? "animate-sf-pulse" : ""}`} aria-hidden="true" />
          <span className="font-serif text-[11px] italic text-t3">
            {save.isPending ? "Saving…" : savedAt ? `Saved · ${Math.max(1, Math.round((Date.now() - savedAt.getTime()) / 1000))}s ago` : "Ready"}
          </span>
        </div>
        <div className="font-mono text-[9px] tracking-[1.5px] text-t5">
          {words.toLocaleString()} WORDS · JD {julianDay().toFixed(1)}
        </div>
      </footer>
    </div>
  );
}

/** /write with no id — open the most recent piece, or land in the studio. */
export function WriteIndex(): JSX.Element {
  const { user, loading } = useAuth();
  const { data: latestId, isLoading } = useLatestEntryId();
  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (isLoading || loading) return <div />;
  return <Navigate to={latestId ? `/write/${latestId}` : "/studio"} replace />;
}
