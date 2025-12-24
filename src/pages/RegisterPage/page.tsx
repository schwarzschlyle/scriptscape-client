import React, { useState } from "react";
import { useRegister, useLogin, useCreateOrganization, useCreateProject } from "@api";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrg = useCreateOrganization();
  const register = useRegister();
  const login = useLogin();
  const createProject = useCreateProject(orgId);
  const navigate = useNavigate();

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
      localStorage.setItem("accessToken", regResp.accessToken);
      localStorage.setItem("refreshToken", regResp.refreshToken);

      const loginResp = await login.mutateAsync({ email, password });
      if (!loginResp.accessToken) throw new Error("Login failed");
      localStorage.setItem("accessToken", loginResp.accessToken);
      localStorage.setItem("refreshToken", loginResp.refreshToken);

      const projectResp = await createProject.mutateAsync({
        name: projectName,
        description: "User project",
      });
      if (!projectResp.id) throw new Error("Project creation failed");

      navigate(
        ROUTES.CANVAS
          .replace(":organizationId", orgResp.id)
          .replace(":projectId", projectResp.id)
      );
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
        <div>
          <label>Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
        <div>
          <label>Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
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
          {loading ? "Processing..." : "Register"}
        </button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16 }}>
        Already have an account? <a href={ROUTES.LOGIN}>Login</a>
      </div>
    </div>
  );
}
