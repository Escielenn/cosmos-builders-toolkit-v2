// ---------------------------------------------------------------------------
// SplitPane, the second pane of the split editor.
//
// Shows one of:
//   DOCUMENT   another manuscript document, fully editable, autosaving on its
//              own queue (useDocAutosave) independently of the main editor
//   CODEX      an entity from the Codex, read-only, with a link to edit it
//   WORKSHEET  a tool worksheet's values, read-only, with a link to the tool
// Reference views are read-only by design: the writer edits canon where it
// lives (Law III: one click to the place you edit it).
//
// SplitDivider is the resizable, keyboard-accessible separator between the
// two panes (ArrowLeft/Right or ArrowUp/Down by 5%, Home/End to the limits).
//
// Absorbs (Law VII): the second browser tab writers opened to read one
// chapter while writing another, and the Codex tab beside the manuscript.
// ---------------------------------------------------------------------------

import { useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Columns2, FileText, Rows2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { useDocAutosave } from "@/hooks/use-doc-autosave";
import { useEntities } from "@/hooks/use-entity-graph";
import { useWorksheets } from "@/hooks/use-worksheets";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";
import { ENTITY_TYPE_LABELS, type Entity } from "@/services/entity-graph-types";
import { useStudioWorld } from "@/components/writing/studio-world";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SplitSource =
  | { kind: "doc"; id: string }
  | { kind: "entity"; id: string }
  | { kind: "worksheet"; id: string };

export type SplitOrientation = "side" | "stacked";

export const SPLIT_MIN = 0.2;
export const SPLIT_MAX = 0.8;

export function clampRatio(r: number): number {
  if (!Number.isFinite(r)) return 0.5;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, r));
}

export interface SplitPaneProps {
  worldId: string;
  /** Manuscript documents in reading order (the picker list). */
  docs: WorldEntry[];
  /** Documents open in the primary pane: never offered here (one editor per document). */
  excludeIds: string[];
  source: SplitSource | null;
  onSourceChange: (s: SplitSource) => void;
  orientation: SplitOrientation;
  onOrientationChange: (o: SplitOrientation) => void;
  onClose: () => void;
  editorClassName: string;
  editorStyle: CSSProperties;
  scrollRef: RefObject<HTMLDivElement>;
  /** Extra space under the last line (typewriter scrolling). */
  tailSpacer: boolean;
  onWordsLedgered?: () => void;
}

// ---------------------------------------------------------------------------
// Pane
// ---------------------------------------------------------------------------

export function SplitPane({
  worldId,
  docs,
  excludeIds,
  source,
  onSourceChange,
  orientation,
  onOrientationChange,
  onClose,
  editorClassName,
  editorStyle,
  scrollRef,
  tailSpacer,
  onWordsLedgered,
}: SplitPaneProps): JSX.Element {
  const { data: entities } = useEntities(worldId);
  const { worksheets } = useWorksheets(worldId);
  const pickable = useMemo(() => docs.filter((d) => !excludeIds.includes(d.id)), [docs, excludeIds]);

  // A document that became the primary one (or vanished) cannot stay here.
  const effective: SplitSource | null =
    source?.kind === "doc" && !pickable.some((d) => d.id === source.id) ? null : source;

  const doc = effective?.kind === "doc" ? pickable.find((d) => d.id === effective.id) ?? null : null;
  const entity = effective?.kind === "entity" ? (entities ?? []).find((e) => e.id === effective.id) ?? null : null;
  const sheet = effective?.kind === "worksheet" ? worksheets.find((w) => w.id === effective.id) ?? null : null;

  const heading = doc
    ? doc.title || "Untitled"
    : entity
      ? entity.name
      : sheet
        ? sheet.title || getToolDisplayName(sheet.tool_type)
        : "Choose what to show";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-sf-void">
      <div className="flex shrink-0 items-center gap-1 border-b border-sf-line-interactive px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-hit min-w-0 flex-1 items-center gap-2 px-2 text-left font-serif text-[14px] italic text-t2 transition-colors duration-base hover:text-t1"
              aria-label={`Second pane: ${heading}. Choose what to show.`}
            >
              <span className="truncate">{heading}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Document</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="sf-sb sf-sb--slim max-h-80 w-64 overflow-y-auto">
                {pickable.length === 0 ? (
                  <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">No other documents.</p>
                ) : (
                  pickable.map((d) => (
                    <DropdownMenuItem key={d.id} onClick={() => onSourceChange({ kind: "doc", id: d.id })}>
                      <span className="truncate">{d.title || "Untitled"}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Codex entity</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="sf-sb sf-sb--slim max-h-80 w-64 overflow-y-auto">
                {(entities ?? []).length === 0 ? (
                  <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">The Codex is empty.</p>
                ) : (
                  [...(entities ?? [])]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((e) => (
                      <DropdownMenuItem key={e.id} onClick={() => onSourceChange({ kind: "entity", id: e.id })}>
                        <span className="min-w-0 flex-1 truncate">{e.name}</span>
                        <span className="ml-2 shrink-0 font-mono text-[12px] uppercase text-t4">
                          {ENTITY_TYPE_LABELS[e.entity_type] ?? e.entity_type}
                        </span>
                      </DropdownMenuItem>
                    ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Worksheet</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="sf-sb sf-sb--slim max-h-80 w-64 overflow-y-auto">
                {worksheets.length === 0 ? (
                  <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">No worksheets yet.</p>
                ) : (
                  worksheets.map((w) => (
                    <DropdownMenuItem key={w.id} onClick={() => onSourceChange({ kind: "worksheet", id: w.id })}>
                      <span className="truncate">{w.title || getToolDisplayName(w.tool_type)}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-heading text-sf-eyebrow uppercase text-t4">Layout</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onOrientationChange("side")}>
              <Columns2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Side by side
              {orientation === "side" && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrientationChange("stacked")}>
              <Rows2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Stacked
              {orientation === "stacked" && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => onOrientationChange(orientation === "side" ? "stacked" : "side")}
          aria-label={orientation === "side" ? "Stack the panes" : "Put the panes side by side"}
          title={orientation === "side" ? "Stack the panes" : "Side by side"}
          className="flex min-h-hit w-10 shrink-0 items-center justify-center text-t4 transition-colors duration-base hover:text-t1"
        >
          {orientation === "side" ? <Rows2 className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the second pane"
          className="flex min-h-hit w-10 shrink-0 items-center justify-center text-t4 transition-colors duration-base hover:text-t1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="sf-sb min-h-0 flex-1 overflow-y-auto">
        {doc ? (
          <DocBody
            key={doc.id}
            worldId={worldId}
            doc={doc}
            editorClassName={editorClassName}
            editorStyle={editorStyle}
            onWordsLedgered={onWordsLedgered}
          />
        ) : entity ? (
          <EntityBody worldId={worldId} entity={entity} />
        ) : sheet ? (
          <WorksheetBody worldId={worldId} sheet={sheet} />
        ) : (
          <div className="px-6 py-10">
            <FileText className="mb-3 h-5 w-5 text-t4" aria-hidden="true" />
            <p className="max-w-[40ch] font-serif text-[15px] italic text-t3">
              Open another document to write in beside this one, or a Codex entry or worksheet to keep
              in view while you write. Use the menu above.
            </p>
          </div>
        )}
        {tailSpacer && <div aria-hidden="true" style={{ height: "50vh" }} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------

function DocBody({
  worldId,
  doc,
  editorClassName,
  editorStyle,
  onWordsLedgered,
}: {
  worldId: string;
  doc: WorldEntry;
  editorClassName: string;
  editorStyle: CSSProperties;
  onWordsLedgered?: () => void;
}): JSX.Element {
  const autosave = useDocAutosave(worldId, onWordsLedgered);
  // Opening text, captured once: a refetch must never reset what is on screen.
  const initial = useRef<string | null>(null);
  if (initial.current === null) {
    initial.current = doc.content ?? "";
    autosave.register(doc.id, doc.content);
  }
  return (
    <div className="mx-auto px-6 py-6" style={{ maxWidth: "var(--sf-writing-measure, 68ch)", ...editorStyle }}>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate font-serif text-[22px] italic text-t1">{doc.title || "Untitled"}</span>
        <span className="shrink-0 font-mono text-[12px] text-t4">
          {autosave.saving ? "SAVING…" : autosave.savedAt ? "SAVED" : ""}
        </span>
      </div>
      <StellarForgeEditor
        bare
        content={initial.current}
        onChange={(html) => autosave.queue(doc.id, html)}
        worldId={worldId}
        preset="full"
        placeholder="Begin writing."
        className={editorClassName}
        minHeight="40vh"
      />
    </div>
  );
}

function EntityBody({ worldId, entity }: { worldId: string; entity: Entity }): JSX.Element {
  // Every value on file about this entity, from the Studio's world index.
  const facts = useStudioWorld()?.factsByEntity.get(entity.id) ?? [];
  return (
    <article className="px-6 py-6">
      <p className="font-heading text-sf-eyebrow uppercase text-t4">
        {ENTITY_TYPE_LABELS[entity.entity_type] ?? entity.entity_type} · Codex · read only
      </p>
      <h2 className="mt-1 font-serif text-[24px] italic text-t1">{entity.name}</h2>
      {entity.summary && <p className="sf-measure mt-3 font-sans text-sf-body text-t1">{entity.summary}</p>}
      {entity.description && (
        <p className="sf-measure mt-3 whitespace-pre-line font-sans text-sf-body text-t2">{entity.description}</p>
      )}
      {entity.notes && (
        <>
          <p className="mt-5 font-heading text-sf-eyebrow uppercase text-t4">Notes</p>
          <p className="sf-measure mt-1 whitespace-pre-line font-sans text-sf-body text-t2">{entity.notes}</p>
        </>
      )}
      {entity.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entity.tags.map((t) => (
            <span key={t} className="border border-sf-line-interactive px-1.5 font-mono text-[12px] text-t3">
              {t}
            </span>
          ))}
        </div>
      )}
      {!entity.summary && !entity.description && !entity.notes && (
        <p className="mt-3 font-serif text-[15px] italic text-t3">Nothing written about this entry yet.</p>
      )}
      {facts.length > 0 && (
        <>
          <p className="mt-5 font-heading text-sf-eyebrow uppercase text-t4">On file</p>
          <dl className="mt-1 border-t border-sf-line-hairline">
            {facts.slice(0, 16).map((f) => (
              <div key={f.ref} className="flex items-baseline gap-3 border-b border-sf-line-hairline py-2">
                <dt className="w-[42%] shrink-0 text-[12px] font-medium uppercase text-t3">{f.label}</dt>
                <dd className="min-w-0 flex-1 break-words font-mono text-[13px] text-t1">{f.insert}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <Link
        to={`/worlds/${worldId}/codex/${entity.id}`}
        className="mt-6 inline-flex min-h-hit items-center gap-1.5 border border-sf-line-interactive px-3 text-[13px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
      >
        Open Codex <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

function WorksheetBody({
  worldId,
  sheet,
}: {
  worldId: string;
  sheet: { id: string; tool_type: string; title: string | null; data: unknown };
}): JSX.Element {
  const facts = useMemo(
    () => extractWorksheetFacts(sheet.tool_type, sheet.data as Parameters<typeof extractWorksheetFacts>[1]),
    [sheet.tool_type, sheet.data],
  );
  const route = getToolRoute(sheet.tool_type);
  return (
    <article className="px-6 py-6">
      <p className="font-heading text-sf-eyebrow uppercase text-t4">
        {getToolDisplayName(sheet.tool_type)} · Worksheet · read only
      </p>
      <h2 className="mt-1 font-serif text-[24px] italic text-t1">{sheet.title || getToolDisplayName(sheet.tool_type)}</h2>
      {facts.length === 0 ? (
        <p className="mt-3 font-serif text-[15px] italic text-t3">No values on file in this worksheet yet.</p>
      ) : (
        <dl className="mt-4 border-t border-sf-line-hairline">
          {facts.map((f) => (
            <div key={f.key} className="flex items-baseline gap-3 border-b border-sf-line-hairline py-2">
              <dt className="w-[42%] shrink-0 text-[12px] font-medium uppercase text-t3">{f.label}</dt>
              <dd className="min-w-0 flex-1 break-words font-mono text-[13px] text-t1">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {route && (
        <Link
          to={`${route}?worldId=${worldId}&worksheetId=${sheet.id}`}
          className="mt-6 inline-flex min-h-hit items-center gap-1.5 border border-sf-line-interactive px-3 text-[13px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
        >
          Edit in the tool <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function SplitDivider({
  orientation,
  ratio,
  onRatio,
  containerRef,
}: {
  orientation: SplitOrientation;
  ratio: number;
  onRatio: (r: number) => void;
  containerRef: RefObject<HTMLElement>;
}): JSX.Element {
  const side = orientation === "side";

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = side ? (ev.clientX - box.left) / box.width : (ev.clientY - box.top) / box.height;
      onRatio(clampRatio(r));
    };
    const up = (ev: PointerEvent) => {
      el.releasePointerCapture(ev.pointerId);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.05;
    const dec = side ? "ArrowLeft" : "ArrowUp";
    const inc = side ? "ArrowRight" : "ArrowDown";
    if (e.key === dec) onRatio(clampRatio(ratio - step));
    else if (e.key === inc) onRatio(clampRatio(ratio + step));
    else if (e.key === "Home") onRatio(SPLIT_MIN);
    else if (e.key === "End") onRatio(SPLIT_MAX);
    else if (e.key === "Enter") onRatio(0.5);
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation={side ? "vertical" : "horizontal"}
      aria-label="Resize the split. Arrow keys move it; Enter centres it."
      aria-valuemin={Math.round(SPLIT_MIN * 100)}
      aria-valuemax={Math.round(SPLIT_MAX * 100)}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onRatio(0.5)}
      className={`group relative z-10 flex shrink-0 touch-none items-center justify-center bg-sf-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-sf-focus ${
        side ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize"
      }`}
    >
      <span
        aria-hidden="true"
        className={`bg-sf-line-interactive transition-colors duration-fast group-hover:bg-sf-primary group-focus-visible:bg-sf-primary ${
          side ? "h-full w-px" : "h-px w-full"
        }`}
      />
    </div>
  );
}

export default SplitPane;
