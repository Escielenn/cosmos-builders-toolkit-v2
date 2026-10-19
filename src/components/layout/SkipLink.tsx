import type { MouseEvent } from "react";

/** The id every layout gives its `<main>` landmark. */
export const MAIN_LANDMARK_ID = "main";

/**
 * Move focus to the page's main landmark. Prefers `#main`; falls back to the
 * first `<main>` so a page that has not been given the id still works. The
 * target gets tabindex="-1" if it has none, so focus lands on it and the next
 * Tab continues from inside the content. Returns false when the page has no
 * main landmark at all.
 */
export function focusMainLandmark(root: Document = document): boolean {
  const target =
    root.getElementById(MAIN_LANDMARK_ID) ?? root.querySelector<HTMLElement>("main");
  if (!target) return false;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus();
  if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ block: "start" });
  }
  return true;
}

/**
 * "Skip to content". Rendered once, first in the app shell, so it is the
 * first focusable element on every page. Hidden until it takes focus.
 */
export function SkipLink(): JSX.Element {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Handle it here rather than letting the hash change: the router would
    // treat #main as a navigation, and a page without the id would go nowhere.
    if (focusMainLandmark()) e.preventDefault();
  };
  return (
    <a href={`#${MAIN_LANDMARK_ID}`} className="sf-skip-link" onClick={onClick}>
      Skip to content
    </a>
  );
}

export default SkipLink;
