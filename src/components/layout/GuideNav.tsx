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

export function GuideNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 mb-8"
      aria-label="Guide navigation"
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "px-4 py-2 text-xs uppercase tracking-wider border rounded-none transition-all",
              active
                ? "text-primary border-primary bg-primary/[0.06]"
                : "text-t3 hover:text-primary border-sf-line-interactive hover:border-primary"
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
