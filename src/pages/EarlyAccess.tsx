/**
 * /early — public landing / waitlist page.
 * Reference: design/Landing Page.html (Cowork Implementation Guide §2).
 * Register: MONO (campaign voice — // labels, tracked caps, no Lora).
 * Launch date derives from src/config/launch.ts — never hardcoded.
 */
import { useEffect, useState, type FormEvent } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { supabase } from "@/integrations/supabase/client";
import {
  LAUNCH_DATE_STAMP,
  LAUNCH_TIME_LABEL,
  daysUntilLaunch,
} from "@/config/launch";
import {
  FREE_TOOL_COUNT,
  SIMULATOR_COUNT,
  TOTAL_TOOL_COUNT,
} from "@/lib/tools-config";

// ── data ────────────────────────────────────────────────────────────

const MANIFEST_ROWS: { label: string; value: string; tone: string }[] = [
  { label: "LAUNCH", value: `${LAUNCH_DATE_STAMP} · ${LAUNCH_TIME_LABEL}`, tone: "text-sf-primary-text" },
  { label: "INSTRUMENTS", value: `${TOTAL_TOOL_COUNT} TOOLS INCL. ${SIMULATOR_COUNT} SIMULATORS`, tone: "text-t1" },
  { label: "FRAMEWORK", value: "ENVIRONMENTAL CASCADE", tone: "text-sf-stellar" },
  { label: "FREE TIER", value: `${FREE_TOOL_COUNT} TOOLS · UNLIMITED WORLDS`, tone: "text-t1" },
  { label: "PRO", value: "$4.99/MO · $49/YR", tone: "text-sf-amber" },
  { label: "EARLY CODE", value: "EARLY40 · 40% OFF YR 1", tone: "text-sf-primary-text" },
];

const STATS: { n: string; blurb: string }[] = [
  { n: String(TOTAL_TOOL_COUNT), blurb: "Instruments aboard. Calibrated, stacked, and wired together. One saves, all update." },
  { n: String(SIMULATOR_COUNT), blurb: "Full simulators: N-body, tidal lock, alien sky, procedural planet, procedural system." },
  { n: "∞", blurb: "Worlds per account, free tier included. Yours alone. Not read. Not trained on." },
  { n: "$4.99", blurb: "Per month for the full manifest. Or $49 per year. Or zero for the free three tools." },
];

const CATEGORY_TONE: Record<string, string> = {
  "STARS & SYSTEMS": "text-sf-amber",
  WORLDS: "text-sf-azure",
  LIFE: "text-sf-emerald",
  CIVILIZATIONS: "text-sf-violet",
  MYTHOLOGY: "text-sf-stellar",
  INTEGRATION: "text-sf-primary-text",
};

const TOOLS: { cat: string; name: string; blurb: string }[] = [
  { cat: "STARS & SYSTEMS", name: "ORRERY", blurb: "Multi-star system builder with real orbital mechanics." },
  { cat: "WORLDS", name: "GENESIS", blurb: "Planetary profile from atmosphere to albedo to habitability." },
  { cat: "LIFE", name: "PHYLO", blurb: "Biologically plausible alien species, 13 sections deep." },
  { cat: "CIVILIZATIONS", name: "DOMINION", blurb: "Governance, factions, territory that feels inevitable." },
  { cat: "MYTHOLOGY", name: "MYTHOS", blurb: "Myth that emerges from biology and environment, not human templates." },
  { cat: "INTEGRATION", name: "CASCADE", blurb: "Trace one change through five downstream layers." },
  { cat: "STARS & SYSTEMS", name: "EXOSKY", blurb: "The alien night sky from any known exoplanet. Real data." },
  { cat: "CIVILIZATIONS", name: "LEXDRIFT", blurb: "Language evolution: phonology, morphology, drift over millennia." },
  { cat: "LIFE", name: "SENSORIUM", blurb: "Alien sensory systems designed from physical constraints up." },
  { cat: "STARS & SYSTEMS", name: "ROGUE", blurb: "Drag rogue bodies into real exoplanet systems. Full N-body." },
];

// ── pieces (guide §2 component names) ───────────────────────────────

function CubeGlyph(): JSX.Element {
  const glow = { stroke: "hsl(var(--sf-primary-bright-hsl))" } as const;
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" style={glow} strokeWidth="1.2" />
      <path d="M20 4 L20 20 M20 20 L6 12 M20 20 L34 12" style={glow} strokeWidth="1" opacity="0.7" />
      <path d="M20 20 L20 36" style={glow} strokeWidth="1" opacity="0.5" />
      <circle cx="20" cy="20" r="1.6" style={{ fill: "hsl(var(--sf-primary-bright-hsl))" }} />
    </svg>
  );
}

function WaitlistForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    const { data, error } = await supabase.functions.invoke("waitlist-confirmation", {
      body: { email, source: "early-landing" },
    });
    if (error || (data && data.error)) {
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="flex max-w-[480px] border border-sf-line-emphasis bg-sf-surface/90"
      >
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sent"}
          placeholder="FREQUENCY · YOUR@EMAIL.COM"
          className="min-w-0 flex-1 bg-transparent px-[18px] py-4 font-mono text-[13px] tracking-[0.04em] text-t1 outline-none placeholder:text-[12px] placeholder:uppercase placeholder:tracking-[1.5px] placeholder:text-t4 focus-visible:ring-1 focus-visible:ring-sf-primary"
        />
        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="whitespace-nowrap bg-sf-primary px-[22px] py-4 font-sans text-xs font-medium uppercase tracking-[1.2px] text-[hsl(var(--accent-on-accent))] transition-shadow hover:shadow-sf-glow-teal disabled:cursor-default"
        >
          {status === "sent"
            ? "SIGNAL RECEIVED"
            : status === "sending"
              ? "TRANSMITTING…"
              : "REQUEST CLEARANCE →"}
        </button>
      </form>
      <div className="mt-[18px] font-mono text-[12px] uppercase tracking-[1.5px] text-t4" role="status">
        {status === "error"
          ? "TRANSMISSION FAILED · CHECK THE ADDRESS AND RETRY"
          : status === "sent"
            ? "CONFIRMATION EN ROUTE TO YOUR INBOX"
            : "NO SPAM · ONE TRANSMISSION PER WEEK · UNSUBSCRIBE ANY TIME"}
      </div>
    </div>
  );
}

function LandingHero(): JSX.Element {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <span className="h-px w-7 bg-sf-primary" aria-hidden="true" />
        <span className="font-mono text-[12px] tracking-[2px] text-sf-primary-text">
          {"// EARLY ACCESS · "}
          {LAUNCH_DATE_STAMP}
        </span>
      </div>
      <h1 className="mb-5 font-display text-5xl font-light leading-none tracking-[0.04em] text-t1 md:text-[68px]">
        The instrument
        <br />
        panel for
        <br />
        <span className="text-sf-primary-text">science&nbsp;fiction</span>
        <br />
        <em className="font-light italic text-sf-stellar">writers.</em>
      </h1>
      <p className="mb-4 max-w-[540px] text-[17px] leading-[1.55] text-t2">
        {TOTAL_TOOL_COUNT} worldbuilding tools that talk to each other. They all work the same
        way:{" "}
        <strong className="font-medium text-t1">worlds cascade.</strong> Change the gravity, the
        star type, or how your species senses the world, and everything downstream moves with it.
        Biology, politics, mythology, language.
      </p>
      <p className="mb-7 max-w-[540px] text-[17px] leading-[1.55] text-t3">
        Join the list. The first 500 writers get 40% off their first year of Pro.
      </p>
      <WaitlistForm />
    </div>
  );
}

function ManifestPanel(): JSX.Element {
  return (
    <GlassPanel glow className="relative p-7">
      <div className="absolute right-3.5 top-3.5 font-mono text-[12px] tracking-[1.5px] text-t4">
        {"// MANIFEST"}
      </div>
      <div className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
        SHIP'S MANIFEST · v0.8 → 1.0
      </div>
      <dl className="mt-3.5">
        {MANIFEST_ROWS.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-2 gap-[18px] py-3.5 ${i > 0 ? "border-t border-sf-line-interactive" : ""}`}
          >
            <dt className="m-0 font-mono text-[12px] uppercase tracking-[1.5px] text-t3">{row.label}</dt>
            <dd className={`m-0 font-mono text-[13px] ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 border-t border-sf-line-interactive pt-4 font-display text-[15px] italic leading-[1.4] tracking-[0.04em] text-t2">
        "These worlds exist in you. Waiting to be found."
      </div>
    </GlassPanel>
  );
}

function StatStrip(): JSX.Element {
  return (
    <div className="mt-[100px] grid grid-cols-2 gap-6 border-t border-sf-line-interactive pt-10 md:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.n}>
          <h3 className="mb-1.5 font-display text-[32px] font-light tracking-[0.04em] text-t1">{s.n}</h3>
          <p className="text-xs tracking-[0.02em] text-t3">{s.blurb}</p>
        </div>
      ))}
    </div>
  );
}

function ToolGrid(): JSX.Element {
  return (
    <div className="mt-20">
      <h2 className="mb-6 font-display text-[34px] font-light tracking-[0.05em] text-t1">
        A sample of the manifest.
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((tool) => (
          <div key={tool.name} className="rounded-none border border-sf-line-interactive bg-sf-surface/90 p-3.5">
            <div className={`font-mono text-[12px] uppercase tracking-[1.5px] ${CATEGORY_TONE[tool.cat]}`}>
              {tool.cat}
            </div>
            <div className="mt-1.5 font-display text-sm tracking-[0.04em] text-t1">{tool.name}</div>
            <div className="mt-1 text-[12px] leading-[1.4] text-t3">{tool.blurb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────

export default function EarlyAccess(): JSX.Element {
  const days = daysUntilLaunch();

  useEffect(() => {
    const prev = document.title;
    document.title = "StellarForge: Early Access opens August 11";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-[1200px] px-6 pb-20 pt-9 md:px-10">
      {/* nav */}
      <div className="mb-[60px] flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <CubeGlyph />
          <div className="font-display text-[15px] font-light uppercase tracking-[0.22em] text-t1">
            STELLAR<span className="text-sf-primary-text">FORGE</span>
          </div>
        </a>
        <div className="font-mono text-sm tracking-[3px] text-t1">
          T-MINUS <span className="text-sf-primary-text">{days}</span> {days === 1 ? "DAY" : "DAYS"}
        </div>
      </div>

      {/* hero */}
      <div className="grid min-h-[70vh] items-center gap-[60px] lg:grid-cols-[1.1fr_1fr]">
        <LandingHero />
        <ManifestPanel />
      </div>

      <StatStrip />
      <ToolGrid />

      {/* footer */}
      <div className="mt-20 flex flex-col gap-2 border-t border-sf-line-interactive pt-10 font-mono text-[12px] tracking-[2px] text-t4 sm:flex-row sm:justify-between">
        <span>© 2026 STELLARFORGE · ALL RIGHTS RESERVED</span>
        <span>BUILT IN THORNTON, CO · 39.87°N 104.97°W</span>
      </div>
    </div>
  );
}
