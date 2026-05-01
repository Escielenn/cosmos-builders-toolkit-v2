import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const PRIVATE_MODE = false; // OPEN EARLY ACCESS — site is publicly browsable; per-page guards still protect authenticated routes (Worlds, Tools, Profile, etc.)

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  // Auth and join pages are always accessible
  if (!PRIVATE_MODE || pathname === "/auth" || pathname.startsWith("/join/")) {
    return <>{children}</>;
  }

  // Show nothing while auth initializes (prevents flash)
  if (loading) {
    return null;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
