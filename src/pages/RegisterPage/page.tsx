import React, { useState } from "react";
import { AuthPrimaryButton } from "@pages/Auth/components/AuthButtons";
import CustomForm from "@components/CustomForm";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "@components/LoadingSpinner";
import { useRegister, useCreateOrganization } from "@api";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import { buildRoute } from "@routes/routes.config";
import { useAuth } from "@auth/AuthContext";
import { AuthShell } from "@pages/Auth/components/AuthShell";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import DarkPage from "@theme/DarkPage";
import { AuthCardTextInput } from "@pages/Auth/components/AuthCardInputs";

export default function RegisterPage() {
  React.useEffect(() => {
    document.title = "ScriptScape | Register";
  }, []);
  const [firstName, setFirstName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrg = useCreateOrganization();
  const register = useRegister();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();

  // If already authenticated, avoid showing register.
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
      const orgResp = await createOrg.mutateAsync({ name: orgName });
      if (!orgResp.id) throw new Error("Organization creation failed");
      setOrgId(orgResp.id);

      const regResp = await register.mutateAsync({
        email,
        password,
        firstName,
        lastName: "User",
        organization_name: orgResp.name,
      });
      if (!regResp.user?.id) throw new Error("User registration failed");

      await auth.login({ accessToken: regResp.accessToken });

      const returnTo = searchParams.get("returnTo");
      if (returnTo && returnTo.startsWith("/")) {
        navigate(returnTo, { replace: true });
      } else {
        navigate(buildRoute.projects(orgResp.id), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DarkPage>
      <AuthShell
        title="Start Storyboarding"
        subtitle="Turn your script into a living visual map. Branch ideas, test directions, and find the best concept fast"
        footer={
          <>
            Already storyboarding?{" "}
            <Link component={RouterLink} to={ROUTES.LOGIN} underline="hover">
              Log in
            </Link>
          </>
        }
      >
      {auth.status === "loading" ? (
        <LoadingSpinner label="Restoring session..." />
      ) : (
        <CustomForm onSubmit={handleSubmit} sx={{ gap: 2, mt: 2 }}>
          <Stack spacing={1.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <AuthCardTextInput
              label="First name"
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              required
            />

            <AuthCardTextInput
              label="Organization"
              value={orgName}
              onChange={setOrgName}
              autoComplete="organization"
              required
            />

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
              autoComplete="new-password"
              required
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Use at least 8 characters.
            </Typography>
          </Stack>

          <AuthPrimaryButton type="submit" disabled={loading} sx={{ mt: 4 }}>
            {loading ? "Creating account…" : "Create account"}
          </AuthPrimaryButton>
        </CustomForm>
      )}
      </AuthShell>
    </DarkPage>
  );
}
