// Auto-reload when a dynamic import fails to fetch a chunk.
//
// Vite hashes every chunk by content. When a new deploy ships, the old chunks
// are removed. A long-lived browser tab still has the previous deploy's HTML
// in memory, with React.lazy() calls referencing chunk filenames that no
// longer exist on the server. Clicking into a lazy-loaded route then throws
// "Failed to fetch dynamically imported module" — caught by ErrorBoundary as
// SYSTEM FAULT.
//
// This module installs a window-level handler that reloads the page once on
// a chunk-load failure, picking up the new deploy without user intervention.
// A sessionStorage guard prevents reload loops if the issue persists across
// the new build.

const RELOAD_GUARD_KEY = "sf-preload-reload-attempted";
const RELOAD_GUARD_TTL_MS = 30_000;

if (typeof window !== "undefined") {
  // Vite-emitted event for module preload failures (covers React.lazy / dynamic import())
  window.addEventListener("vite:preloadError", () => {
    const lastAttempt = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (lastAttempt && Date.now() - Number(lastAttempt) < RELOAD_GUARD_TTL_MS) {
      // Already tried reloading recently — let the ErrorBoundary handle it
      // so the user sees a real error instead of an infinite refresh loop
      return;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
  });

  // Catch generic chunk-load TypeErrors that aren't routed through the Vite event
  window.addEventListener("error", (event) => {
    const message = event.message || "";
    if (
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("error loading dynamically imported module")
    ) {
      const lastAttempt = sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (lastAttempt && Date.now() - Number(lastAttempt) < RELOAD_GUARD_TTL_MS) {
        return;
      }
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      window.location.reload();
    }
  });
}

export {};
