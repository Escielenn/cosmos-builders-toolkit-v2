import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * KonamiCode, ↑↑↓↓←→←→BA unlocks a full-screen star chart overlay.
 *
 * Listens globally. On success, shows a dismissable modal titled "CAPTAIN'S
 * VIEW". Press Escape or click outside to close. Per handoff §15.
 */
const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiCode() {
  const [buffer, setBuffer] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setBuffer((prev) => {
        const next = [...prev, key].slice(-SEQUENCE.length);
        if (next.length === SEQUENCE.length && next.every((k, i) => k === SEQUENCE[i])) {
          setOpen(true);
          return [];
        }
        return next;
      });
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-sf-void/95 backdrop-blur-sf-side"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-label="Captain's View"
    >
      <div
        className="relative w-full max-w-5xl mx-4 bg-sf-surface border border-sf-primary/30 sf-bracket p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[12px] tracking-[0.18em] text-sf-primary-text uppercase mb-2">
              // CLEARANCE GRANTED
            </p>
            <h2 className="font-display font-light text-4xl tracking-[0.04em] text-t1 uppercase">
              Captain's View
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="font-mono text-[12px] tracking-[0.2em] uppercase text-t3 hover:text-sf-crimson transition-colors duration-base px-3 py-1 border border-sf-border"
          >
            [ESC] CLOSE
          </button>
        </div>

        <div className="relative aspect-video bg-sf-void border border-sf-border overflow-hidden">
          <div className="sf-starfield" />
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
            <p className="font-mono text-[12px] tracking-[0.18em] text-t3 uppercase">
              FULL-SCREEN NAVIGATIONAL CHART
            </p>
            <p className="font-mono text-[12px] tracking-[0.18em] text-t5 uppercase">
              TELEMETRY LOCK · 39.87°N 104.97°W · SOL COUNTER ACTIVE
            </p>
          </div>
        </div>

        <p className="mt-6 font-mono text-[12px] tracking-[0.18em] text-t4 uppercase">
          // YOU HAVE DEMONSTRATED MASTERY OF LEGACY INPUT PROTOCOLS. WELL FLOWN.
        </p>
      </div>
    </div>,
    document.body,
  );
}
