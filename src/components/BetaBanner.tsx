import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * The early-access banner. 1.6 (finding 9): shown once, at the top of the
 * marketing landing and Home only (15-PAGE-CHROME §1), never inside a world
 * and never repeated above the footer. Dismissible; the dismissal is
 * remembered on this device.
 */

export const BETA_BANNER_DISMISSED_KEY = "sf-early-access-banner-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(BETA_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

const BetaBanner = () => {
  const [dismissed, setDismissed] = useState<boolean>(() =>
    typeof window === "undefined" ? false : readDismissed(),
  );

  if (dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(BETA_BANNER_DISMISSED_KEY, "1");
    } catch {
      /* storage blocked: hide for this visit only */
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Early access notice"
      className="border-b border-sf-line-hairline bg-sf-primary/[0.06] text-sf-primary-text"
    >
      <div className="container mx-auto flex items-center justify-center gap-2 pl-4 pr-1">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="font-mono text-sf-mono uppercase">
          OPEN EARLY ACCESS · STILL BUILDING ·{" "}
          <Link
            to="/contact?tab=beta"
            className="underline underline-offset-2 transition-colors duration-base hover:text-t1"
          >
            SUBMIT FIELD REPORT
          </Link>
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss early access notice"
          className="ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center text-t3 transition-colors duration-base hover:text-t1"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default BetaBanner;
