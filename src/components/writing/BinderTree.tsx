// ---------------------------------------------------------------------------
// BinderTree, the manuscript binder: folders nest to any depth, and any row
// can be dragged anywhere (reorder, into a folder, across levels).
//
// Drop rules are planned in src/lib/binder-tree.ts (pure, tested): a folder
// can never land in itself or its descendants; only folders take children.
// Pointer height within the row picks the drop: top quarter = before, middle
// = inside (folders), bottom quarter = after; documents split at halves.
//
// Keyboard alternative to dragging: every row's options menu has Move up,
// Move down, Move to (any folder, nested and indented) and Move to top level;
// Alt+ArrowUp / Alt+ArrowDown shift a focused row; ArrowLeft / ArrowRight
// collapse / expand a focused folder.
//
// Absorbs (Law VII) the old one-level binder and its "File into" menu.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CornerDownRight,
  FileText,
  Folder,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
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
import {
  dropPositionFor,
  flattenVisible,
  moveTargets,
  planDrop,
  planMoveInto,
  planShift,
  effectiveParents,
  rangeBetween,
  type BinderNode,
  type DropPosition,
  type MovePlan,
} from "@/lib/binder-tree";
import { readDocMeta, STATUS_LABELS } from "@/lib/document-meta";
import { DocMarker, StatusGlyph, statusTone } from "@/components/writing/DocMarks";
import { findLabel, LABEL_SWATCH, type WritingLabel } from "@/lib/writing-labels";
import { rowWords, type BinderRowLike } from "@/lib/writing/doc-scale";
import { canonCountLine, canonTotal, type CanonCount } from "@/lib/writing/canon-changes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BinderTreeProps {
  worldId: string;
  tree: BinderNode<BinderRowLike>[];
  /** Flat folders + documents, the planner input. */
  entries: BinderRowLike[];
  activeDocId?: string;
  labels: WritingLabel[];
  onOpen: (id: string) => void;
  onMove: (plan: MovePlan) => void;
  onTrash: (id: string) => void;
  onCreateDoc: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (id: string, kind: "doc" | "folder", title: string) => void;
  onDeleteFolder: (id: string, title: string) => void;
  /**
   * Multi-selection (Cmd/Ctrl-click toggles a document, Shift-click selects a
   * range). Documents only. Feeds Scrivenings and manual collections.
   */
  selection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Open a folder's documents as Scrivenings. */
  onScrivenings?: (folderId: string) => void;
  /**
   * Canon-changed counts per document, rolled up into folders
   * (lib/writing/canon-changes). Rows with a count carry a `//N` tag.
   */
  canonCounts?: ReadonlyMap<string, CanonCount>;
  /** Show every folder open regardless of collapse memory (filtered views). */
  expandAll?: boolean;
  /**
   * Compact rows (1.7): 36px rows on pointer devices; touch keeps 44px.
   * With `onCompactChange` the binder shows its tools row: the compact
   * toggle, collapse all, expand all and jump to the open document.
   */
  compact?: boolean;
  onCompactChange?: (compact: boolean) => void;
}

interface DropState {
  overId: string;
  position: DropPosition;
  valid: boolean;
}

const INDENT = 14;
const NO_SELECTION: string[] = [];

/** Row height: 44px, or 36px on pointer devices when compact. */
const ROW_TALL = "min-h-hit";
const ROW_COMPACT = "min-h-hit [@media(pointer:fine)]:min-h-9";
const TOOL_BTN =
  "sf-hit flex h-9 w-9 shrink-0 items-center justify-center text-t3 transition-colors duration-fast hover:bg-sf-surface-elevated hover:text-t1";

/** Documents under each folder, at any depth. */
function countDocs(tree: BinderNode<BinderRowLike>[]): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (n: BinderNode<BinderRowLike>): number => {
    if (!n.isFolder) return 1;
    let total = 0;
    for (const c of n.children) total += walk(c);
    out.set(n.entry.id, total);
    return total;
  };
  tree.forEach(walk);
  return out;
}

// ---------------------------------------------------------------------------
// Collapse memory (per world, per browser)
// ---------------------------------------------------------------------------

function useCollapsed(worldId: string) {
  const storageKey = `sf-binder-collapsed:${worldId}`;
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      setCollapsed(new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[]));
    } catch {
      setCollapsed(new Set());
    }
  }, [storageKey]);
  const update = useCallback(
    (fn: (prev: Set<string>) => Set<string>) => {
      setCollapsed((prev) => {
        const next = fn(prev);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          /* no storage */
        }
        return next;
      });
    },
    [storageKey],
  );
  return [collapsed, update] as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BinderTree({
  worldId,
  tree,
  entries,
  activeDocId,
  labels,
  onOpen,
  onMove,
  onTrash,
  onCreateDoc,
  onCreateFolder,
  onRename,
  onDeleteFolder,
  selection = NO_SELECTION,
  onSelectionChange,
  onScrivenings,
  canonCounts,
  expandAll = false,
  compact = false,
  onCompactChange,
}: BinderTreeProps): JSX.Element {
  const [storedCollapsed, setCollapsed] = useCollapsed(worldId);
  const collapsed = useMemo(() => (expandAll ? new Set<string>() : storedCollapsed), [expandAll, storedCollapsed]);
  const rows = useMemo(() => flattenVisible(tree, collapsed), [tree, collapsed]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const expandTimer = useRef<ReturnType<typeof setTimeout>>();
  const anchor = useRef<string | null>(null);
  const selected = useMemo(() => new Set(selection), [selection]);
  const docCounts = useMemo(() => countDocs(tree), [tree]);
  const listRef = useRef<HTMLUListElement>(null);
  const rowH = compact ? ROW_COMPACT : ROW_TALL;

  const folderIds = useMemo(() => entries.filter((e) => e.entry_type === "folder").map((e) => e.id), [entries]);
  const collapseAll = () => setCollapsed(() => new Set(folderIds));
  const expandEvery = () => setCollapsed(() => new Set());
  /** Open the folders above the open document and bring its row into view. */
  const jumpToCurrent = () => {
    if (!activeDocId) return;
    const parent = effectiveParents(entries);
    const ancestors: string[] = [];
    let cur = parent.get(activeDocId) ?? null;
    while (cur) {
      ancestors.push(cur);
      cur = parent.get(cur) ?? null;
    }
    if (ancestors.length) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        ancestors.forEach((a) => next.delete(a));
        return next;
      });
    }
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
      el?.scrollIntoView?.({ block: "center" });
      el?.focus?.({ preventScroll: true });
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Word counts, once per data change rather than per row render.
  const wordCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) if (e.entry_type !== "folder") m.set(e.id, rowWords(e));
    return m;
  }, [entries]);

  // Opening a document inside a collapsed folder reveals it.
  useEffect(() => {
    if (!activeDocId) return;
    const parent = effectiveParents(entries);
    const ancestors: string[] = [];
    let cur = parent.get(activeDocId) ?? null;
    while (cur) {
      ancestors.push(cur);
      cur = parent.get(cur) ?? null;
    }
    if (ancestors.some((a) => collapsed.has(a))) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        ancestors.forEach((a) => next.delete(a));
        return next;
      });
    }
    // Only when the open document changes; collapsing it again is allowed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId]);

  const toggle = (id: string, open?: boolean) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      const shouldOpen = open ?? next.has(id);
      if (shouldOpen) next.delete(id);
      else next.add(id);
      return next;
    });

  // Click: open (and clear any selection). Cmd/Ctrl-click: toggle one
  // document in the selection. Shift-click: select the visible range from the
  // last clicked (or the open) document.
  const activate = (node: BinderNode<BinderRowLike>, e: React.MouseEvent) => {
    const id = node.entry.id;
    const multi = e.metaKey || e.ctrlKey;
    if (!node.isFolder && onSelectionChange && (multi || e.shiftKey)) {
      e.preventDefault();
      const base = selection.length > 0 ? selection : activeDocId ? [activeDocId] : [];
      if (e.shiftKey) {
        const visibleDocs = rows.filter((r) => !r.node.isFolder).map((r) => r.node.entry.id);
        const range = rangeBetween(visibleDocs, anchor.current ?? activeDocId ?? null, id);
        onSelectionChange(multi ? [...new Set([...base, ...range])] : range);
      } else {
        onSelectionChange(base.includes(id) ? base.filter((x) => x !== id) : [...base, id]);
        anchor.current = id;
      }
      return;
    }
    if (node.isFolder) {
      toggle(id);
      return;
    }
    anchor.current = id;
    if (selection.length > 0) onSelectionChange?.([]);
    onOpen(id);
  };

  // ---- drag and drop ------------------------------------------------------

  const resolveDrop = (e: DragMoveEvent | DragEndEvent): DropState | null => {
    const { active, over, activatorEvent, delta } = e;
    if (!over || over.id === active.id) return null;
    const overEntry = entries.find((x) => x.id === over.id);
    if (!overEntry) return null;
    const startY =
      activatorEvent && "clientY" in activatorEvent ? (activatorEvent as PointerEvent).clientY : 0;
    const position = dropPositionFor(
      overEntry.entry_type === "folder",
      startY + delta.y,
      over.rect.top,
      over.rect.height,
    );
    const valid = !!planDrop(entries, String(active.id), String(over.id), position);
    return { overId: String(over.id), position, valid };
  };

  const onDragStart = (e: DragStartEvent) => setDragId(String(e.active.id));

  const onDragMove = (e: DragMoveEvent) => {
    const next = resolveDrop(e);
    setDrop((prev) =>
      prev?.overId === next?.overId && prev?.position === next?.position && prev?.valid === next?.valid
        ? prev
        : next,
    );
    // Hovering the middle of a collapsed folder opens it, so a drop can
    // reach a nested target without letting go.
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (next?.position === "inside" && collapsed.has(next.overId)) {
      const id = next.overId;
      expandTimer.current = setTimeout(() => toggle(id, true), 700);
    }
  };

  const endDrag = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    setDragId(null);
    setDrop(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const d = resolveDrop(e);
    endDrag();
    if (!d) return;
    const plan = planDrop(entries, String(e.active.id), d.overId, d.position);
    if (plan) onMove(plan);
  };

  // ---- rename -------------------------------------------------------------

  const beginRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };
  const commitRename = (kind: "doc" | "folder") => {
    if (!renamingId) return;
    const t = renameValue.trim();
    const current = entries.find((e) => e.id === renamingId)?.title ?? "";
    if (t && t !== current) onRename(renamingId, kind, t);
    setRenamingId(null);
  };

  const dragged = dragId ? entries.find((e) => e.id === dragId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={endDrag}
    >
      {onCompactChange && (
        <div className="flex items-center gap-1 px-2 pb-1" role="group" aria-label="Binder view">
          <label className="flex min-h-hit min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 font-sans text-[13px] text-t3 transition-colors duration-fast hover:text-t1">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => onCompactChange(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-[var(--sf-primary)]"
            />
            <span className="truncate">Compact rows</span>
          </label>
          <button type="button" onClick={collapseAll} aria-label="Collapse all folders" title="Collapse all folders" className={TOOL_BTN}>
            <ChevronsDownUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={expandEvery} aria-label="Expand all folders" title="Expand all folders" className={TOOL_BTN}>
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={jumpToCurrent}
            disabled={!activeDocId}
            aria-label="Jump to the open document"
            title="Jump to the open document"
            className={`${TOOL_BTN} disabled:text-sf-disabled-text`}
          >
            <CornerDownRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <ul ref={listRef} role="tree" aria-label="Binder" className="flex flex-col">
        {rows.map(({ node, depth }) => (
          <BinderRow
            key={node.entry.id}
            node={node}
            depth={depth}
            entries={entries}
            active={node.entry.id === activeDocId}
            selected={selected.has(node.entry.id)}
            expanded={node.isFolder && !collapsed.has(node.entry.id)}
            drop={drop?.overId === node.entry.id ? drop : null}
            dragging={dragId === node.entry.id}
            words={wordCounts.get(node.entry.id) ?? 0}
            docCount={docCounts.get(node.entry.id) ?? 0}
            rowH={rowH}
            canon={canonCounts?.get(node.entry.id)}
            labels={labels}
            renaming={renamingId === node.entry.id}
            renameValue={renameValue}
            onRenameChange={setRenameValue}
            onRenameCommit={() => commitRename(node.isFolder ? "folder" : "doc")}
            onRenameCancel={() => setRenamingId(null)}
            onBeginRename={() => beginRename(node.entry.id, node.entry.title || "Untitled")}
            onToggle={(open) => toggle(node.entry.id, open)}
            onOpen={(e) => activate(node, e)}
            onScrivenings={node.isFolder && onScrivenings ? () => onScrivenings(node.entry.id) : undefined}
            onMove={onMove}
            onTrash={() => onTrash(node.entry.id)}
            onCreateDoc={() => {
              toggle(node.entry.id, true);
              onCreateDoc(node.entry.id);
            }}
            onCreateFolder={() => {
              toggle(node.entry.id, true);
              onCreateFolder(node.entry.id);
            }}
            onDeleteFolder={() => onDeleteFolder(node.entry.id, node.entry.title || "Untitled")}
          />
        ))}
      </ul>
      <DragOverlay dropAnimation={null}>
        {dragged ? (
          <div className="flex min-h-hit items-center gap-2 border border-sf-line-emphasis bg-sf-surface-elevated px-3 font-sans text-[14px] text-t1">
            {dragged.entry_type === "folder" ? (
              <Folder className="h-3.5 w-3.5 text-t3" aria-hidden="true" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-t3" aria-hidden="true" />
            )}
            <span className="truncate">{dragged.title || "Untitled"}</span>
            {drop && !drop.valid && (
              <span className="ml-auto shrink-0 font-mono text-[12px] uppercase text-sf-crimson-text">
                {"// CANNOT FILE HERE"}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface BinderRowProps {
  node: BinderNode<BinderRowLike>;
  depth: number;
  entries: BinderRowLike[];
  active: boolean;
  selected: boolean;
  expanded: boolean;
  drop: DropState | null;
  dragging: boolean;
  words: number;
  /** Folders: documents inside, at any depth. */
  docCount: number;
  /** Row height classes (tall, or compact on pointer devices). */
  rowH: string;
  canon?: CanonCount;
  labels: WritingLabel[];
  renaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onBeginRename: () => void;
  onToggle: (open?: boolean) => void;
  onOpen: (e: React.MouseEvent) => void;
  onScrivenings?: () => void;
  onMove: (plan: MovePlan) => void;
  onTrash: () => void;
  onCreateDoc: () => void;
  onCreateFolder: () => void;
  onDeleteFolder: () => void;
}

function BinderRow({
  node,
  depth,
  entries,
  active,
  selected,
  expanded,
  drop,
  dragging,
  words,
  docCount,
  rowH,
  canon,
  labels,
  renaming,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onBeginRename,
  onToggle,
  onOpen,
  onScrivenings,
  onMove,
  onTrash,
  onCreateDoc,
  onCreateFolder,
  onDeleteFolder,
}: BinderRowProps): JSX.Element {
  const { entry, isFolder } = node;
  const title = entry.title || "Untitled";
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({ id: entry.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: entry.id });
  const setRef = (el: HTMLLIElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const meta = isFolder ? null : readDocMeta(entry.metadata);
  const label = meta ? findLabel(labels, meta.labelId) : null;
  const status = meta?.status || "";
  const atRoot = depth === 0;

  const move = (plan: MovePlan | null) => plan && onMove(plan);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      move(planShift(entries, entry.id, e.key === "ArrowUp" ? -1 : 1));
      return;
    }
    if (isFolder && e.key === "ArrowRight" && !expanded) {
      e.preventDefault();
      onToggle(true);
    }
    if (isFolder && e.key === "ArrowLeft" && expanded) {
      e.preventDefault();
      onToggle(false);
    }
    if (e.key === "F2") {
      e.preventDefault();
      onBeginRename();
    }
  };

  // Drop indicator: a solid line above/below, or the whole row for "inside".
  // Crimson with a // prefix in the overlay text when the drop is refused.
  const dropClass = !drop
    ? ""
    : !drop.valid
      ? "outline outline-1 -outline-offset-1 outline-sf-crimson"
      : drop.position === "inside"
        ? "bg-sf-primary/[0.08] outline outline-1 -outline-offset-1 outline-sf-primary"
        : "";

  const canonCount = canon && canonTotal(canon) > 0 ? canonTotal(canon) : 0;
  const canonLine = canon && canonCount > 0 ? canonCountLine(canon) : "";

  const hint = [
    isFolder ? `Folder, ${docCount.toLocaleString()} ${docCount === 1 ? "document" : "documents"}` : `${words.toLocaleString()} words`,
    status ? STATUS_LABELS[status] : "",
    label ? label.name : "",
    canonLine,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      ref={setRef}
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={isFolder ? expanded : undefined}
      aria-selected={active || selected}
      className={`group relative flex ${rowH} items-center border-l-2 pr-1 transition-colors duration-fast ${
        active
          ? "border-sf-primary bg-sf-primary/[0.06]"
          : selected
            ? "border-sf-line-emphasis bg-sf-surface-elevated"
            : dragging
            ? "border-transparent bg-sf-disabled-bg"
            : "border-transparent hover:bg-sf-surface-elevated"
      } ${dropClass}`}
      style={{ paddingLeft: 4 + depth * INDENT }}
    >
      {drop?.valid && drop.position === "before" && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-sf-primary" />
      )}
      {drop?.valid && drop.position === "after" && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-sf-primary" />
      )}

      {isFolder ? (
        <button
          type="button"
          onClick={() => onToggle()}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
          className={`flex ${rowH} w-7 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-t1`}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      ) : (
        // The document's marker: the writer's emoji, else a plain page.
        <span className="flex w-7 shrink-0 items-center justify-center" aria-hidden="true">
          <DocMarker marker={meta?.marker} className="text-[15px]" />
        </span>
      )}

      {renaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameCommit();
            if (e.key === "Escape") onRenameCancel();
          }}
          aria-label={isFolder ? "Folder name" : "Document title"}
          className="min-h-[36px] min-w-0 flex-1 bg-transparent px-1 font-sans text-[16px] text-t1"
        />
      ) : (
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={onOpen}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onBeginRename();
          }}
          onKeyDown={onKeyDown}
          title={`${hint}. Double-click or F2 to rename. Alt+Arrow to move.${isFolder ? "" : " Cmd/Ctrl-click or Shift-click to select several."}`}
          aria-current={active ? "page" : undefined}
          className={`flex ${rowH} min-w-0 flex-1 touch-none items-center gap-2 pr-1 text-left ${
            isFolder
              ? "font-heading text-[12px] uppercase tracking-wide text-t3 hover:text-t1"
              : `font-sans text-[14px] ${active ? "text-t1" : "text-t2 hover:text-t1"}`
          }`}
        >
          {isFolder &&
            (expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
            ))}
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {canonCount > 0 && (
            // Canon changed under this document (or, on a folder, under
            // something inside it). A `//` tag in amber: shape and text, not
            // hue alone. The words are in the tooltip and for screen readers.
            <span
              title={canonLine}
              data-testid="canon-badge"
              className="shrink-0 rounded-sf-tag border border-sf-amber bg-sf-amber/[0.06] px-1 font-mono text-[12px] leading-[18px] text-sf-amber-text"
            >
              <span aria-hidden="true">{`//${canonCount}`}</span>
              <span className="sr-only">{canonLine}</span>
            </span>
          )}
          {!isFolder && (
            <span
              className={`shrink-0 font-mono text-[12px] text-t4 ${active ? "inline" : "hidden group-hover:inline group-focus-within:inline"}`}
            >
              {words.toLocaleString()}
            </span>
          )}
          {isFolder && (
            <span className="shrink-0 font-mono text-[12px] tracking-normal text-t4" aria-label={`${docCount} ${docCount === 1 ? "document" : "documents"}`}>
              {docCount}
            </span>
          )}
          {label && (
            // The label's colour, with its name for anyone not seeing colour.
            <span className={`h-2 w-2 shrink-0 ${LABEL_SWATCH[label.hue]}`} role="img" aria-label={`Label ${label.name}`} />
          )}
          {!isFolder && (
            // Status at the row's right edge: a ring that fills as the
            // draft matures. Shape first, tone second.
            <span className={`flex w-3 shrink-0 justify-center ${statusTone(status)}`}>
              <StatusGlyph status={status} title={status ? `Status ${STATUS_LABELS[status]}` : undefined} />
            </span>
          )}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Options for ${title}`}
            className={`flex ${rowH} w-8 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-primary-text`}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isFolder && (
            <>
              {onScrivenings && (
                <DropdownMenuItem onClick={onScrivenings}>View as Scrivenings</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onCreateDoc}>New document here</DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateFolder}>New folder here</DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onBeginRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => move(planShift(entries, entry.id, -1))}>Move up</DropdownMenuItem>
          <DropdownMenuItem onClick={() => move(planShift(entries, entry.id, 1))}>Move down</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="sf-sb sf-sb--slim max-h-80 w-60 overflow-y-auto">
              <DropdownMenuLabel className="font-heading text-sf-eyebrow uppercase text-t4">
                Folders
              </DropdownMenuLabel>
              <DropdownMenuItem disabled={atRoot} onClick={() => move(planMoveInto(entries, entry.id, null))}>
                Top level
              </DropdownMenuItem>
              <MoveTargets entries={entries} id={entry.id} onPick={(t) => move(planMoveInto(entries, entry.id, t))} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {isFolder ? (
            <DropdownMenuItem className="text-sf-crimson-text focus:text-sf-crimson-text" onClick={onDeleteFolder}>
              Delete folder
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-sf-crimson-text focus:text-sf-crimson-text" onClick={onTrash}>
              Move to trash
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** Folder targets for "Move to". Mounted only while the submenu is open. */
function MoveTargets({
  entries,
  id,
  onPick,
}: {
  entries: BinderRowLike[];
  id: string;
  onPick: (folderId: string) => void;
}): JSX.Element {
  const targets = useMemo(() => moveTargets(entries, id), [entries, id]);
  if (targets.length === 0) {
    return <p className="px-2 py-1.5 font-sans text-[13px] text-t3">No folders yet.</p>;
  }
  return (
    <>
      {targets.map((t) => (
        <DropdownMenuItem
          key={t.id}
          disabled={t.disabled}
          onClick={() => onPick(t.id)}
          style={{ paddingLeft: 8 + t.depth * 12 }}
        >
          <span className="truncate">{t.title}</span>
        </DropdownMenuItem>
      ))}
    </>
  );
}

export default BinderTree;
