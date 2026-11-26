// ---------------------------------------------------------------------------
// Shared marketing chrome for the landing, Features and Pricing pages.
//
// One heading style everywhere (finding 10): a `// LABEL` mono eyebrow with
// the accent hairline (the PageHeader eyebrow, 15-PAGE-CHROME §2), then an
// MD Nichrome h2. No Lora italic headings, no count badges, no icons in
// headings. Lora is reserved for the hero accent line and the tagline.
// ---------------------------------------------------------------------------

import * as React from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  centred = false,
}: {
  children: React.ReactNode;
  className?: string;
  centred?: boolean;
}): JSX.Element {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3.5 font-mono text-sf-mono uppercase text-sf-primary-text",
        className,
      )}
    >
      <span aria-hidden className={cn("block h-px bg-sf-primary", centred ? "w-8" : "w-12")} />
      <span>// {children}</span>
      {centred && <span aria-hidden className="block h-px w-8 bg-sf-primary" />}
    </p>
  );
}

export function SectionHeading({
  id,
  label,
  title,
  lede,
  centred = false,
  className,
}: {
  id?: string;
  label: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  centred?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("mb-10 md:mb-12", centred && "flex flex-col items-center text-center", className)}>
      <Eyebrow centred={centred} className="mb-4">
        {label}
      </Eyebrow>
      <h2 id={id} className="font-display text-sf-h2 font-light text-t1 max-w-[30ch] text-balance">
        {title}
      </h2>
      {lede && (
        <p className={cn("mt-4 font-sans text-sf-body text-t2 sf-measure", centred && "mx-auto")}>{lede}</p>
      )}
    </div>
  );
}

/** A landing section: generous vertical rhythm, labelled by its heading. */
export function MarketingSection({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-24 py-14 md:py-20 [section+&]:pt-0", className)}>
      {children}
    </section>
  );
}
