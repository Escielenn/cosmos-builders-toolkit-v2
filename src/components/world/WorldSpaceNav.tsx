// ---------------------------------------------------------------------------
// WorldSpaceNav — the four spaces (F6, 13-THE-LIFT.md §1).
//
//   BRIDGE       the state of the world
//   CODEX        every entry. List · Web · Atlas · Timeline
//   INSTRUMENTS  the tools and sims, opened ON an entry
//   MANUSCRIPT   the Studio editor, this world's documents
//
// Today a world is reachable through a dashboard, a sidebar, a quick-access
// card and a scatter of inline links, and none of them agree on what the
// world's top-level parts are. This is the one answer.
//
// It ADDS no destination: every space here already existed. What it removes is
// the need to know which surface happens to link to which other surface.
//
// The Manuscript lives inside the world (1.5 #26): /worlds/:id/write/:docId
// renders under this nav, so opening a document no longer leaves the world.
//
// Deliberately NOT done here: F6 also folds the dashboard into the Bridge and
// Notes/Pages into the Manuscript. Those delete surfaces, and a deletion wants
// the owner looking. This is the navigation half.
// ---------------------------------------------------------------------------

import { NavLink, useLocation } from "react-router-dom";
import { Compass, BookOpen, Gauge, PenLine } from "lucide-react";
import { isWorldManuscriptPath } from "@/lib/manuscript-path";

interface WorldSpaceNavProps {
  worldId: string;
}

interface Space {
  id: string;
  label: string;
  /** What the space holds; the link's tooltip. */
  hint: string;
  to: string;
  Icon: typeof Compass;
  /** Which paths count as "you are here". */
  match: (pathname: string, worldId: string) => boolean;
}

const SPACES: Space[] = [
  {
    id: "bridge",
    label: "Bridge",
    hint: "The state of this world",
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
    hint: "Every entry in this world",
    to: "/codex",
    Icon: BookOpen,
    match: (p, id) => p.startsWith(`/worlds/${id}/codex`),
  },
  {
    id: "instruments",
    label: "Instruments",
    hint: "Tools and simulators, opened on an entry",
    to: "/tools",
    Icon: Compass,
    match: (p, id) => p.startsWith(`/worlds/${id}/tools`),
  },
  {
    id: "manuscript",
    label: "Manuscript",
    hint: "This world's documents, in the Studio editor",
    to: "/write",
    Icon: PenLine,
    match: (p, id) =>
      isWorldManuscriptPath(p, id) ||
      p.startsWith(`/worlds/${id}/compile`),
  },
];

export function WorldSpaceNav({ worldId }: WorldSpaceNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="World"
      className="flex items-stretch border-b border-sf-line-hairline bg-sf-surface"
    >
      {SPACES.map(({ id, label, hint, to, Icon, match }) => {
        const active = match(pathname, worldId);
        return (
          <NavLink
            key={id}
            to={`/worlds/${worldId}${to}`}
            end={to === ""}
            // Below `sm` only the icon shows; the name must still be spoken.
            aria-label={label}
            title={hint}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-hit flex-1 items-center justify-center gap-1.5 border-b-2 px-3 font-heading text-[12px] uppercase tracking-wide transition-colors ${
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
