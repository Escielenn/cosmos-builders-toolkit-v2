// ---------------------------------------------------------------------------
// PageTitleBlock: the head of the page (1.7).
//
// Inside the sheet, above the prose: a status glyph and the document's
// marker, a small-caps eyebrow (where the document sits, and whose eyes we
// are behind when a POV is set) with a short hairline, the title in the
// page's serif, then a short rule in the role colour. Then the prose.
//
// The title edits in place and commits on blur, as it always has. The
// eyebrow is the world reaching the page: change the folder or the POV and
// it changes here.
// ---------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef } from "react";
import { STATUS_LABELS, type DocStatus } from "@/lib/document-meta";
import { ACCENT_VAR, statusAccent } from "@/lib/writing/doc-identity";
import { DocMarker, StatusGlyph } from "@/components/writing/DocMarks";
import { MarkerPicker } from "@/components/writing/MarkerPicker";

export interface PageTitleBlockProps {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleCommit: () => void;
  /** Enter in the title moves the caret to the prose. */
  onEnter?: () => void;
  readOnly?: boolean;
  /** Folder path, outermost first. Empty at the top level. */
  path: string[];
  pov?: string;
  status: DocStatus | "";
  marker?: string;
  onMarkerChange?: (marker: string) => void;
}

export function PageTitleBlock({
  title,
  onTitleChange,
  onTitleCommit,
  onEnter,
  readOnly = false,
  path,
  pov,
  status,
  marker,
  onMarkerChange,
}: PageTitleBlockProps): JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null);

  // A long title wraps; the field grows with it instead of scrolling.
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(fit, [title]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const where = path.length > 0 ? path.join(" / ") : "Manuscript";
  const accent = statusAccent(status);
  const glyphColor =
    accent === "none"
      ? "var(--room-ink-faint)"
      : `color-mix(in srgb, ${ACCENT_VAR[accent]}, var(--room-ink-strong) var(--room-graphic-ink, 0%))`;

  const tile = (
    <DocMarker marker={marker} className="text-[18px]" iconClassName="h-4 w-4" />
  );

  return (
    <div>
      <div className="sf-room-eyebrow">
        <span style={{ color: glyphColor }} className="inline-flex">
          <StatusGlyph status={status} title={status ? `Status: ${STATUS_LABELS[status]}` : "No status"} />
        </span>
        {onMarkerChange && !readOnly ? (
          <MarkerPicker value={marker ?? ""} onChange={onMarkerChange}>
            <button
              type="button"
              className="sf-room-marker sf-hit"
              aria-label={marker ? `Marker ${marker}. Change marker` : "Choose a marker for this document"}
              title="Document marker"
            >
              {tile}
            </button>
          </MarkerPicker>
        ) : (
          <span className="sf-room-marker">{tile}</span>
        )}
        <span className="sf-room-eyebrow-text" title={pov ? `${where} · POV ${pov}` : where}>
          {where}
          {pov ? <span> · POV {pov}</span> : null}
        </span>
        <span className="sf-room-eyebrow-rule" aria-hidden="true" />
      </div>
      <textarea
        ref={ref}
        rows={1}
        value={title}
        onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, " "))}
        onBlur={onTitleCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
            onEnter?.();
          }
        }}
        readOnly={readOnly}
        placeholder="Untitled"
        aria-label="Document title"
        spellCheck={false}
        className="sf-room-title"
      />
      <div className="sf-room-flourish" aria-hidden="true" />
    </div>
  );
}

export default PageTitleBlock;
