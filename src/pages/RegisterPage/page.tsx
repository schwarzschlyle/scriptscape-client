import React, { useState } from "react";
import CustomButton from "@components/CustomButton";
import CustomForm from "@components/CustomForm";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "@components/LoadingSpinner";
import { useRegister, useCreateOrganization } from "@api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import { buildRoute } from "@routes/routes.config";
import { useAuth } from "@auth/AuthContext";
import { AuthShell } from "@pages/Auth/components/AuthShell";

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
    <AuthShell title="Register" subtitle="Create your account">
      {auth.status === "loading" ? (
        <LoadingSpinner label="Restoring session..." />
      ) : (
        <CustomForm onSubmit={handleSubmit}>

        <TextField
          label="First Name"
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
        />

        <TextField
          label="Organization Name"
          type="text"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          required
        />

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        
        <CustomButton
          type="submit"
          disabled={loading}
        >
          {loading ? "Processing..." : "Register"}
        </CustomButton>

        {error && (
          <Typography color="error" sx={{ mt: 1, fontWeight: 600 }}>
            {error}
          </Typography>
        )}

      </CustomForm>
      )}

      <Typography sx={{ mt: 2 }} align="center" variant="body2">
        Already have an account? <a href={ROUTES.LOGIN}>Login</a>
      </Typography>
    </AuthShell>
  );
}
