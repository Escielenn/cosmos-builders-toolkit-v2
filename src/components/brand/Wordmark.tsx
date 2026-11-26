// ---------------------------------------------------------------------------
// Wordmark, the single StellarForge lockup.
//
// This existed four different ways before (header logo + split at 18px with
// an "SF" fallback below xl and the build number under it, the writing space
// split at 14px with no logo, the footer flat ALL-CAPS, Studio plain serif).
// 1.6 "Quiet Instrument": one lockup, used by the header, footer, auth pages
// and the mobile sheet. Phones get the same mark with the compact size, never
// an abbreviation. The build number lives in the footer only.
//
// Lockup: cube mark + "Stellarforge" in MD Nichrome 300, "Stellar" in the
// primary text stop, "forge" in t1. An optional product suffix ("Studio") is
// a Jura eyebrow, not Lora: the wordmark is chrome.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import CubeLogo from "@/components/icons/CubeLogo";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type WordmarkSize = "xs" | "sm" | "md" | "lg";

interface WordmarkProps {
  /**
   * xs: phone header (compact). sm: dense chrome (editor bars, mobile sheet).
   * md: site header and footer. lg: auth and gate cards.
   */
  size?: WordmarkSize;
  /** Show the cube mark. On by default: the mark is part of the lockup. */
  logo?: boolean;
  /** Product suffix, e.g. "Studio". Rendered as a Jura eyebrow. */
  suffix?: string;
  /** Wrap in a link. Omit inside an existing anchor. */
  to?: string;
  /** Accessible name for the link (defaults to "StellarForge home" when to="/"). */
  label?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

const NAME_SIZE: Record<WordmarkSize, string> = {
  xs: "text-[15px]",
  sm: "text-[16px]",
  md: "text-lg",
  lg: "text-2xl",
};

const LOGO_PX: Record<WordmarkSize, number> = { xs: 24, sm: 26, md: 30, lg: 44 };

const GAP: Record<WordmarkSize, string> = {
  xs: "gap-2",
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-3",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Wordmark({
  size = "md",
  logo = true,
  suffix,
  to,
  label,
  className,
}: WordmarkProps) {
  const content = (
    <>
      {logo && (
        <CubeLogo size={LOGO_PX[size]} className="rounded-none shrink-0" />
      )}
      <span
        className={cn(
          "font-display font-light leading-none tracking-title text-t1 whitespace-nowrap",
          NAME_SIZE[size],
        )}
      >
        <span className="text-sf-primary-text">Stellar</span>forge
      </span>
      {suffix && (
        <span className="font-heading text-sf-eyebrow uppercase text-t3 leading-none">
          {suffix}
        </span>
      )}
    </>
  );

  const wrapper = cn("inline-flex items-center", GAP[size], className);

  if (to) {
    return (
      <Link
        to={to}
        className={cn(wrapper, "group min-h-hit")}
        aria-label={label ?? (to === "/" ? "StellarForge home" : undefined)}
      >
        {content}
      </Link>
    );
  }
  return <span className={wrapper}>{content}</span>;
}

export default Wordmark;
