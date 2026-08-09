import { useState } from "react";
import { APP_VERSION } from "@/config/version";

/**
 * BuildSigil, clickable mono build-hash. On click, emits a 3-second
 * telemetry burst with a random incident code. April 2026 handoff §15.
 *
 * Footer ambient. Click reveals "// BUILD 0.6522 · RUN X7A9B2 · VERIFIED" style
 * telemetry that fades after 3s.
 */
export function BuildSigil({ className }: { className?: string }) {
  const [burst, setBurst] = useState<string | null>(null);

  const fire = () => {
    const code = Date.now().toString(36).toUpperCase().slice(-6);
    const verified = Math.random() > 0.1 ? "VERIFIED" : "DRIFT DETECTED";
    setBurst(`// BUILD ${APP_VERSION} · RUN ${code} · ${verified}`);
    setTimeout(() => setBurst(null), 3000);
  };

  return (
    <button
      type="button"
      onClick={fire}
      aria-label="Build telemetry burst"
      className={`font-mono text-[12px] tracking-[0.18em] uppercase text-t4 hover:text-sf-teal-bright transition-colors duration-base cursor-pointer ${className ?? ""}`}
    >
      {burst ? (
        <span className="animate-sf-pulse text-sf-teal">{burst}</span>
      ) : (
        <>BUILD {APP_VERSION}</>
      )}
    </button>
  );
}
