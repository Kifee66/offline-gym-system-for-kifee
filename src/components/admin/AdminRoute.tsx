// src/components/admin/AdminRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, isSetup } = useAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If admin is not setup yet → only allow /admin/setup
  if (!isSetup) {
    if (location.pathname !== "/admin/setup") {
      return <Navigate to="/admin/setup" replace />;
    }
    return <>{children}</>;
  }

  // If admin setup exists but user is NOT authenticated → only allow /admin/login
  if (isSetup && !isAuthenticated) {
    if (location.pathname !== "/admin/login") {
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // If setup is complete AND authenticated → allow access
  return <>{children}</>;
};

export default AdminRoute;
