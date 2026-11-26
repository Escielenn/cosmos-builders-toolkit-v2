// ---------------------------------------------------------------------------
// Features page sections (finding 4). Text plus small data lines in the
// product's own voice; no screenshots, no cards in cards. Every count reads
// from src/lib/tools-config.ts and every plan promise from plan-features.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingSection, SectionHeading } from "@/components/landing/marketing-ui";
import { getToolShortName } from "@/components/landing/instrument-layers";
import { COMPILE_FORMAT_NAMES, PRO_PLAN_ITEMS } from "@/lib/plan-features";
import { PRICING, SIMULATOR_COUNT, SIMULATOR_TOOL_IDS } from "@/lib/tools-config";

const HIGHLIGHTS = [
  {
    label: "Simulators that write canon",
    body: `${SIMULATOR_COUNT} real-time simulators run the orbits, skies and tides. When a run says something true about your world, promote it to canon in one step; nothing is promoted for you.`,
    data: SIMULATOR_TOOL_IDS.map(getToolShortName).join(" · "),
  },
  {
    label: "Characters born into the world",
    body: "Dossier starts a character from a homeworld, species, polity and culture. Lifespan, senses, native gravity and funeral customs arrive pre-filled, and every override is marked.",
    data: "Homeworld Kepler Reach · native gravity 1.8 g · lifespan 61 yr",
  },
  {
    label: "Time is an axis",
    body: "The Chronicle places facts and scenes in time. Branch it into alternate histories, track who travels between them, and catch causal loops before a reader does.",
    data: "Epoch 2340 CE · 3 branches · 1 causal loop",
  },
  {
    label: "Compile the book",
    body: "The Studio compiles your manuscript with generated back matter: glossary, dramatis personae and a series bible, drawn from the same canon the scenes use.",
    data: COMPILE_FORMAT_NAMES.join(" · "),
  },
] as const;

export function HighlightsSection(): JSX.Element {
  return (
    <MarketingSection id="highlights" labelledBy="highlights-title">
      <SectionHeading id="highlights-title" label="In practice" title="What the connections buy you" />
      <ul className="grid gap-x-12 border-t border-sf-line md:grid-cols-2">
        {HIGHLIGHTS.map((h) => (
          <li key={h.label} className="border-b border-sf-line-hairline py-7">
            <h3 className="mb-2 font-heading text-sf-h3 font-normal text-t1">{h.label}</h3>
            <p className="mb-4 text-sf-body text-t2 sf-measure">{h.body}</p>
            <p className="font-mono text-sf-mono uppercase text-t4">{h.data}</p>
          </li>
        ))}
      </ul>
    </MarketingSection>
  );
}

export function ProSection(): JSX.Element {
  return (
    <MarketingSection id="pro" labelledBy="pro-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
        <SectionHeading
          id="pro-title"
          label="Pro"
          title="The whole instrument panel"
          lede={`The Studio is free and stays free. Pro opens everything else, from $${PRICING.pro.monthly.price} a month. Cancel any time; your manuscript never locks.`}
          className="mb-0 md:mb-0"
        />
        <div>
          <ul className="border-t border-sf-line">
            {PRO_PLAN_ITEMS.map((item) => (
              <li key={item} className="flex gap-4 border-b border-sf-line-hairline py-3.5 text-sf-body text-t2">
                <span aria-hidden className="pt-0.5 font-mono text-sf-mono text-sf-primary-text">+</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/pricing"
            className="mt-6 inline-flex min-h-hit items-center gap-2 font-sans text-sm font-medium text-sf-primary-text transition-colors duration-base ease-sf-out hover:text-t1"
          >
            Compare plans
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </MarketingSection>
  );
}

const OWNERSHIP = [
  { label: "Snapshots", body: "Save a draft before a risky revision, compare it with today, restore it." },
  { label: "Export anything", body: "Worksheets to PDF, Word, Notion or JSON. Manuscripts to Word, PDF or EPUB." },
  { label: "No training", body: "Your worlds and prose are never sold, never shared and never used to train AI models." },
  { label: "No lock-in", body: "Standard, documented formats. Take your worlds to any tool you choose." },
] as const;

export function OwnershipSection(): JSX.Element {
  return (
    <MarketingSection id="ownership" labelledBy="ownership-title">
      <SectionHeading
        id="ownership-title"
        label="Data sovereignty"
        title="Your worlds are yours alone"
        lede="Every word you write, every species you design, every civilization you build. We hold it for you and give it back whenever you ask."
      />
      <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {OWNERSHIP.map((o) => (
          <div key={o.label} className="border-t border-sf-line pt-4">
            <dt className="mb-2 font-heading text-sf-eyebrow uppercase text-t1">{o.label}</dt>
            <dd className="text-sm leading-[1.6] text-t2">{o.body}</dd>
          </div>
        ))}
      </dl>
    </MarketingSection>
  );
}
