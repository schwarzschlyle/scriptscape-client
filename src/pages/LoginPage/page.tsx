import React, { useState } from "react";
import CustomButton from "@components/CustomButton";
import CustomForm from "@components/CustomForm";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "@components/LoadingSpinner";
import { useLogin } from "@api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import { buildRoute } from "@routes/routes.config";
import { useAuth } from "@auth/AuthContext";
import { AuthShell } from "@pages/Auth/components/AuthShell";

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
    <AuthShell title="Login" subtitle="Sign in to continue">
      {auth.status === "loading" ? (
        <LoadingSpinner label="Restoring session..." />
      ) : (
        <CustomForm onSubmit={handleSubmit}>

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          defaultValue="musketeer@scriptscape.com"
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        
        <CustomButton
          type="submit"
          disabled={loading}
        >
          {loading ? "Processing..." : "Login"}
        </CustomButton>

        {error && (
          <Typography color="error" sx={{ mt: 1, fontWeight: 600 }}>
            {error}
          </Typography>
        )}
        
      </CustomForm>
      )}

      <Typography sx={{ mt: 2 }} align="center" variant="body2">
        Don&apos;t have an account?{" "}
        <a href={ROUTES.REGISTER || "/register"}>Register</a>
      </Typography>
    </AuthShell>
  );
}
