// ---------------------------------------------------------------------------
// Outliner, the binder as a table (Scrivener's Outliner).
//
// One row per folder and document in reading order, indented by depth, with
// the inspector's card fields as columns: synopsis, label, status, POV,
// keywords, words, target with progress, last modified. Columns toggle and
// are remembered per world in this browser. Folder rows carry their
// descendants' totals; the footer totals every document.
//
// Two-way (Law III): status, label and synopsis edit in place and save
// through the same per-document metadata queue as the inspector
// (useUpdateDocumentMeta), so two quick edits can never drop each other.
//
// Keyboard: ArrowUp/ArrowDown move between rows, Home/End jump, Enter opens a
// document (or toggles a folder), ArrowLeft/ArrowRight collapse/expand a
// folder. Tab reaches every inline control in the focused row.
//
// Absorbs (Law VII): nothing on screen; it is the third view of the binder
// beside Editor and Board, behind the same view switch.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Columns3, FileText, Folder } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BinderNode } from "@/lib/binder-tree";
import {
  buildOutlinerRows,
  COLUMN_LABELS,
  formatModified,
  outlinerTotals,
  OUTLINER_COLUMNS,
  sanitizeColumns,
  toggleColumn,
  truncateText,
  type OutlinerColumn,
  type OutlinerRow,
} from "@/lib/outliner";
import {
  DOC_STATUSES,
  STATUS_LABELS,
  STATUS_TONE,
  targetProgress,
  type DocumentMeta,
} from "@/lib/document-meta";
import { findLabel, LABEL_SWATCH, type WritingLabel } from "@/lib/writing-labels";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OutlinerProps {
  worldId: string;
  tree: BinderNode<WorldEntry>[];
  labels: WritingLabel[];
  activeDocId?: string;
  onOpen: (docId: string) => void;
  onChangeMeta: (docId: string, patch: Partial<DocumentMeta>) => void;
}

// ---------------------------------------------------------------------------
// Column memory (per world, per browser)
// ---------------------------------------------------------------------------

function useColumns(worldId: string) {
  const key = `sf-outliner-cols:${worldId}`;
  const read = useCallback((): OutlinerColumn[] => {
    try {
      const raw = localStorage.getItem(key);
      return sanitizeColumns(raw ? JSON.parse(raw) : undefined);
    } catch {
      return sanitizeColumns(undefined);
    }
  }, [key]);
  const [cols, setCols] = useState<OutlinerColumn[]>(read);
  useEffect(() => setCols(read()), [read]);
  const update = (next: OutlinerColumn[]) => {
    setCols(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* no storage */
    }
  };
  return [cols, update] as const;
}

const INDENT = 16;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Outliner({
  worldId,
  tree,
  labels,
  activeDocId,
  onOpen,
  onChangeMeta,
}: OutlinerProps): JSX.Element {
  const [cols, setCols] = useColumns(worldId);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const rows = useMemo(() => buildOutlinerRows(tree, collapsed), [tree, collapsed]);
  const totals = useMemo(() => outlinerTotals(tree), [tree]);
  const [focusId, setFocusId] = useState<string | null>(activeDocId ?? null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const show = (c: OutlinerColumn) => cols.includes(c);

  const toggleFolder = (id: string, open?: boolean) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      const shouldOpen = open ?? next.has(id);
      if (shouldOpen) next.delete(id);
      else next.add(id);
      return next;
    });

  const focusRow = (i: number) => {
    const r = rows[Math.max(0, Math.min(rows.length - 1, i))];
    if (!r) return;
    setFocusId(r.entry.id);
    rowRefs.current.get(r.entry.id)?.focus();
  };

  // The roving tab stop: the focused row, else the open document, else row 1.
  const tabStop =
    (focusId && rows.some((r) => r.entry.id === focusId) && focusId) ||
    (activeDocId && rows.some((r) => r.entry.id === activeDocId) && activeDocId) ||
    rows[0]?.entry.id;

  const onRowKey = (e: React.KeyboardEvent, row: OutlinerRow<WorldEntry>, i: number) => {
    // Keys typed into an inline editor belong to it.
    if (e.target !== e.currentTarget) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusRow(0);
        break;
      case "End":
        e.preventDefault();
        focusRow(rows.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (row.isFolder) toggleFolder(row.entry.id);
        else onOpen(row.entry.id);
        break;
      case "ArrowRight":
        if (row.isFolder && collapsed.has(row.entry.id)) {
          e.preventDefault();
          toggleFolder(row.entry.id, true);
        }
        break;
      case "ArrowLeft":
        if (row.isFolder && !collapsed.has(row.entry.id)) {
          e.preventDefault();
          toggleFolder(row.entry.id, false);
        }
        break;
    }
  };

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-heading text-sf-eyebrow uppercase text-t4">Outliner</span>
        <span className="font-mono text-[12px] text-t4">
          {totals.docs.toLocaleString()} {totals.docs === 1 ? "DOCUMENT" : "DOCUMENTS"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-auto flex min-h-hit items-center gap-1.5 border border-sf-line-interactive px-2.5 text-[12px] text-t3 transition-colors duration-base hover:border-sf-line-emphasis hover:text-t1"
              aria-label="Choose outliner columns"
            >
              <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
              Columns
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-heading text-sf-eyebrow uppercase text-t4">Show</DropdownMenuLabel>
            {OUTLINER_COLUMNS.map((c) => (
              <DropdownMenuCheckboxItem
                key={c}
                checked={show(c)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setCols(toggleColumn(cols, c))}
              >
                {COLUMN_LABELS[c]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {rows.length === 0 ? (
        <p className="font-serif text-[15px] italic text-t3">No documents yet. Create one in the binder.</p>
      ) : (
        <div className="sf-sb overflow-x-auto border border-sf-line">
          <table className="w-full min-w-[640px] border-collapse text-left" aria-label="Manuscript outline">
            <thead>
              <tr className="border-b border-sf-line-interactive bg-sf-surface">
                <Th className="min-w-[200px]">Title</Th>
                {show("synopsis") && <Th className="min-w-[220px]">Synopsis</Th>}
                {show("label") && <Th>Label</Th>}
                {show("status") && <Th>Status</Th>}
                {show("pov") && <Th>POV</Th>}
                {show("keywords") && <Th>Keywords</Th>}
                {show("words") && <Th className="text-right">Words</Th>}
                {show("target") && <Th className="min-w-[120px]">Target</Th>}
                {show("modified") && <Th className="text-right">Modified</Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <OutlinerRowView
                  key={row.entry.id}
                  row={row}
                  show={show}
                  labels={labels}
                  active={row.entry.id === activeDocId}
                  expanded={row.isFolder && !collapsed.has(row.entry.id)}
                  tabbable={row.entry.id === tabStop}
                  rowRef={(el) => {
                    if (el) rowRefs.current.set(row.entry.id, el);
                    else rowRefs.current.delete(row.entry.id);
                  }}
                  onFocus={() => setFocusId(row.entry.id)}
                  onKeyDown={(e) => onRowKey(e, row, i)}
                  onOpen={() => (row.isFolder ? toggleFolder(row.entry.id) : onOpen(row.entry.id))}
                  onToggle={() => toggleFolder(row.entry.id)}
                  onChangeMeta={(patch) => onChangeMeta(row.entry.id, patch)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-sf-line-interactive bg-sf-surface">
                <td className="px-3 py-2.5 font-heading text-sf-eyebrow uppercase text-t3">
                  Total · {totals.docs.toLocaleString()} {totals.docs === 1 ? "document" : "documents"}
                </td>
                {show("synopsis") && <td />}
                {show("label") && <td />}
                {show("status") && <td />}
                {show("pov") && <td />}
                {show("keywords") && <td />}
                {show("words") && (
                  <td className="px-3 py-2.5 text-right font-mono text-[13px] text-t1">
                    {totals.words.toLocaleString()}
                  </td>
                )}
                {show("target") && (
                  <td className="px-3 py-2.5">
                    <TargetCell words={totals.words} target={totals.target} />
                  </td>
                )}
                {show("modified") && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }): JSX.Element {
  return (
    <th scope="col" className={`px-3 py-2 font-heading text-sf-eyebrow uppercase text-t4 ${className}`}>
      {children}
    </th>
  );
}

function TargetCell({ words, target }: { words: number; target: number }): JSX.Element {
  if (!target) return <span className="font-mono text-[12px] text-t4">—</span>;
  const pct = Math.round(targetProgress(words, target) * 100);
  const met = words >= target;
  return (
    <div className="flex items-center gap-2" title={`${words.toLocaleString()} of ${target.toLocaleString()} words`}>
      <span className="h-1 min-w-[48px] flex-1 bg-sf-surface-elevated" aria-hidden="true">
        <span className={`block h-full ${met ? "bg-sf-primary" : "bg-sf-stellar"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`shrink-0 font-mono text-[12px] ${met ? "text-sf-primary-text" : "text-t3"}`}>
        {target.toLocaleString()}
      </span>
    </div>
  );
}

interface RowViewProps {
  row: OutlinerRow<WorldEntry>;
  show: (c: OutlinerColumn) => boolean;
  labels: WritingLabel[];
  active: boolean;
  expanded: boolean;
  tabbable: boolean;
  rowRef: (el: HTMLTableRowElement | null) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onOpen: () => void;
  onToggle: () => void;
  onChangeMeta: (patch: Partial<DocumentMeta>) => void;
}

function OutlinerRowView({
  row,
  show,
  labels,
  active,
  expanded,
  tabbable,
  rowRef,
  onFocus,
  onKeyDown,
  onOpen,
  onToggle,
  onChangeMeta,
}: RowViewProps): JSX.Element {
  const { entry, isFolder, meta, depth } = row;
  const title = entry.title || "Untitled";
  const label = meta ? findLabel(labels, meta.labelId) : null;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <tr
      ref={rowRef}
      tabIndex={tabbable ? 0 : -1}
      aria-current={active ? "page" : undefined}
      onFocus={(e) => e.target === e.currentTarget && onFocus()}
      onKeyDown={onKeyDown}
      onClick={onOpen}
      className={`cursor-pointer border-b border-sf-line-hairline align-top transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sf-focus ${
        active ? "bg-sf-primary/[0.06]" : "hover:bg-sf-surface-elevated"
      }`}
    >
      {/* Title */}
      <td className="px-3 py-1.5">
        <div className="flex min-h-hit items-center gap-1.5" style={{ paddingLeft: depth * INDENT }}>
          {isFolder ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                stop(e);
                onToggle();
              }}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
              className="flex h-7 w-6 shrink-0 items-center justify-center text-t4 hover:text-t1"
            >
              {row.hasChildren ? (
                expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <Folder className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="flex w-6 shrink-0 justify-center" aria-hidden="true">
              {label ? <span className={`h-2.5 w-2.5 ${LABEL_SWATCH[label.hue]}`} /> : <FileText className="h-3.5 w-3.5 text-t4" />}
            </span>
          )}
          {isFolder ? (
            <span className="truncate font-heading text-[12px] uppercase tracking-wide text-t3">
              {title}
              <span className="ml-2 font-mono normal-case tracking-normal text-t4">{row.docCount}</span>
            </span>
          ) : (
            <span className={`truncate font-serif text-[15px] ${active ? "text-t1" : "text-t2"}`}>{title}</span>
          )}
        </div>
      </td>

      {show("synopsis") && (
        <td className="px-3 py-1.5" onClick={meta ? stop : undefined}>
          {meta ? (
            <SynopsisCell value={meta.synopsis} title={title} onCommit={(synopsis) => onChangeMeta({ synopsis })} />
          ) : null}
        </td>
      )}

      {show("label") && (
        <td className="px-3 py-1.5" onClick={meta ? stop : undefined}>
          {meta && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Label for ${title}: ${label ? label.name : "none"}`}
                  className="flex min-h-hit items-center gap-1.5 px-1 text-left text-[13px] text-t2 hover:text-t1"
                >
                  {label ? (
                    <>
                      <span className={`h-2.5 w-2.5 shrink-0 ${LABEL_SWATCH[label.hue]}`} aria-hidden="true" />
                      <span className="truncate">{label.name}</span>
                    </>
                  ) : (
                    <span className="text-t4">—</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => onChangeMeta({ labelId: "" })}>No label</DropdownMenuItem>
                {labels.length > 0 && <DropdownMenuSeparator />}
                {labels.map((l) => (
                  <DropdownMenuItem key={l.id} onClick={() => onChangeMeta({ labelId: l.id })}>
                    <span className={`mr-2 h-2.5 w-2.5 ${LABEL_SWATCH[l.hue]}`} aria-hidden="true" />
                    {l.name}
                    {l.id === meta.labelId && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      )}

      {show("status") && (
        <td className="px-3 py-1.5" onClick={meta ? stop : undefined}>
          {meta && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Status for ${title}: ${meta.status ? STATUS_LABELS[meta.status] : "none"}`}
                  className={`flex min-h-hit items-center px-1 font-mono text-[12px] uppercase ${
                    meta.status ? STATUS_TONE[meta.status] : "text-t4"
                  } hover:text-t1`}
                >
                  {meta.status ? STATUS_LABELS[meta.status] : "—"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => onChangeMeta({ status: "" })}>No status</DropdownMenuItem>
                <DropdownMenuSeparator />
                {DOC_STATUSES.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onChangeMeta({ status: s })}>
                    {STATUS_LABELS[s]}
                    {s === meta.status && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      )}

      {show("pov") && (
        <td className="px-3 py-1.5">
          <span className="flex min-h-hit items-center font-serif text-[14px] text-t2">{meta?.pov || ""}</span>
        </td>
      )}

      {show("keywords") && (
        <td className="px-3 py-1.5">
          <div className="flex min-h-hit flex-wrap items-center gap-1">
            {(meta?.keywords ?? []).slice(0, 4).map((k) => (
              <span key={k} className="border border-sf-line-interactive px-1.5 font-mono text-[12px] text-t3">
                {k}
              </span>
            ))}
            {(meta?.keywords.length ?? 0) > 4 && (
              <span className="font-mono text-[12px] text-t4">+{(meta?.keywords.length ?? 0) - 4}</span>
            )}
          </div>
        </td>
      )}

      {show("words") && (
        <td className={`px-3 py-1.5 text-right font-mono text-[13px] ${isFolder ? "text-t3" : "text-t1"}`}>
          <span className="flex min-h-hit items-center justify-end">{row.words.toLocaleString()}</span>
        </td>
      )}

      {show("target") && (
        <td className="px-3 py-1.5">
          <div className="flex min-h-hit items-center">
            <TargetCell words={row.words} target={row.target} />
          </div>
        </td>
      )}

      {show("modified") && (
        <td className="px-3 py-1.5 text-right font-mono text-[12px] text-t4">
          <span className="flex min-h-hit items-center justify-end whitespace-nowrap">
            {isFolder ? "" : formatModified(entry.updated_at)}
          </span>
        </td>
      )}
    </tr>
  );
}

/** Synopsis: truncated text; click (or Enter) to edit in place. */
function SynopsisCell({
  value,
  title,
  onCommit,
}: {
  value: string;
  title: string;
  onCommit: (v: string) => void;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value.trim()) onCommit(draft.trim());
  };

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        aria-label={`Synopsis for ${title}`}
        className="sf-sb w-full resize-y border border-sf-line-interactive bg-sf-surface px-2 py-1 font-serif text-[16px] italic text-t1"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={value ? `${value}\n\nClick to edit.` : "Add a synopsis"}
      aria-label={value ? `Edit synopsis for ${title}` : `Add a synopsis for ${title}`}
      className="flex min-h-hit w-full items-center px-1 text-left font-serif text-[14px] italic text-t2 hover:text-t1"
    >
      {value ? truncateText(value, 90) : <span className="text-t4">—</span>}
    </button>
  );
}

export default Outliner;
