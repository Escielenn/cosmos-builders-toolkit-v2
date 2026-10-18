// ---------------------------------------------------------------------------
// Scrivenings, several documents read and edited as one continuous text.
//
// A folder (or a multi-selection in the binder, or a collection) opens here
// stitched in binder reading order. Each section is its OWN editor bound to
// its own document and saved through its own queue (useDocAutosave), so an
// edit always lands in the document it was typed in. Documents are never
// merged, split or rewritten; the rule between sections is presentation only.
//
// Each section opens on the text it had when Scrivenings opened, and later
// refetches never reset it (a refetch racing a pending save could otherwise
// put older words back on screen).
//
// VIRTUALIZED: only sections in or near the scroll viewport mount an editor.
// The rest hold a placeholder at their last measured height (or one
// estimated from the stored word count), so a 200-document folder mounts a
// handful of editors, not 200. A section that scrolls away unmounts; its
// editor hands its last words to the queue on the way out, and it remounts
// on the newest words this surface holds.
//
// Absorbs (Law VII): the one-document-at-a-time editor, for as long as the
// writer stays here; the view switch brings the single editor back.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { ReadOnlyNotice, SaveConflictNotice } from "@/components/writing/SaveConflictNotice";
import { useDocAutosave } from "@/hooks/use-doc-autosave";
import { useDocumentContentSet } from "@/hooks/use-document-contents";
import type { BinderDoc } from "@/hooks/use-writing-documents";
import { estimateSectionHeight } from "@/lib/writing/doc-scale";

export interface ScriveningsProps {
  worldId: string;
  /** The documents, already in binder reading order. */
  docs: BinderDoc[];
  /** What is being viewed: a folder's name, a collection's, or "Selection". */
  title: string;
  /** Classes and CSS variables of the writer's surface (font, leading, measure). */
  editorClassName: string;
  editorStyle: CSSProperties;
  onOpenDoc: (docId: string) => void;
  onClose: () => void;
  /** Called after words reach the streak ledger (refreshes "today"). */
  onWordsLedgered?: () => void;
  /** Viewer access: editors are read only and nothing is saved. */
  readOnly?: boolean;
}

/** Mount editors this far beyond the visible area (px, each direction). */
const NEAR_MARGIN_PX = 1200;

/** The nearest ancestor that scrolls vertically (the IntersectionObserver root). */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let cur = el?.parentElement ?? null;
  while (cur) {
    const oy = getComputedStyle(cur).overflowY;
    if (oy === "auto" || oy === "scroll") return cur;
    cur = cur.parentElement;
  }
  return null;
}

export function Scrivenings({
  worldId,
  docs,
  title,
  editorClassName,
  editorStyle,
  onOpenDoc,
  onClose,
  onWordsLedgered,
  readOnly = false,
}: ScriveningsProps): JSX.Element {
  const autosave = useDocAutosave(worldId, onWordsLedgered);
  const ids = useMemo(() => docs.map((d) => d.id), [docs]);
  const contents = useDocumentContentSet(worldId, ids);

  // Opening text per document, captured once (see header).
  const initial = useRef(new Map<string, string>());
  if (contents.data) {
    for (const d of docs) {
      if (initial.current.has(d.id)) continue;
      const c = contents.data[d.id];
      if (!c) continue;
      initial.current.set(d.id, c.content);
      autosave.register(d.id, c.content, c.updated_at, c.content_version);
    }
  }
  const ready = !!contents.data;

  // ---- which sections are near the viewport ------------------------------
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionEls = useRef(new Map<string, HTMLElement>());
  const heights = useRef(new Map<string, number>());
  const [near, setNear] = useState<ReadonlySet<string>>(() => new Set(ids.slice(0, 3)));
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // No observer (very old browsers, some test runners): mount them all.
      setNear(new Set(ids));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        setNear((prev) => {
          let next: Set<string> | null = null;
          for (const e of entries) {
            const id = (e.target as HTMLElement).dataset.docId;
            if (!id) continue;
            if (e.boundingClientRect.height > 0 && prev.has(id)) {
              heights.current.set(id, e.boundingClientRect.height);
            }
            if (e.isIntersecting && !prev.has(id)) {
              next ??= new Set(prev);
              next.add(id);
            } else if (!e.isIntersecting && prev.has(id)) {
              next ??= new Set(prev);
              next.delete(id);
            }
          }
          return next ?? prev;
        });
      },
      { root: scrollParent(rootRef.current), rootMargin: `${NEAR_MARGIN_PX}px 0px` },
    );
    observer.current = io;
    for (const el of sectionEls.current.values()) io.observe(el);
    return () => {
      io.disconnect();
      observer.current = null;
    };
  }, [ids]);

  // One stable ref callback per section, so a re-render does not detach and
  // re-observe every section.
  const refCallbacks = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const sectionRef = (id: string) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        const prev = sectionEls.current.get(id);
        if (prev && prev !== el) observer.current?.unobserve(prev);
        if (el) {
          sectionEls.current.set(id, el);
          observer.current?.observe(el);
        } else {
          sectionEls.current.delete(id);
        }
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  };

  const total = docs.reduce((n, d) => n + (d.word_count ?? 0), 0);
  const locked = readOnly || autosave.denied;

  return (
    <div
      ref={rootRef}
      className="mx-auto px-6 py-8"
      style={{ maxWidth: "var(--sf-writing-measure, 68ch)", ...editorStyle }}
    >
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sf-line-hairline pb-3">
        <span className="font-heading text-sf-eyebrow uppercase text-t4">Scrivenings</span>
        <span className="min-w-[10rem] flex-1 truncate font-serif text-[18px] italic text-t1">{title}</span>
        <span className="hidden shrink-0 font-mono text-[12px] text-t4 sm:inline">
          {docs.length} {docs.length === 1 ? "DOC" : "DOCS"} · {total.toLocaleString()} W ·{" "}
          {!ready ? "LOADING" : autosave.saving ? "SAVING…" : autosave.savedAt ? "SAVED" : "READY"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Leave Scrivenings"
          title="Back to the single-document editor"
          className="flex min-h-hit w-10 shrink-0 items-center justify-center border border-transparent text-t3 transition-colors duration-base hover:border-sf-line-emphasis hover:text-t1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {locked && <ReadOnlyNotice />}
      {contents.isError && (
        <p className="mb-6 font-mono text-[12px] uppercase text-sf-crimson-text" role="alert">
          {"// SECTIONS COULD NOT BE LOADED. NOTHING WAS CHANGED."}
        </p>
      )}

      {docs.length === 0 ? (
        <p className="font-serif text-[15px] italic text-t3">Nothing here to read yet. This folder holds no documents.</p>
      ) : (
        docs.map((d, i) => {
          const reload = autosave.reloaded[d.id];
          const mounted = ready && near.has(d.id) && initial.current.has(d.id);
          const conflict = autosave.conflicts.get(d.id);
          return (
            <section
              key={d.id}
              ref={sectionRef(d.id)}
              data-doc-id={d.id}
              aria-label={d.title || "Untitled"}
              className={i > 0 ? "mt-10" : ""}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-sf-line-hairline" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => {
                    void autosave.flushDoc(d.id);
                    onOpenDoc(d.id);
                  }}
                  title="Open this document on its own"
                  className="flex min-h-hit max-w-[70%] items-center gap-1.5 px-1 font-serif text-[14px] italic text-t3 transition-colors duration-base hover:text-sf-primary-text"
                >
                  <span className="truncate">{d.title || "Untitled"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </button>
                <span className="h-px flex-1 bg-sf-line-hairline" aria-hidden="true" />
              </div>
              {conflict && (
                <SaveConflictNotice
                  docId={d.id}
                  theirs={conflict.theirs}
                  mine={() => autosave.latestHtml(d.id) ?? conflict.mine}
                  onKeepMine={() => autosave.keepMine(d.id)}
                  onLoadTheirs={() => autosave.loadTheirs(d.id)}
                  label={d.title || "Untitled"}
                />
              )}
              {mounted ? (
                <SectionEditor
                  key={`${d.id}:${reload?.rev ?? 0}`}
                  openingHtml={reload?.html ?? autosave.latestHtml(d.id) ?? initial.current.get(d.id) ?? ""}
                  onChange={(html) => autosave.queue(d.id, html)}
                  worldId={worldId}
                  readOnly={locked}
                  className={editorClassName}
                />
              ) : (
                <div
                  aria-hidden="true"
                  data-testid="scrivenings-placeholder"
                  style={{ height: estimateSectionHeight(d.word_count ?? 0, heights.current.get(d.id)) }}
                  className="border-l border-sf-line-hairline"
                />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

/**
 * One section's editor. Its text is fixed at mount (the newest words this
 * surface holds at that moment) and never pushed in again while mounted, so
 * a re-render can never put older words over what is being typed.
 */
function SectionEditor({
  openingHtml,
  onChange,
  worldId,
  readOnly,
  className,
}: {
  openingHtml: string;
  onChange: (html: string) => void;
  worldId: string;
  readOnly: boolean;
  className: string;
}): JSX.Element {
  const [content] = useState(openingHtml);
  return (
    <StellarForgeEditor
      bare
      content={content}
      onChange={onChange}
      worldId={worldId}
      preset="full"
      readOnly={readOnly}
      placeholder="This section is empty. Write here."
      className={className}
      minHeight="4em"
    />
  );
}

export default Scrivenings;
