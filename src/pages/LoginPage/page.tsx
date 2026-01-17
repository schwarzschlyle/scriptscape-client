import React, { useState } from "react";
import { AuthPrimaryButton } from "@pages/Auth/components/AuthButtons";
import CustomForm from "@components/CustomForm";
import LoadingSpinner from "@components/LoadingSpinner";
import { useLogin } from "@api";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { ROUTES, buildRoute } from "@routes/routes.config";
import { useAuth } from "@auth/AuthContext";
import { AuthShell } from "@pages/Auth/components/AuthShell";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import DarkPage from "@theme/DarkPage";
import { AuthCardTextInput } from "@pages/Auth/components/AuthCardInputs";

export default function LoginPage() {
  React.useEffect(() => {
    document.title = "ScriptScape | Login";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();

  // If already authenticated, avoid showing login.
  React.useEffect(() => {
    if (auth.status === "authenticated" && auth.user?.organizationId) {
      navigate(buildRoute.projects(auth.user.organizationId), { replace: true });
    }
  }, [auth.status, auth.user?.organizationId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginResp = await login.mutateAsync({ email, password });
      if (!loginResp.accessToken) throw new Error("Login failed");

      // Sets in-memory access token; refresh token is HttpOnly cookie.
      await auth.login({ accessToken: loginResp.accessToken });

      const returnTo = searchParams.get("returnTo");
      if (returnTo && returnTo.startsWith("/")) {
        navigate(returnTo, { replace: true });
      } else {
        if (!auth.user?.organizationId) throw new Error("No organization found for user");
        navigate(buildRoute.projects(auth.user.organizationId), { replace: true });
      }
    } catch (err: any) {
      if (err?.response?.data) {
        setError(
          (err.response.data.detail as string) ||
            JSON.stringify(err.response.data) ||
            err.message ||
            "An error occurred"
        );
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DarkPage>
      <AuthShell
        title="Login to ScriptScape"
        subtitle={undefined}
        hideHeader
        showHeaderStatusDot
        footer={
          <Box sx={{ textAlign: 'center' }}>
            New to ScriptScape?{" "}
            <Link component={RouterLink} to={ROUTES.REGISTER || "/register"} underline="hover">
              Start storyboarding
            </Link>
          </Box>
        }
      >
        {auth.status === "loading" ? (
          <LoadingSpinner label="Restoring session..." />
        ) : (
          <CustomForm onSubmit={handleSubmit} sx={{ gap: 2 }}>
            <Stack spacing={1.5}>
              {error ? <Alert severity="error">{error}</Alert> : null}

              <AuthCardTextInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />

              <AuthCardTextInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                required
              />
            </Stack>

            <AuthPrimaryButton type="submit" disabled={loading} sx={{ mt: 4 }}>
              {loading ? "Signing in…" : "Sign in"}
            </AuthPrimaryButton>
          </CustomForm>
        )}
      </AuthShell>
    </DarkPage>
  );
}