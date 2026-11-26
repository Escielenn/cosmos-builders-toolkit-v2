// ---------------------------------------------------------------------------
// DocMarks: the small marks a document carries wherever it is listed (1.7).
//
//   StatusGlyph  a ring that fills as the draft matures: outline (empty),
//                draft (half), revised (three quarters), final (full).
//                Shape first, colour second; always paired with a name for
//                screen readers.
//   StatusMark   glyph + name.
//   DocMarker    the writer's emoji, or a plain document icon when unset.
// ---------------------------------------------------------------------------

import { FileText } from "lucide-react";
import { STATUS_LABELS, STATUS_TONE, type DocStatus } from "@/lib/document-meta";
import { STATUS_PHASE } from "@/lib/writing/doc-identity";

/** Colour emoji where the platform has them, never a tofu box in Jura. */
export const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

export function StatusGlyph({
  status,
  className = "",
  title,
}: {
  status: DocStatus | "";
  className?: string;
  /** Tooltip / accessible name. Omit when a visible label sits beside it. */
  title?: string;
}): JSX.Element {
  const phase = status ? STATUS_PHASE[status] : -1;
  return (
    <svg
      viewBox="0 0 10 10"
      className={`sf-status-glyph ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {phase < 0 ? (
        // No status: a short dash, so the column still aligns.
        <path d="M2.5 5h5" stroke="currentColor" strokeWidth="1" fill="none" />
      ) : (
        <>
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
          {phase >= 1 && <circle cx="5" cy="5" r="4" fill="currentColor" />}
          {phase === 0.5 && <path d="M5 1a4 4 0 0 1 0 8z" fill="currentColor" />}
          {phase === 0.75 && <path d="M5 5V1a4 4 0 1 1-4 4z" fill="currentColor" />}
        </>
      )}
    </svg>
  );
}

/** Tone class for a status on instrument chrome. */
export function statusTone(status: DocStatus | ""): string {
  return status ? STATUS_TONE[status] : "text-t4";
}

export function StatusMark({
  status,
  className = "",
  onPaper = false,
}: {
  status: DocStatus | "";
  className?: string;
  /** On the sheet the mark takes the paper's ink, not the instrument's tiers. */
  onPaper?: boolean;
}): JSX.Element | null {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${onPaper ? "" : statusTone(status)} ${className}`}>
      <StatusGlyph status={status} />
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}

export function DocMarker({
  marker,
  className = "",
  iconClassName = "h-3.5 w-3.5 text-t4",
}: {
  marker?: string;
  className?: string;
  iconClassName?: string;
}): JSX.Element {
  return marker ? (
    <span aria-hidden="true" className={`inline-block leading-none ${className}`} style={{ fontFamily: EMOJI_FONT }}>
      {marker}
    </span>
  ) : (
    <FileText className={iconClassName} aria-hidden="true" />
  );
}
