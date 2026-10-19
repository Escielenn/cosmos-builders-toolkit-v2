import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface GuideNavItem {
  label: string;
  to: string;
  match: (pathname: string) => boolean;
}

const ITEMS: GuideNavItem[] = [
  {
    label: "Guide",
    to: "/guide",
    match: (p) => p === "/guide",
  },
  {
    label: "Getting Started",
    to: "/getting-started",
    match: (p) => p === "/getting-started",
  },
  {
    label: "Tool Reference",
    to: "/guide/tools",
    match: (p) => p === "/guide/tools",
  },
  {
    label: "Field Manual",
    to: "/guide/field-manual",
    match: (p) => p === "/guide/field-manual",
  },
  {
    label: "SF University",
    to: "/learn",
    match: (p) => p === "/learn" || p.startsWith("/learn/"),
  },
];

/**
 * Guide section tabs. Sits inside the PageHeader (as its children) on every
 * guide page, left-aligned with the title (15-PAGE-CHROME).
 */
export function GuideNav({ className }: { className?: string } = {}) {
  const { pathname } = useLocation();

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-2", className)}
      aria-label="Guide navigation"
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex min-h-hit items-center px-4 font-sans text-xs font-medium uppercase tracking-wider border rounded-none transition-colors duration-base ease-sf-out",
              active
                ? "text-sf-primary-text border-sf-primary bg-sf-primary/[0.06]"
                : "text-t3 hover:text-sf-primary-text border-sf-line hover:border-sf-line-emphasis"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
