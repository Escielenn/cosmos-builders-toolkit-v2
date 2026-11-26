import { Pause, SpellCheck, Timer } from "lucide-react";
import { RoomHostSlot } from "@/components/writing/room/RoomHost";
import { formatClock, openPanel, togglePanel, useRoom } from "@/lib/writing/room-store";

/**
 * RoomStatus: small readouts the tools add to the Manuscript status bar
 * (focus timer, assistant issue count). Mounted once by Write.tsx in the
 * status bar, before the word count. 1.7 seam, see RoomTools.
 *
 * Quiet by default: nothing shows until a tool is at work. Each readout is
 * a button back to its panel. This mount is also the room's preferred host
 * (RoomHost): the status bar is the one place that stays through focus mode.
 */
export interface RoomStatusProps {
  worldId: string | null;
  documentId: string | null;
}

const READOUT =
  "sf-hit flex min-h-[32px] items-center gap-1.5 px-1 font-mono text-[12px] text-t4 transition-colors duration-base hover:text-t2";

export function RoomStatus({ worldId, documentId }: RoomStatusProps): JSX.Element | null {
  const running = useRoom((s) => s.timer.running);
  // Whole seconds only, so the bar re-renders once a second, not per tick.
  const seconds = useRoom((s) => Math.floor(s.timer.sessionMs / 1000));
  const assistantOn = useRoom((s) => s.assistant.settings.enabled);
  const phase = useRoom((s) => s.assistant.phase);
  const issues = useRoom((s) => s.assistant.issues.length);
  const targetsHosted = useRoom((s) => s.targetsHosted);

  const showTimer = targetsHosted && (running || seconds > 0);
  const clock = formatClock(seconds * 1000);

  return (
    <>
      <RoomHostSlot worldId={worldId} documentId={documentId} rank={0} />
      {showTimer && (
        <>
          <button
            type="button"
            onClick={(e) => togglePanel("targets", e.currentTarget)}
            aria-label={running ? `Focus timer running, ${clock}. Open targets` : `Focus timer paused at ${clock}. Open targets`}
            title={running ? "Focus timer running" : "Focus timer paused"}
            className={READOUT}
          >
            {running ? (
              <Timer className="h-3.5 w-3.5 text-sf-primary" aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className={running ? "text-sf-primary-text" : ""}>{clock}</span>
            {!running && <span className="hidden sm:inline">PAUSED</span>}
          </button>
          <span aria-hidden="true" className="sf-room-sep">·</span>
        </>
      )}
      {assistantOn && (
        // Phones: the bar has no room for a second readout; the count is in
        // the assistant's own tab and the bar button's label.
        <span className="hidden items-center gap-2 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={() => openPanel("assistant", { tab: "review" })}
            aria-label={
              phase === "failed"
                ? "Writing assistant unavailable. Open the assistant"
                : `Writing assistant: ${issues} flagged. Open the review list`
            }
            title="Writing assistant"
            className={READOUT}
          >
            <SpellCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className={phase === "failed" ? "text-sf-crimson-text" : issues > 0 ? "text-t2" : ""}>
              {phase === "failed" ? "// OFF" : phase === "loading" ? "LOADING" : issues}
            </span>
          </button>
          <span aria-hidden="true" className="sf-room-sep">·</span>
        </span>
      )}
    </>
  );
}

export default RoomStatus;
