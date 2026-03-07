import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, profile, loading } = useAuth();

  // Wait for both auth AND profile to finish loading
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
