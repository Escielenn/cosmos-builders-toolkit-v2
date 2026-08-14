// ---------------------------------------------------------------------------
// DocumentMetaBar, the index-card fields for one document.
//
// Synopsis, POV, status and in-world date are what a corkboard or outliner
// displays. They lived nowhere: world_entries.metadata was written as {} at
// creation and never read, so the binder could only ever show titles.
//
// Deliberately quiet — collapsed to a single summary line until opened, so it
// never competes with the prose. Register: WRITER.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  DOC_STATUSES,
  STATUS_LABELS,
  STATUS_TONE,
  isDocMetaEmpty,
  type DocumentMeta,
  type DocStatus,
} from "@/lib/document-meta";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocumentMetaBarProps {
  meta: DocumentMeta;
  /** Called on blur / selection, not per keystroke. */
  onChange: (patch: Partial<DocumentMeta>) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentMetaBar({ meta, onChange, disabled }: DocumentMetaBarProps) {
  const [open, setOpen] = useState(false);
  const [synopsis, setSynopsis] = useState(meta.synopsis);
  const [pov, setPov] = useState(meta.pov);
  const [when, setWhen] = useState(meta.when);

  // Re-seed when switching documents, or the previous document's card persists.
  useEffect(() => {
    setSynopsis(meta.synopsis);
    setPov(meta.pov);
    setWhen(meta.when);
  }, [meta.synopsis, meta.pov, meta.when]);

  const commit = (key: keyof DocumentMeta, value: string) => {
    if (value === meta[key]) return; // nothing changed; don't write
    onChange({ [key]: value } as Partial<DocumentMeta>);
  };

  return (
    <div className="mb-6 border-y border-sf-border/60">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-t4" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-t4" />
        )}
        <span className="font-serif text-[13px] italic text-t3">
          {isDocMetaEmpty(meta) ? "Add a synopsis" : "Card"}
        </span>

        {/* Collapsed summary: what a corkboard card would show. */}
        {!open && !isDocMetaEmpty(meta) && (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {meta.status && (
              <span
                className={`shrink-0 font-mono text-[12px] uppercase tracking-[1.5px] ${STATUS_TONE[meta.status]}`}
              >
                {STATUS_LABELS[meta.status]}
              </span>
            )}
            {meta.pov && (
              <span className="shrink-0 font-serif text-[13px] italic text-t4">
                {meta.pov}
              </span>
            )}
            {meta.synopsis && (
              <span className="min-w-0 truncate font-serif text-[13px] italic text-t4">
                {meta.synopsis}
              </span>
            )}
          </span>
        )}
      </button>

      {open && (
        <div className="pb-4">
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            onBlur={() => commit("synopsis", synopsis)}
            disabled={disabled}
            rows={2}
            placeholder="What happens in this scene?"
            className="mb-3 w-full resize-y border border-sf-border bg-white/[0.03] px-3 py-2 font-serif text-[15px] leading-relaxed text-t2 placeholder:text-t5 focus:border-sf-teal/40 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                POV
              </span>
              <input
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                onBlur={() => commit("pov", pov)}
                disabled={disabled}
                placeholder="Whose eyes?"
                className="w-36 border border-sf-border bg-white/[0.03] px-2 py-1 font-serif text-[14px] text-t2 placeholder:text-t5 focus:border-sf-teal/40 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                When
              </span>
              <input
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                onBlur={() => commit("when", when)}
                disabled={disabled}
                placeholder="In-world date"
                className="w-36 border border-sf-border bg-white/[0.03] px-2 py-1 font-serif text-[14px] text-t2 placeholder:text-t5 focus:border-sf-teal/40 focus:outline-none"
              />
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                Status
              </span>
              {DOC_STATUSES.map((s: DocStatus) => (
                <button
                  key={s}
                  disabled={disabled}
                  onClick={() => onChange({ status: meta.status === s ? "" : s })}
                  aria-pressed={meta.status === s}
                  className={`border px-2 py-1 font-mono text-[12px] uppercase tracking-[1.2px] transition-colors ${
                    meta.status === s
                      ? `border-sf-teal/40 bg-sf-teal/[0.06] ${STATUS_TONE[s]}`
                      : "border-sf-border text-t4 hover:text-t2"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentMetaBar;
