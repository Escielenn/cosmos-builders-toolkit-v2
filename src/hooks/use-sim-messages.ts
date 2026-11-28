import { useEffect, useRef, type RefObject } from "react";

/**
 * Parent-side guard for simulator postMessage traffic (1.9, X14).
 *
 * Every simulator page used to accept any `message` event whose
 * `data.type` looked right, from any window and any origin. A page that
 * framed StellarForge, or any other frame, could post STELLARFORGE_PUBLISH
 * or a forged STELLARFORGE_SAVE payload and have it published to a world.
 *
 * A simulator message is trusted only when it comes from this origin AND
 * from the expected window: the simulator iframe's contentWindow, or this
 * window itself for the component simulators (ExoSky) that post to
 * `window`. The static sims check the mirror image (source is
 * window.parent, same origin) in their own bridges.
 */
export function isTrustedSimMessage(
  event: Pick<MessageEvent, "origin" | "source">,
  expectedSource: MessageEventSource | Window | null | undefined,
  origin: string = window.location.origin,
): boolean {
  if (event.origin !== origin) return false;
  if (!expectedSource) return false;
  return event.source === expectedSource;
}

/** The window a page's simulator posts from: its iframe, else this window. */
export function simMessageSource(iframeRef?: RefObject<HTMLIFrameElement | null>): Window | null {
  const iframe = iframeRef?.current;
  if (iframeRef) return iframe?.contentWindow ?? null;
  return window;
}

/**
 * Subscribe to messages from one simulator. `handler` sees only messages
 * with a string `data.type` that pass isTrustedSimMessage. Pass the iframe
 * ref for iframe simulators; omit it for component simulators.
 */
export function useSimMessages(
  handler: (data: { type: string; payload?: unknown; [k: string]: unknown }, event: MessageEvent) => void,
  iframeRef?: RefObject<HTMLIFrameElement | null>,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!isTrustedSimMessage(event, simMessageSource(iframeRef))) return;
      const data = event.data;
      if (!data || typeof data !== "object" || typeof data.type !== "string") return;
      handlerRef.current(data, event);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [iframeRef]);
}
