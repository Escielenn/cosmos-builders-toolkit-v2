import { Navigate, useParams } from "react-router-dom";

/**
 * /worlds/:worldId/wiki — the pre-F2 address of the entry list. The wiki
 * IS the Codex (13-THE-LIFT.md §1: an entity's page is its wiki article),
 * so this address redirects to /codex and nothing is left behind.
 */
const WikiRedirect = () => {
  const { worldId } = useParams<{ worldId: string }>();
  if (!worldId) return <Navigate to="/worlds" replace />;
  return <Navigate to={`/worlds/${worldId}/codex`} replace />;
};

export default WikiRedirect;
