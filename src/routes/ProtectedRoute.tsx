import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import LoadingSpinner from "@components/LoadingSpinner";
import { useAuth } from "@auth/AuthContext";

export const ProtectedRoute = () => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingSpinner />;
  if (status !== "authenticated" || !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?returnTo=${returnTo}`} replace />;
  }

  return <Outlet />;
};
