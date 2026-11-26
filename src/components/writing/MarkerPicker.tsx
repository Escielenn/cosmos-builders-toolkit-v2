// ---------------------------------------------------------------------------
// MarkerPicker: choose a document's marker (1.7).
//
// A marker is the writer's own emoji for a document. The picker searches a
// compact built-in shelf (lib/writing/emoji.ts), remembers recent choices on
// this device, and takes any emoji the system keyboard can type. No emoji
// dataset ships with the app.
//
// The emoji shown are the writer's content. The picker's own strings carry
// none.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markerOf } from "@/lib/document-meta";
import {
  MARKER_GROUPS,
  RECENT_MARKERS_KEY,
  pushRecentMarker,
  sanitizeRecentMarkers,
  searchMarkers,
} from "@/lib/writing/emoji";
import { EMOJI_FONT } from "@/components/writing/DocMarks";

function readRecent(): string[] {
  try {
    return sanitizeRecentMarkers(JSON.parse(localStorage.getItem(RECENT_MARKERS_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function writeRecent(list: string[]): void {
  try {
    localStorage.setItem(RECENT_MARKERS_KEY, JSON.stringify(list));
  } catch {
    /* private mode: recents last this visit */
  }
}

const CELL =
  "flex h-11 w-11 items-center justify-center text-[20px] leading-none transition-colors duration-fast hover:bg-sf-surface";

export function MarkerPicker({
  value,
  onChange,
  children,
  align = "start",
}: {
  value: string;
  /** "" clears the marker. */
  onChange: (marker: string) => void;
  /** The trigger (a button). */
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [own, setOwn] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setOwn("");
    setRecent(readRecent());
  }, [open]);

  const found = useMemo(() => searchMarkers(query), [query]);

  const pick = (raw: string) => {
    const m = markerOf(raw);
    if (!m) return;
    const next = pushRecentMarker(readRecent(), m);
    writeRecent(next);
    onChange(m);
    setOpen(false);
  };

  const grid = (items: string[], label: string) => (
    <div role="group" aria-label={label} className="flex flex-wrap">
      {items.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => pick(e)}
          aria-label={`Use ${e}`}
          aria-pressed={e === value}
          className={`${CELL} ${e === value ? "bg-sf-surface outline outline-1 -outline-offset-1 outline-sf-primary" : ""}`}
          style={{ fontFamily: EMOJI_FONT }}
        >
          {e}
        </button>
      ))}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[19.5rem] rounded-none border-sf-line bg-sf-surface-elevated p-0">
        <div className="border-b border-sf-line-hairline p-3">
          <label htmlFor="sf-marker-search" className="sr-only">
            Search markers
          </label>
          <input
            id="sf-marker-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: moon, fight, draft…"
            autoComplete="off"
            className="sf-field min-h-hit w-full px-3 font-sans text-[16px] text-t1"
          />
        </div>
        <div className="sf-sb sf-sb--slim max-h-[18rem] overflow-y-auto p-2">
          {query.trim() ? (
            found.length > 0 ? (
              grid(found, "Matching markers")
            ) : (
              <p className="px-1 py-3 font-sans text-[13px] text-t3">
                Nothing on the shelf for that. Type or paste any emoji below.
              </p>
            )
          ) : (
            <>
              {recent.length > 0 && (
                <section className="mb-2">
                  <h4 className="px-1 pb-1 font-heading text-sf-eyebrow uppercase text-t4">Recent</h4>
                  {grid(recent, "Recent markers")}
                </section>
              )}
              {MARKER_GROUPS.map((g) => (
                <section key={g.id} className="mb-2">
                  <h4 className="px-1 pb-1 font-heading text-sf-eyebrow uppercase text-t4">{g.name}</h4>
                  {grid([...new Set(g.items.map((i) => i[0]))], g.name)}
                </section>
              ))}
            </>
          )}
        </div>
        <form
          className="flex items-center gap-2 border-t border-sf-line-hairline p-3"
          onSubmit={(e) => {
            e.preventDefault();
            pick(own);
          }}
        >
          <label htmlFor="sf-marker-own" className="sr-only">
            Any emoji or character
          </label>
          <input
            id="sf-marker-own"
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            placeholder="Any emoji"
            autoComplete="off"
            className="sf-field min-h-hit min-w-0 flex-1 px-3 text-[16px] text-t1"
            style={{ fontFamily: `"DM Sans", ${EMOJI_FONT}` }}
          />
          <button
            type="submit"
            disabled={!markerOf(own)}
            className="min-h-hit border border-sf-line px-3 font-sans text-[13px] font-medium text-t2 transition-colors duration-fast hover:border-sf-line-emphasis hover:text-t1 disabled:border-sf-disabled-line disabled:text-sf-disabled-text"
          >
            Use
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="min-h-hit px-2 font-sans text-[13px] text-t3 transition-colors duration-fast hover:text-t1"
            >
              Clear
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}

export default MarkerPicker;
