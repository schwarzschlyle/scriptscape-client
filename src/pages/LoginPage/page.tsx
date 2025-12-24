import React, { useState } from "react";
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
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 12 }}>
          {loading ? "Processing..." : "Login"}
        </button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16 }}>
        Don't have an account? <a href={ROUTES.REGISTER || "/register"}>Register</a>
      </div>
    </div>
  );
}
