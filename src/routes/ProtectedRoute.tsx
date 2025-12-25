import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@api/users/queries";
import { ROUTES } from "@routes/routes.config";

export const ProtectedRoute = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
