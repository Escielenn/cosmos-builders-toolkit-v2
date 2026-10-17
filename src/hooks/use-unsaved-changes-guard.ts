import { useEffect } from "react";

/**
 * Warn before the tab closes or reloads while there is unsaved work.
 *
 * Browsers show their own generic prompt for `beforeunload`; the text cannot
 * be customised. In-app route changes are not intercepted here (react-router's
 * blocker needs a data router), so pair this with autosave where possible.
 */
export function useUnsavedChangesGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for Chrome/Edge to show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
