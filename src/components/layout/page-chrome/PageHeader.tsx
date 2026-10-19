import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentArcClass, accentBgClass, accentTextClass, type ToolAccent } from "@/lib/tool-accents";

/**
 * PageHeader: the ONE page header (docs/stellarforge/15-PAGE-CHROME.md).
 *
 *   [breadcrumbs  KEPLER REACH / CODEX]        or  [← back link]
 *   ──── // EYEBROW                                 (accent hairline + mono)
 *   [icon] Title in MD Nichrome            [actions]
 *   Lede in DM Sans t2, bounded by the measure
 *   ── light arc
 *
 * Two sizes:
 *   page   standalone pages (Home, Worlds, Tools, Studio, Profile, Learn)
 *   space  inside a world space (Bridge, Codex, Chronicle, Instruments,
 *          Compile, in-world tools): same anatomy, one step smaller, because
 *          the world nav already says where you are.
 *
 * Rules it enforces so pages can't drift:
 *   - H1 is always MD Nichrome, weight 300, sentence/title case as written.
 *     No italic accent words, no trailing-period gimmicks (marketing pages
 *     keep their own hero; they don't use this component).
 *   - Eyebrow is always `// LABEL`, JetBrains Mono 12px, in the accent's
 *     -text stop, with the accent hairline.
 *   - Breadcrumbs XOR back link, never both. Inside a world, breadcrumbs.
 *     The logo already goes home, so there is no "RETURN HOME".
 */

export type PageAccent = ToolAccent | "primary";

export interface Crumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  /** Bold lead-in rendered before the title, e.g. a tool's brand "Goldilocks:". */
  titleLead?: React.ReactNode;
  eyebrow?: string;
  accent?: PageAccent;
  lede?: React.ReactNode;
  icon?: React.ReactNode;
  /** Small badge beside the title (PRO, SHARED, a status Tag). */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
  back?: { label: string; to: string };
  size?: "page" | "space";
  /** Extra content under the lede (worksheet title, tags, tabs). */
  children?: React.ReactNode;
  className?: string;
  /** Hide the decorative light arc (dense pages). */
  noArc?: boolean;
}

const PRIMARY = {
  text: "text-sf-primary-text",
  bg: "bg-sf-primary",
  arc: "from-sf-primary via-sf-primary/30 to-transparent",
};

function accentClasses(accent: PageAccent) {
  if (accent === "primary") return PRIMARY;
  return { text: accentTextClass(accent), bg: accentBgClass(accent), arc: accentArcClass(accent) };
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }): JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className={cn("font-mono text-sf-mono uppercase text-t4", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.to && !last ? (
                <Link
                  to={c.to}
                  className="inline-flex min-h-hit items-center text-t3 transition-colors duration-fast ease-sf-out hover:text-sf-primary-text"
                >
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-t2" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  titleLead,
  eyebrow,
  accent = "primary",
  lede,
  icon,
  badge,
  actions,
  breadcrumbs,
  back,
  size = "page",
  children,
  className,
  noArc = false,
}: PageHeaderProps): JSX.Element {
  const a = accentClasses(accent);
  const isSpace = size === "space";
  return (
    <header className={cn(isSpace ? "mb-8" : "mb-10", className)} data-page-header={size}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      ) : back ? (
        <Link
          to={back.to}
          className="mb-4 inline-flex min-h-hit items-center gap-2 font-heading text-sf-eyebrow uppercase text-t3 transition-colors duration-base ease-sf-out hover:text-sf-primary-text"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>{back.label.replace(/^\s*[←‹<]\s*/, "")}</span>
        </Link>
      ) : null}

      {eyebrow && (
        <div className={cn("mb-5 inline-flex items-center gap-3.5 font-mono text-sf-mono uppercase", a.text)}>
          <span aria-hidden className={cn("block h-px w-12", a.bg)} />
          <span>// {eyebrow.replace(/^\/\/\s*/, "")}</span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {icon && <span className="mt-1 shrink-0">{icon}</span>}
          <h1
            className={cn(
              "min-w-0 font-display font-light text-t1",
              isSpace ? "text-sf-h2 leading-[1.1]" : "text-sf-h1 leading-[1.04]",
            )}
          >
            {titleLead && <span className="font-normal">{titleLead} </span>}
            {title}
          </h1>
          {badge && <span className="mt-2 shrink-0 self-start">{badge}</span>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {lede && (
        <div className={cn("sf-measure font-sans text-sf-body leading-[1.55] text-t2", isSpace ? "mt-3" : "mt-5")}>
          {lede}
        </div>
      )}

      {!noArc && <div aria-hidden className={cn("h-px w-24 bg-gradient-to-r", a.arc, isSpace ? "mt-5" : "mt-7")} />}

      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}

export default PageHeader;
