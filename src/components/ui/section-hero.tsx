import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHero, canonical section header per April 2026 handoff.
 *
 * Mirrors the style guide's `.sg-sec-head` pattern (source/shared.css):
 *   <eyebrow>// 02 · COLOR SYSTEM</eyebrow>
 *   <h1>Color carries meaning.</h1>
 *   <subtitle>Accents are never decorative...</subtitle>
 *
 * Display font, 56px, weight 300, sentence case (NOT uppercase),
 * letter-spacing 0.04em (built into text-sf-h1). Eyebrow is mono in sf-teal
 * with a teal hairline rule preceding the text.
 *
 * Use this on every page-level section header. Use SectionHero.Hero
 * (text-sf-hero / 96px) for the very top hero on the landing page.
 */

interface SectionHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Mono eyebrow text, e.g. "// 02 · COLOR SYSTEM" or "// WORLD INDEX" */
  eyebrow?: string;
  /** Display H1 title, sentence case. Wrap accent words in <span>...</span> with text-sf-teal class for green emphasis. */
  title: React.ReactNode;
  /** Body subtitle, short paragraph in t3 */
  subtitle?: React.ReactNode;
  /** Optional right-aligned subtitle (matches sg-sec-head-r pattern) */
  rightSubtitle?: React.ReactNode;
  /** Show the teal hairline rule before the eyebrow (default: true) */
  rule?: boolean;
  /** Use the giant 96px hero scale instead of 56px section scale (default: false) */
  hero?: boolean;
  /**
   * "Studio meld" variant (marketing / public pages): render the title in
   * Lora italic serif and soften the eyebrow, for the warmer writer-adjacent
   * feel. Tools/instrument surfaces leave this off to keep the MD Nichrome
   * cockpit look. (Jason, 2026-07-10.)
   */
  warm?: boolean;
}

export function SectionHero({
  eyebrow,
  title,
  subtitle,
  rightSubtitle,
  rule = true,
  hero = false,
  warm = false,
  className,
  ...props
}: SectionHeroProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className="flex items-end justify-between gap-8">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div
              className={cn(
                "inline-flex items-center gap-3.5 font-mono uppercase mb-7",
                warm ? "text-sf-teal/80" : "text-sf-teal",
                hero ? "text-[13px] tracking-[3px]" : "text-[12px] tracking-[2.5px]",
              )}
            >
              {rule && (
                <span aria-hidden className={cn("block w-12 h-px", warm ? "bg-sf-primary-text" : "bg-sf-primary")} />
              )}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1
            className={cn(
              "font-light text-t1 m-0",
              warm ? "font-serif italic" : "font-display",
              hero
                ? "text-sf-hero leading-[0.98]"
                : "text-sf-h1 leading-[1.05]",
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-sf-body text-t2 mt-7 max-w-[780px] leading-[1.55]">
              {subtitle}
            </p>
          )}
        </div>
        {rightSubtitle && (
          <div className="hidden md:block max-w-[440px] font-sans text-sf-small text-t3 text-right leading-[1.55] pb-2">
            {rightSubtitle}
          </div>
        )}
      </div>
    </div>
  );
}
