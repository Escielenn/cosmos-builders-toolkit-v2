// ---------------------------------------------------------------------------
// CaptureGutter, Canon Capture's quiet margin markers (Studio Charter §2.2:
// "a quiet inline affordance in the gutter, not a modal, not a popup, never
// anything that interrupts a sentence in flight").
//
// One marker per paragraph that holds a claim or a contradiction, in the
// margin to the left of the text column (the column's own padding), never in the text: the prose is not
// touched and no decoration enters the document. Each marker is a real
// button with an accessible name, reachable by keyboard, and opens the
// ledger on that item. Glyph and words differ by kind, so colour is never
// the only signal: ≠ a contradiction (amber), ⟡ a claim not on file (teal).
//
// Positions are read from the editor's DOM after detection, after edits (in
// an animation frame) and on resize. Hidden in Focus mode and below the
// phone layout, where there is no margin to sit in; the ledger still lists
// everything.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { CaptureItem, LiveParagraph } from "@/lib/writing/capture";

interface Marker {
  paragraphIndex: number;
  top: number;
  items: CaptureItem[];
}

function markerLabel(items: readonly CaptureItem[]): string {
  const c = items.filter((i) => i.kind === "contradiction").length;
  const n = items.length - c;
  const parts = [
    c ? `${c} contradiction${c === 1 ? "" : "s"}` : "",
    n ? `${n} claim${n === 1 ? "" : "s"} not on file` : "",
  ].filter(Boolean);
  return `${parts.join(", ")} in this paragraph. Open in the ledger.`;
}

export function CaptureGutter({
  editor,
  paragraphs,
  items,
  hidden,
  onSelect,
}: {
  editor: Editor | null;
  paragraphs: readonly LiveParagraph[];
  items: readonly CaptureItem[];
  hidden?: boolean;
  onSelect: (item: CaptureItem) => void;
}): JSX.Element | null {
  const boxRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const byParagraph = useMemo(() => {
    const m = new Map<number, CaptureItem[]>();
    for (const i of items) {
      const list = m.get(i.paragraphIndex);
      if (list) list.push(i);
      else m.set(i.paragraphIndex, [i]);
    }
    return m;
  }, [items]);

  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!editor || editor.isDestroyed || !box || byParagraph.size === 0) {
      setMarkers((prev) => (prev.length ? [] : prev));
      return;
    }
    const origin = box.getBoundingClientRect().top;
    const out: Marker[] = [];
    for (const [idx, list] of byParagraph) {
      const p = paragraphs[idx];
      if (!p) continue;
      let el: Node | null = null;
      try {
        el = editor.view.nodeDOM(p.pos);
      } catch {
        el = null;
      }
      if (!(el instanceof HTMLElement)) continue;
      out.push({ paragraphIndex: idx, top: el.getBoundingClientRect().top - origin, items: list });
    }
    setMarkers(out);
  }, [editor, paragraphs, byParagraph]);

  useEffect(() => {
    measure();
  }, [measure]);

  // Text moves as the writer types and as the window resizes. Reading a few
  // rects in an animation frame costs nothing the browser was not doing.
  useEffect(() => {
    if (!editor || editor.isDestroyed || byParagraph.size === 0) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    editor.on("update", schedule);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(editor.view.dom);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("update", schedule);
      ro?.disconnect();
    };
  }, [editor, measure, byParagraph]);

  if (hidden) return null;

  return (
    <div
      ref={boxRef}
      className="pointer-events-none absolute inset-y-0 right-full hidden w-6 md:block"
      role="group"
      aria-label="Canon Capture markers"
    >
      {markers.map((m) => {
        const contradiction = m.items.some((i) => i.kind === "contradiction");
        return (
          <button
            key={m.paragraphIndex}
            type="button"
            onClick={() => onSelect(m.items.find((i) => i.kind === "contradiction") ?? m.items[0])}
            aria-label={markerLabel(m.items)}
            title={contradiction ? "CONTRADICTION. REVIEW." : "CLAIM DETECTED. NOT ON FILE. ADOPT?"}
            style={{ top: m.top }}
            className={`pointer-events-auto absolute right-0 flex h-11 w-6 flex-col items-center justify-start pt-1 font-mono text-[14px] leading-none transition-colors duration-fast hover:text-t1 ${
              contradiction ? "text-sf-amber" : "text-sf-teal"
            }`}
          >
            <span aria-hidden="true">{contradiction ? "≠" : "⟡"}</span>
            {m.items.length > 1 && (
              <span aria-hidden="true" className="mt-0.5 text-[12px] text-t4">
                {m.items.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CaptureGutter;
