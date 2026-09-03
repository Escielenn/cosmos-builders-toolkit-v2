import { Navigate, useParams } from "react-router-dom";

/**
 * /worlds/:worldId/pages/:entryId — the pre-F1 address of an entity page.
 * Redirects to the canonical /codex/:entityId. Kept so every link the app
 * ever produced (and every bookmark) still lands.
 */
const WikiPageRoute = () => {
  const { worldId, entryId } = useParams<{ worldId: string; entryId: string }>();
  if (!worldId || !entryId) return <Navigate to="/worlds" replace />;
  return <Navigate to={`/worlds/${worldId}/codex/${entryId}`} replace />;
};

export default WikiPageRoute;
