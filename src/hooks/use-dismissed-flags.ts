import { useCallback, useState } from "react";

/**
 * Per-run dismiss state for SimFlagStrip. "Per run" means exactly that: a
 * fresh Set on every mount, so a dismissed flag reappears next time the
 * simulator loads (or after a save/load cycle if the caller resets it) —
 * never permanently silenced, per Brief S4.
 */
export function useDismissedFlags() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setDismissedIds(new Set()), []);

  return { dismissedIds, dismiss, reset };
}
