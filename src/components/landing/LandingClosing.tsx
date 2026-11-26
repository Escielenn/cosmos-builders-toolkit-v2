// ---------------------------------------------------------------------------
// The bottom of the landing: pricing teaser (one line per plan), a short
// FAQ, and the final call to action with the tagline.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FREE_TOOL_COUNT,
  PRICING,
  PRO_TOOL_COUNT,
  SIMULATOR_COUNT,
  TOTAL_TOOL_COUNT,
} from "@/lib/tools-config";
import { MarketingSection, SectionHeading } from "./marketing-ui";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    line: `The whole Studio, Codex, Chronicle and Canon, compile and ${FREE_TOOL_COUNT} instruments.`,
  },
  {
    name: "Pro",
    price: `$${PRICING.pro.monthly.price}`,
    per: "month",
    line: `All ${TOTAL_TOOL_COUNT} instruments, ${SIMULATOR_COUNT} simulators included, plus full-world exports.`,
    recommended: true,
  },
  {
    name: "Vanguard",
    price: `$${PRICING.vanguard.monthly.price}`,
    per: "month",
    line: "Everything in Pro, early access, roadmap votes and office hours.",
  },
] as const;

export function PricingTeaser(): JSX.Element {
  return (
    <MarketingSection id="pricing" labelledBy="pricing-title">
      <SectionHeading
        id="pricing-title"
        label="Access"
        title="Write the book free"
        lede="Pro never locks your manuscript. It opens the rest of the instrument panel."
      />
      <ul className="border-t border-sf-line">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-b border-sf-line-hairline py-5 md:grid-cols-[160px_minmax(0,1fr)_auto]"
          >
            <span className="flex items-center gap-3 font-heading text-lg text-t1">
              {p.name}
              {"recommended" in p && (
                <span className="rounded-sf-tag border border-sf-primary px-1.5 font-mono text-sf-mono uppercase text-sf-primary-text">
                  Recommended
                </span>
              )}
            </span>
            <span className="order-3 col-span-2 text-sf-body text-t2 md:order-none md:col-span-1">{p.line}</span>
            <span className="text-right font-mono text-t1">
              {p.price}
              <span className="text-sf-mono text-t4"> / {p.per}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link
          to="/pricing"
          className="inline-flex min-h-hit items-center gap-2 font-sans text-sm font-medium text-sf-primary-text transition-colors duration-base ease-sf-out hover:text-t1"
        >
          Compare plans
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </MarketingSection>
  );
}

const FAQ = [
  {
    q: "Is the writing Studio really free?",
    a: "Yes. The Studio (binder, corkboard, outliner, snapshots), the Codex, the Chronicle, Canon capture and Compile come with every free account, with no limit on worlds.",
  },
  {
    q: "What does Pro add?",
    a: `The other ${PRO_TOOL_COUNT} instruments, including ${SIMULATOR_COUNT} real-time simulators and both cartographers, the World Bible PDF, full-world exports and collaborator invites. Cancel any time; your manuscript stays open.`,
  },
  {
    q: "Do I need to know the science?",
    a: "No. Every instrument explains its numbers in plain language and offers sensible starting values. You make story decisions; the instruments keep the physics honest.",
  },
  {
    q: "Can I bring a manuscript I already started?",
    a: "Yes. Import Word, Markdown, plain text, RTF or a zipped Scrivener project into the binder, then start pulling canon out of it.",
  },
  {
    q: "Does StellarForge write for me?",
    a: "No. Nothing ever edits your prose. The Studio points at contradictions and offers to file claims; every decision stays yours. Your worlds are never used to train AI models.",
  },
  {
    q: "Who owns my worlds?",
    a: "You do. Export worksheets to PDF, Word, Notion or JSON and compile your manuscript to Word, PDF or EPUB whenever you like.",
  },
] as const;

export function LandingFAQ(): JSX.Element {
  return (
    <MarketingSection id="faq" labelledBy="faq-title">
      <SectionHeading id="faq-title" label="Questions" title="Before you begin" />
      <div className="max-w-3xl border-t border-sf-line">
        {FAQ.map((item) => (
          <details key={item.q} className="group border-b border-sf-line-hairline">
            <summary className="flex min-h-hit cursor-pointer list-none items-center justify-between gap-4 py-4 font-sans text-base font-medium text-t1 transition-colors duration-base hover:text-sf-primary-text [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus
                className="h-4 w-4 shrink-0 text-t3 transition-transform duration-base ease-sf-out group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="pb-5 text-sf-body text-t2 sf-measure">{item.a}</p>
          </details>
        ))}
      </div>
    </MarketingSection>
  );
}

export function FinalCTA(): JSX.Element {
  return (
    <section aria-labelledby="final-cta-title" className="py-14 text-center md:py-20 [section+&]:pt-0">
      <h2 id="final-cta-title" className="mx-auto mb-6 max-w-[18ch] font-display text-sf-h1 font-light text-t1">
        Your first world is one decision away
      </h2>
      <p className="mx-auto mb-10 font-serif text-xl italic text-t2">
        These worlds exist in you. Waiting to be found.
      </p>
      <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
        <Link to="/auth">
          Start writing free
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <p className="mt-4 text-sm text-t3">No credit card. Your worlds are yours alone.</p>
    </section>
  );
}
