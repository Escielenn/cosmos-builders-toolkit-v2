import { Navigate, useParams, useSearchParams } from "react-router-dom";

/**
 * /worlds/:worldId/graph is retired — Connections absorbed it (06-BUILD-ORDER.md
 * Phase 0: "Pick one of /graph and /connections. Redirect the other.").
 * Translates the old ?entity= deep link to Connections' ?focus=.
 */
const WorldGraphRedirect = (): JSX.Element => {
  const { worldId } = useParams<{ worldId: string }>();
  const [searchParams] = useSearchParams();

  const next = new URLSearchParams();
  const entity = searchParams.get("entity");
  if (entity) next.set("focus", entity);
  if (searchParams.get("create") === "true") next.set("create", "true");

  const query = next.toString();
  return (
    <Navigate
      to={`/worlds/${worldId}/connections${query ? `?${query}` : ""}`}
      replace
    />
  );
};

export default WorldGraphRedirect;
