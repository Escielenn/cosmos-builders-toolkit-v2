// ---------------------------------------------------------------------------
// Wordmark, the single rendering of the StellarForge name.
//
// This existed four different ways before: the header drew logo + teal split at
// 18px, the writing space drew the split at 14px with no logo, the footer drew
// flat ALL-CAPS with no split, and Studio drew plain serif text. One component
// so the brand can't drift again.
//
// The teal "Stellar" + neutral "forge" split is the canonical lockup.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import CubeLogo from "@/components/icons/CubeLogo";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WordmarkProps {
  /** Type size. sm suits dense chrome (editor bars), md the site header. */
  size?: "sm" | "md" | "lg";
  /** Show the cube mark alongside the name. */
  logo?: boolean;
  /**
   * Product suffix set in the writer voice, e.g. "Studio". Rendered as serif
   * italic so it reads as a subtitle rather than part of the name.
   */
  suffix?: string;
  /** Wrap in a link. Omit inside an existing anchor. */
  to?: string;
  /** Footer/brand-block treatment: uppercase, wider tracking. */
  uppercase?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

const NAME_SIZE = {
  sm: "text-[14px]",
  md: "text-lg",
  lg: "text-xl",
} as const;

const SUFFIX_SIZE = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[17px]",
} as const;

const LOGO_PX = { sm: 24, md: 32, lg: 36 } as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Wordmark({
  size = "md",
  logo = false,
  suffix,
  to,
  uppercase = false,
  className,
}: WordmarkProps) {
  const content = (
    <>
      {logo && <CubeLogo size={LOGO_PX[size]} className="rounded-none shrink-0" />}
      <span
        className={cn(
          "font-display font-light text-t1",
          NAME_SIZE[size],
          uppercase ? "uppercase tracking-sf-wide" : "tracking-sf-title",
        )}
      >
        <span className="text-sf-primary-text">Stellar</span>forge
      </span>
      {suffix && (
        <span className={cn("font-serif italic text-t2", SUFFIX_SIZE[size])}>
          {suffix}
        </span>
      )}
    </>
  );

  const wrapper = cn("inline-flex items-baseline gap-2", className);

  if (to) {
    return (
      <Link to={to} className={cn(wrapper, "group")}>
        {content}
      </Link>
    );
  }
  return <span className={wrapper}>{content}</span>;
}

export default Wordmark;
