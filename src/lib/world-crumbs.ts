// ---------------------------------------------------------------------------
// world-crumbs — the breadcrumb trail of a world space (15-PAGE-CHROME §2).
//
//   KEPLER REACH / CODEX / ASHGRAVE
//
// Inside a world the breadcrumbs replace every "RETURN TO BRIDGE" link: the
// world nav is the navigation, the crumbs say where you are. Written once so
// every space spells its trail the same way.
// ---------------------------------------------------------------------------

import type { Crumb } from "@/components/layout/page-chrome";

export type WorldSpaceName =
  | "Bridge"
  | "Codex"
  | "Chronicle"
  | "Instruments"
  | "Manuscript"
  | "Compile"
  | "Custom types";

const SPACE_PATH: Record<WorldSpaceName, string> = {
  Bridge: "",
  Codex: "/codex",
  Chronicle: "/chronicle",
  Instruments: "/tools",
  Manuscript: "/write",
  Compile: "/compile",
  "Custom types": "/custom-types",
};

/**
 * `[world, space, ...items]`. The world always links to its Bridge; the space
 * links to itself only when an item follows it (the last crumb is "you are
 * here" and never a link). Items may be plain labels or crumbs with links.
 */
export function worldCrumbs(
  world: { id: string; name?: string | null },
  space: WorldSpaceName,
  ...items: Array<string | Crumb | null | undefined | false>
): Crumb[] {
  const rest = items
    .filter((i): i is string | Crumb => !!i && (typeof i !== "string" || i.trim().length > 0))
    .map((i) => (typeof i === "string" ? { label: i } : i));
  const base = `/worlds/${world.id}`;
  return [
    { label: world.name?.trim() || "World", to: base },
    rest.length > 0 ? { label: space, to: `${base}${SPACE_PATH[space]}` } : { label: space },
    ...rest,
  ];
}
