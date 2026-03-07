import { useState, useEffect, useRef, useMemo } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop";

interface UsePwaInstallReturn {
  canPrompt: boolean;
  isStandalone: boolean;
  platform: Platform;
  promptInstall: () => Promise<void>;
  manualInstructions: string;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Record<string, unknown>).standalone === true);

  const platform = useMemo((): Platform => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === "accepted") {
      setCanPrompt(false);
    }
    deferredPrompt.current = null;
  };

  const manualInstructions = useMemo(() => {
    if (platform === "ios")
      return "Tap the Share button, then \"Add to Home Screen\"";
    if (platform === "android")
      return "Tap the menu (\u22ee), then \"Add to Home Screen\"";
    const isMac =
      navigator.platform?.includes("Mac") ||
      navigator.userAgent.includes("Mac");
    return isMac ? "Press \u2318+D to bookmark" : "Press Ctrl+D to bookmark";
  }, [platform]);

  return { canPrompt, isStandalone, platform, promptInstall, manualInstructions };
}
