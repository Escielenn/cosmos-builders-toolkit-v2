// ---------------------------------------------------------------------------
// useAppFullscreen: the browser's Fullscreen API for the whole app (1.7).
//
// Distinct from focus mode: focus hides the Manuscript's chrome, fullscreen
// hides the browser's. A writer can have either or both. Where the API is
// missing (iPhone Safari) `supported` is false and the control is not shown.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useAppFullscreen(): { active: boolean; supported: boolean; toggle: () => void } {
  const { toast } = useToast();
  const [active, setActive] = useState<boolean>(
    () => typeof document !== "undefined" && !!document.fullscreenElement,
  );
  const supported =
    typeof document !== "undefined" &&
    !!document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === "function";

  useEffect(() => {
    const changed = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  const toggle = useCallback(() => {
    const run = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        toast({
          title: "FULLSCREEN UNAVAILABLE.",
          description: "The browser refused. Use its own fullscreen command instead.",
        });
      }
    };
    void run();
  }, [toast]);

  return { active, supported, toggle };
}
