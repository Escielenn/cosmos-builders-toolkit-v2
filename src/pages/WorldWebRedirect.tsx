import { Navigate, useParams, useSearchParams } from "react-router-dom";

/**
 * `/worlds/:worldId/graph` and `/worlds/:worldId/connections` are retired.
 *
 * They were three views of two graphs on two routes; F3 collapsed them into
 * the Codex's Web view, which is one view of one graph at one address
 * (13-THE-LIFT.md §1, Law VII). Both old deep-link shapes translate:
 *
 *   /graph?entity=<id>        → /codex?view=web&focus=<id>
 *   /connections?focus=<id>   → /codex?view=web&focus=<id>
 *   /connections?create=true  → /codex?view=web&create=true
 */
const WorldWebRedirect = (): JSX.Element => {
  const { worldId } = useParams<{ worldId: string }>();
  const [searchParams] = useSearchParams();

  if (!worldId) return <Navigate to="/worlds" replace />;

  const next = new URLSearchParams({ view: "web" });
  const focus = searchParams.get("focus") ?? searchParams.get("entity");
  if (focus) next.set("focus", focus);
  if (searchParams.get("create") === "true") next.set("create", "true");

  return <Navigate to={`/worlds/${worldId}/codex?${next.toString()}`} replace />;
};

export default WorldWebRedirect;
