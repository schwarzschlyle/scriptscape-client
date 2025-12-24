import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@routes/ProtectedRoute";
import { ROUTES } from "@routes/routes.config";
import LoginPage from "@pages/LoginPage/page";
import RegisterPage from "@pages/RegisterPage/page";
import CanvasPage from "@pages/CanvasPage/page";
import TestE2EPage from "@pages/TestE2EPage/page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={ROUTES.LOGIN} replace />
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />
  },
  {
    path: ROUTES.TEST,
    element: <TestE2EPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.CANVAS,
        element: <CanvasPage />
      }
    ]
  }
]);
