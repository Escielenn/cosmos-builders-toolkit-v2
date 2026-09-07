// ---------------------------------------------------------------------------
// use-sim-open-on (Brief S1) — "every simulator route accepts ?entityId= and
// hydrates from canon".
//
// One hook, every simulator. Brief S1's constraint is explicit: if you find
// yourself writing a function whose name contains two tool names, stop —
// that's a handoff. Nothing here knows which tool produced the entity; it
// reads the subject from the URL, asks open-on.ts for a parameters patch, and
// posts it through the STELLARFORGE_LOAD message every sim.html implements.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSubjectEntity } from "@/hooks/use-subject-entity";
import { buildSimSeed } from "@/lib/simulators/open-on";

interface UseSimOpenOnOptions {
  simulatorType: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** The iframe has loaded and registered its message listener. */
  loaded: boolean;
  /** Pull the sim's state back afterwards so Save/Publish see the seeded run. */
  refreshPayload?: () => void;
  /**
   * Skip when another seed source owns this page load — Tidelock's `?handoff=`
   * and its own readTidelockSeed path. Two seeds racing is worse than one.
   */
  skip?: boolean;
}

export function useSimOpenOn({
  simulatorType,
  iframeRef,
  loaded,
  refreshPayload,
  skip = false,
}: UseSimOpenOnOptions): void {
  const subject = useSubjectEntity();
  const [searchParams] = useSearchParams();
  const sent = useRef(false);

  const entry = subject.entry;
  const hasHandoff = searchParams.has("handoff");

  useEffect(() => {
    if (skip || hasHandoff || sent.current) return;
    if (!loaded || !entry) return;

    const seed = buildSimSeed(simulatorType, entry);
    if (!seed) return;

    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;

    sent.current = true;
    frame.contentWindow.postMessage(
      { type: "STELLARFORGE_LOAD", payload: { parameters: seed } },
      "*",
    );
    // postMessages to one window are processed in order, so this state
    // request lands after the seed above has been applied.
    refreshPayload?.();
  }, [skip, hasHandoff, loaded, entry, simulatorType, iframeRef, refreshPayload]);
}
