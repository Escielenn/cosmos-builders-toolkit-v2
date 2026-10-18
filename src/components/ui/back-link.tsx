import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BackLink: the one way back. Replaces the four hand-rolled styles that grew
 * across the app (Jura caps, serif italic, sans micro, ghost Button, some with
 * an ArrowLeft icon AND a typed "←").
 *
 * Ship's Voice: the label is uppercase, imperative ("RETURN HOME").
 * One icon, never a second arrow glyph in the text. Pass `to` for a route or
 * `onClick` for an in-page step back (e.g. "RETURN TO LIST").
 */
interface BackLinkProps {
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const base =
  "inline-flex min-h-hit items-center gap-2 font-heading text-sf-eyebrow uppercase text-t3 " +
  "transition-colors duration-base ease-sf-out hover:text-sf-primary-text";

export function BackLink({ label, to, onClick, className }: BackLinkProps): JSX.Element {
  // Strip any legacy arrow glyph a caller still passes in the label.
  const text = label.replace(/^\s*[←‹<]\s*/, "").toUpperCase();
  const content = (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cn(base, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(base, className)}>
      {content}
    </button>
  );
}
