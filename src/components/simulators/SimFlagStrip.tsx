import { X } from "lucide-react";
import type { SimFlag } from "@/sims/flags";

interface SimFlagStripProps {
  flags: SimFlag[];
  /** Ids the writer has dismissed for this run — filtered out before render. */
  dismissedIds: ReadonlySet<string>;
  onDismiss: (id: string) => void;
}

/**
 * Simulator consequence flags — Brief S4
 * (docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §2). A pure predicate
 * over the sim's own output noticed something the writer should know before
 * it ends up in a scene. Never blocking, never modal, dismissible per run.
 *
 * "tension" flags read amber (a physical constraint pushing back);
 * "opportunity" flags read teal (something worth writing toward).
 */
export function SimFlagStrip({ flags, dismissedIds, onDismiss }: SimFlagStripProps) {
  const visible = flags.filter((f) => !dismissedIds.has(f.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {visible.map((f) => {
        // Tailwind's compiler needs literal class strings, not interpolated
        // ones — a template literal here would silently produce no CSS.
        const style =
          f.severity === "opportunity"
            ? { border: "border-l border-sf-teal", title: "text-sf-teal" }
            : { border: "border-l border-sf-amber", title: "text-sf-amber" };
        return (
          <div key={f.id} className={`relative ${style.border} bg-sf-void/90 py-2 pl-3 pr-7 backdrop-blur-sm`}>
            <p className={`font-mono text-[11px] uppercase tracking-[1.2px] ${style.title}`}>{f.title}</p>
            <p className="mt-1 font-serif text-[13px] italic leading-relaxed text-t2">{f.body}</p>
            <button
              type="button"
              onClick={() => onDismiss(f.id)}
              aria-label={`Dismiss: ${f.title}`}
              className="absolute right-1.5 top-1.5 flex min-h-hit min-w-hit items-center justify-center text-t4 transition-colors hover:text-t1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default SimFlagStrip;
