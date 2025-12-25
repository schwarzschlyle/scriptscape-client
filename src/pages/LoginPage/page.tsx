import React, { useState } from "react";
import CustomButton from "@components/CustomButton";
import CustomForm from "@components/CustomForm";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLogin } from "@api";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginResp = await login.mutateAsync({ email, password });
      if (!loginResp.accessToken) throw new Error("Login failed");
      localStorage.setItem("accessToken", loginResp.accessToken);
      localStorage.setItem("refreshToken", loginResp.refreshToken);

      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>

      <Typography variant="h5" component="h2" align="center" sx={{ mb: 2 }}>
        Login
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
