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
// Absorbs (Law VII): the one-document-at-a-time editor, for as long as the
// writer stays here; the view switch brings the single editor back.
// ---------------------------------------------------------------------------

import { useRef, type CSSProperties } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { useDocAutosave } from "@/hooks/use-doc-autosave";
import { countWords } from "@/lib/text";
import type { WorldEntry } from "@/services/world-data";

export interface ScriveningsProps {
  worldId: string;
  /** The documents, already in binder reading order. */
  docs: WorldEntry[];
  /** What is being viewed: a folder's name, a collection's, or "Selection". */
  title: string;
  /** Classes and CSS variables of the writer's surface (font, leading, measure). */
  editorClassName: string;
  editorStyle: CSSProperties;
  onOpenDoc: (docId: string) => void;
  onClose: () => void;
  /** Called after words reach the streak ledger (refreshes "today"). */
  onWordsLedgered?: () => void;
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
}: ScriveningsProps): JSX.Element {
  const autosave = useDocAutosave(worldId, onWordsLedgered);
  // Opening text per document, captured once (see header).
  const initial = useRef(new Map<string, string>());
  for (const d of docs) {
    if (!initial.current.has(d.id)) {
      initial.current.set(d.id, d.content ?? "");
      autosave.register(d.id, d.content);
    }
  }

  const total = docs.reduce((n, d) => n + countWords(d.content), 0);

  return (
    <div className="mx-auto px-6 py-8" style={{ maxWidth: "var(--sf-writing-measure, 68ch)", ...editorStyle }}>
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sf-line-interactive pb-3">
        <span className="font-heading text-sf-eyebrow uppercase text-t4">Scrivenings</span>
        <span className="min-w-[10rem] flex-1 truncate font-serif text-[18px] italic text-t1">{title}</span>
        <span className="hidden shrink-0 font-mono text-[12px] text-t4 sm:inline">
          {docs.length} {docs.length === 1 ? "DOC" : "DOCS"} · {total.toLocaleString()} W ·{" "}
          {autosave.saving ? "SAVING…" : autosave.savedAt ? "SAVED" : "READY"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Leave Scrivenings"
          title="Back to the single-document editor"
          className="flex min-h-hit w-10 shrink-0 items-center justify-center border border-sf-line-interactive text-t3 transition-colors duration-base hover:border-sf-line-emphasis hover:text-t1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="font-serif text-[15px] italic text-t3">Nothing here to read yet. This folder holds no documents.</p>
      ) : (
        docs.map((d, i) => (
          <section key={d.id} aria-label={d.title || "Untitled"} className={i > 0 ? "mt-10" : ""}>
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
            <StellarForgeEditor
              bare
              content={initial.current.get(d.id) ?? ""}
              onChange={(html) => autosave.queue(d.id, html)}
              worldId={worldId}
              preset="full"
              placeholder="This section is empty. Write here."
              className={editorClassName}
              minHeight="4em"
            />
          </section>
        ))
      )}
    </div>
  );
}

export default Scrivenings;
