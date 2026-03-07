import { useState, useEffect, useCallback } from "react";
import { HINT_PREFIX } from "@/lib/onboarding/hints";

export function useHintDismissed(hintId: string): [boolean, () => void] {
  const [isDismissed, setIsDismissed] = useState(true); // default hidden to prevent flash

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(HINT_PREFIX + hintId);
      setIsDismissed(dismissed === "true");
    } catch {
      setIsDismissed(true);
    }
  }, [hintId]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(HINT_PREFIX + hintId, "true");
    } catch {}
    setIsDismissed(true);
  }, [hintId]);

  return [isDismissed, dismiss];
}
