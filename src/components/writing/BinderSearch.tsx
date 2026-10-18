// ---------------------------------------------------------------------------
// BinderSearch + CollectionsSection, the binder's search and saved sets.
//
// SEARCH runs over every document in the world (text, title, synopsis,
// notes, keywords) with regex and case toggles; results group by document
// in reading order with snippets, and a click opens the document on the
// exact match (src/lib/editor-text-map.ts selectMatch). While a query is
// active the results take the binder's place, as in Scrivener.
//
// COLLECTIONS are saved searches (re-run live) or saved hand-picked sets,
// stored on the world (worlds.settings.writingCollections). They sit at the
// top of the binder; each opens as Scrivenings or lists its members.
//
// Absorbs (Law VII): the per-document Find (Ctrl+F) stays for find and
// replace inside one document; this is the binder-wide reach it never had.
// ---------------------------------------------------------------------------

import { useDeferredValue, useMemo, useState, type RefObject } from "react";
import { ChevronDown, ChevronRight, Layers, MoreVertical, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FIELD_LABELS,
  searchBinder,
  type SearchHit,
  type SearchOptions,
} from "@/lib/binder-search";
import { collectionDocs, type WritingCollection } from "@/lib/writing-collections";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Search input (sits at the top of the binder)
// ---------------------------------------------------------------------------

export function BinderSearchInput({
  query,
  onQuery,
  opts,
  onOpts,
  inputRef,
}: {
  query: string;
  onQuery: (q: string) => void;
  opts: SearchOptions;
  onOpts: (o: SearchOptions) => void;
  inputRef: RefObject<HTMLInputElement>;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1 border-b border-sf-line-interactive px-2 py-1.5">
      <Search className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && query) {
            e.preventDefault();
            e.stopPropagation();
            onQuery("");
          }
        }}
        placeholder="Search the binder"
        aria-label="Search every document in this world"
        className="min-h-hit min-w-0 flex-1 bg-transparent px-1 text-[16px] text-t1 placeholder:text-t3"
      />
      <ToggleChip
        on={opts.caseSensitive}
        onClick={() => onOpts({ ...opts, caseSensitive: !opts.caseSensitive })}
        label="Match case"
      >
        Aa
      </ToggleChip>
      <ToggleChip on={opts.regex} onClick={() => onOpts({ ...opts, regex: !opts.regex })} label="Regular expression">
        .*
      </ToggleChip>
    </div>
  );
}

function ToggleChip({
  on,
  onClick,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex min-h-hit w-9 shrink-0 items-center justify-center border font-mono text-[12px] transition-colors duration-fast ${
        on ? "border-sf-primary text-sf-primary-text" : "border-transparent text-t4 hover:text-t1"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Results (replace the tree while a query is active)
// ---------------------------------------------------------------------------

export function BinderSearchResults({
  docs,
  query,
  opts,
  activeDocId,
  onJump,
  onSave,
  onScrivenings,
}: {
  /** Documents in reading order. */
  docs: WorldEntry[];
  query: string;
  opts: SearchOptions;
  activeDocId?: string;
  onJump: (docId: string, hit: SearchHit) => void;
  onSave: () => void;
  onScrivenings: (ids: string[]) => void;
}): JSX.Element {
  // Deferred: a long manuscript is searched after the keystroke paints.
  const deferred = useDeferredValue(query);
  const outcome = useMemo(() => searchBinder(docs, deferred, opts), [docs, deferred, opts]);

  if (outcome.error) {
    return (
      <p className="px-3 py-3 font-mono text-[12px] text-sf-crimson-text" role="status">
        {`// ${outcome.error}`}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <span className="font-mono text-[12px] text-t3" role="status" aria-live="polite">
          {outcome.totalHits === 0
            ? "NO MATCHES."
            : `${outcome.totalHits.toLocaleString()} ${outcome.totalHits === 1 ? "MATCH" : "MATCHES"} · ${outcome.results.length} ${outcome.results.length === 1 ? "DOC" : "DOCS"}`}
        </span>
        {outcome.results.length > 0 && (
          <span className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={() => onScrivenings(outcome.results.map((r) => r.docId))}
              className="min-h-hit border border-sf-line-interactive px-2 text-[12px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
              title="Read every matching document as one text"
            >
              Scrivenings
            </button>
            <button
              type="button"
              onClick={onSave}
              className="min-h-hit border border-sf-line-interactive px-2 text-[12px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
              title="Save this search as a collection"
            >
              Save
            </button>
          </span>
        )}
      </div>
      <ul className="flex flex-col">
        {outcome.results.map((r) => (
          <li key={r.docId} className="border-t border-sf-line-hairline py-1">
            <div className="flex items-baseline gap-2 px-3 pt-1">
              <span
                className={`min-w-0 flex-1 truncate font-serif text-[14px] ${r.docId === activeDocId ? "text-t1" : "text-t2"}`}
              >
                {r.title}
              </span>
              <span className="shrink-0 font-mono text-[12px] text-t4">{r.total}</span>
            </div>
            <ul>
              {r.hits.map((h, i) => (
                <li key={`${h.field}-${h.occurrence}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onJump(r.docId, h)}
                    className="flex min-h-hit w-full flex-col justify-center px-3 py-1 text-left transition-colors duration-fast hover:bg-sf-surface-elevated"
                  >
                    <span className="font-mono text-[12px] uppercase text-t4">{FIELD_LABELS[h.field]}</span>
                    <span className="line-clamp-2 font-serif text-[13px] text-t3">
                      {h.before}
                      <mark className="bg-sf-primary/[0.18] text-t1">{h.match}</mark>
                      {h.after}
                    </span>
                  </button>
                </li>
              ))}
              {r.total > r.hits.length && (
                <li className="px-3 pb-1 font-mono text-[12px] text-t4">+{r.total - r.hits.length} MORE IN THIS DOCUMENT</li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collections (top of the binder)
// ---------------------------------------------------------------------------

export function CollectionsSection({
  collections,
  docs,
  activeDocId,
  local,
  onOpenDoc,
  onScrivenings,
  onRunSearch,
  onDelete,
}: {
  collections: WritingCollection[];
  /** Documents in reading order. */
  docs: WorldEntry[];
  activeDocId?: string;
  /** Collections are stored in this browser until the settings column exists. */
  local: boolean;
  onOpenDoc: (id: string) => void;
  onScrivenings: (ids: string[], title: string) => void;
  onRunSearch: (c: WritingCollection) => void;
  onDelete: (c: WritingCollection) => void;
}): JSX.Element | null {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  if (collections.length === 0) return null;

  return (
    <div className="border-b border-sf-line-interactive pb-1">
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 font-heading text-sf-eyebrow uppercase text-t4">
        <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Collections
      </p>
      {local && (
        <p className="px-3 pb-1 font-mono text-[12px] text-sf-amber-text">{"// SAVED IN THIS BROWSER"}</p>
      )}
      <ul>
        {collections.map((c) => (
          <CollectionRow
            key={c.id}
            collection={c}
            docs={docs}
            expanded={open.has(c.id)}
            activeDocId={activeDocId}
            onToggle={() =>
              setOpen((prev) => {
                const next = new Set(prev);
                if (next.has(c.id)) next.delete(c.id);
                else next.add(c.id);
                return next;
              })
            }
            onOpenDoc={onOpenDoc}
            onScrivenings={onScrivenings}
            onRunSearch={onRunSearch}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

function CollectionRow({
  collection: c,
  docs,
  expanded,
  activeDocId,
  onToggle,
  onOpenDoc,
  onScrivenings,
  onRunSearch,
  onDelete,
}: {
  collection: WritingCollection;
  docs: WorldEntry[];
  expanded: boolean;
  activeDocId?: string;
  onToggle: () => void;
  onOpenDoc: (id: string) => void;
  onScrivenings: (ids: string[], title: string) => void;
  onRunSearch: (c: WritingCollection) => void;
  onDelete: (c: WritingCollection) => void;
}): JSX.Element {
  const members = useMemo(() => collectionDocs(c, docs), [c, docs]);
  return (
    <li>
      <div className="group flex min-h-hit items-center pr-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-h-hit min-w-0 flex-1 items-center gap-1.5 pl-2 text-left text-[13px] text-t2 transition-colors duration-fast hover:text-t1"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
          )}
          {c.kind === "search" && <Search className="h-3 w-3 shrink-0 text-t4" aria-label="Saved search" />}
          <span className="truncate">{c.name}</span>
          <span className="ml-auto shrink-0 pl-2 font-mono text-[12px] text-t4">{members.length}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for collection ${c.name}`}
              className="flex min-h-hit w-8 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-primary-text"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              disabled={members.length === 0}
              onClick={() => onScrivenings(members.map((m) => m.id), c.name)}
            >
              View as Scrivenings
            </DropdownMenuItem>
            {c.kind === "search" && (
              <DropdownMenuItem onClick={() => onRunSearch(c)}>Show search results</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sf-crimson-text focus:text-sf-crimson-text" onClick={() => onDelete(c)}>
              Delete collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && (
        <ul className="pb-1">
          {members.length === 0 ? (
            <li className="px-8 py-1 font-serif text-[13px] italic text-t3">
              {c.kind === "search" ? "Nothing matches this search now." : "Every document in it was removed."}
            </li>
          ) : (
            members.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onOpenDoc(m.id)}
                  aria-current={m.id === activeDocId ? "page" : undefined}
                  className={`flex min-h-hit w-full items-center pl-8 pr-2 text-left font-serif text-[14px] transition-colors duration-fast hover:bg-sf-surface-elevated ${
                    m.id === activeDocId ? "text-t1" : "text-t2"
                  }`}
                >
                  <span className="truncate">{m.title || "Untitled"}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}

/** Small bar shown while documents are multi-selected in the binder. */
export function SelectionBar({
  count,
  onScrivenings,
  onSave,
  onClear,
}: {
  count: number;
  onScrivenings: () => void;
  onSave: () => void;
  onClear: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-sf-line-interactive bg-sf-surface px-2 py-1.5">
      <span className="px-1 font-mono text-[12px] text-t3">{count} SELECTED</span>
      <button
        type="button"
        onClick={onScrivenings}
        className="min-h-hit border border-sf-primary px-2 text-[12px] text-sf-primary-text transition-colors duration-base hover:bg-sf-primary/[0.08]"
      >
        View as Scrivenings
      </button>
      <button
        type="button"
        onClick={onSave}
        className="min-h-hit border border-sf-line-interactive px-2 text-[12px] text-t2 transition-colors duration-base hover:border-sf-primary hover:text-t1"
      >
        Collect
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear the selection"
        className="ml-auto flex min-h-hit w-9 items-center justify-center text-t4 transition-colors duration-base hover:text-t1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
