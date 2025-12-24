import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@api/users/queries";
import { ROUTES } from "@routes/routes.config";

// Basic protected route: redirects to /login if not authenticated
export const ProtectedRoute = () => {
  // This hook should return user data if authenticated, or undefined/null if not
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
