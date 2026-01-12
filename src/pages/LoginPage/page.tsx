import React, { useState } from "react";
import CustomButton from "@components/CustomButton";
import CustomForm from "@components/CustomForm";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLogin } from "@api";
import queryClient from "@api/queryClient";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import { useCurrentUser } from "@api/users/queries";

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
  const { data: user } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginResp = await login.mutateAsync({ email, password });
      if (!loginResp.accessToken) throw new Error("Login failed");
      localStorage.setItem("accessToken", loginResp.accessToken);
      localStorage.setItem("refreshToken", loginResp.refreshToken);

      // Invalidate and refetch currentUser query using global queryClient
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Wait for user.organizationId to be available
      let orgId = "";
      for (let i = 0; i < 10; i++) {
        if (user && (user.organizationId)) {
          orgId = user.organizationId;
          break;
        }
        await new Promise(res => setTimeout(res, 100));
      }

      if (!orgId) throw new Error("No organization found for user");
      navigate(`/canvas/${orgId}/`, { replace: true });
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
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>

      <Typography variant="h5" component="h2" align="center" sx={{ mb: 2 }}>
        LLogin
      </Typography>

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

      <Typography sx={{ mt: 2 }} align="center" variant="body2">
        Don't have an account?{" "}
        <a href={ROUTES.REGISTER || "/register"}>Register</a>
      </Typography>

    </div>
  );
}
