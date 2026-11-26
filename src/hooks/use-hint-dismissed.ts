import { useState, useEffect, useCallback, useRef } from "react";
import { HINT_PREFIX, HINTS } from "@/lib/onboarding/hints";

export function useHintDismissed(hintId: string): [boolean, () => void] {
  const [isDismissed, setIsDismissed] = useState(true); // default hidden to prevent flash
  // Set when this mount showed a "once" hint, so a re-run of the effect
  // (StrictMode, hintId unchanged) keeps it visible on this surface.
  const shownHere = useRef(false);

  useEffect(() => {
    try {
      if (shownHere.current) return;
      const dismissed = localStorage.getItem(HINT_PREFIX + hintId) === "true";
      setIsDismissed(dismissed);
      // A "once" hint counts as seen the first time it shows: record it now
      // so the next surface (the next world page) does not show it again.
      // It stays visible here until dismissed or until this surface unmounts.
      if (!dismissed && HINTS[hintId]?.once) {
        localStorage.setItem(HINT_PREFIX + hintId, "true");
        shownHere.current = true;
      }
    } catch {
      setIsDismissed(true);
    }
  }, [hintId]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(HINT_PREFIX + hintId, "true");
    } catch {
      /* storage unavailable (private mode / quota); state stays in memory */
    }
    shownHere.current = false;
    setIsDismissed(true);
  }, [hintId]);

  return [isDismissed, dismiss];
}
