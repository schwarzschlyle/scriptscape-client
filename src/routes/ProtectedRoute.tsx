import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@api/users/queries";
import { ROUTES } from "@routes/routes.config";
import LoadingSpinner from "@components/LoadingSpinner";

export const ProtectedRoute = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
