// ---------------------------------------------------------------------------
// WorldSpaceNav — the four spaces (F6, 13-THE-LIFT.md §1).
//
//   BRIDGE       the state of the world
//   CODEX        every entity. List · Web · Atlas
//   INSTRUMENTS  the tools and sims, opened ON an entity
//   MANUSCRIPT   the Studio
//
// Today a world is reachable through a dashboard, a sidebar, a quick-access
// card and a scatter of inline links, and none of them agree on what the
// world's top-level parts are. This is the one answer.
//
// It ADDS no destination: every space here already existed. What it removes is
// the need to know which surface happens to link to which other surface.
//
// Deliberately NOT done here: F6 also folds the dashboard into the Bridge and
// Notes/Pages into the Manuscript. Those delete surfaces, and a deletion wants
// the owner looking. This is the navigation half.
// ---------------------------------------------------------------------------

import { NavLink, useLocation } from "react-router-dom";
import { Compass, BookOpen, Gauge, PenLine } from "lucide-react";

interface WorldSpaceNavProps {
  worldId: string;
}

interface Space {
  id: string;
  label: string;
  to: string;
  Icon: typeof Compass;
  /** Which paths count as "you are here". */
  match: (pathname: string, worldId: string) => boolean;
}

const SPACES: Space[] = [
  {
    id: "bridge",
    label: "Bridge",
    to: "",
    Icon: Gauge,
    match: (p, id) =>
      p === `/worlds/${id}` ||
      p === `/worlds/${id}/` ||
      p.startsWith(`/worlds/${id}/chronicle`),
  },
  {
    id: "codex",
    label: "Codex",
    to: "/codex",
    Icon: BookOpen,
    match: (p, id) => p.startsWith(`/worlds/${id}/codex`),
  },
  {
    id: "instruments",
    label: "Instruments",
    to: "/tools",
    Icon: Compass,
    match: (p, id) => p.startsWith(`/worlds/${id}/tools`),
  },
  {
    id: "manuscript",
    label: "Manuscript",
    to: "/write",
    Icon: PenLine,
    match: (p, id) =>
      p.startsWith(`/worlds/${id}/write`) ||
      p.startsWith(`/worlds/${id}/compile`),
  },
];

export function WorldSpaceNav({ worldId }: WorldSpaceNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="World"
      className="flex items-stretch border-b border-sf-line bg-sf-surface"
    >
      {SPACES.map(({ id, label, to, Icon, match }) => {
        const active = match(pathname, worldId);
        return (
          <NavLink
            key={id}
            to={`/worlds/${worldId}${to}`}
            end={to === ""}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-hit flex-1 items-center justify-center gap-1.5 border-b-2 px-3 font-heading text-[12px] uppercase tracking-[0.2em] transition-colors ${
              active
                ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                : "border-transparent text-t3 hover:text-t1"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default WorldSpaceNav;
