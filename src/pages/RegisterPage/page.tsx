import React, { useState } from "react";
import CustomButton from "@components/CustomButton";
import CustomForm from "@components/CustomForm";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
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

      <Typography variant="h5" component="h2" align="center" sx={{ mb: 2 }}>
        Register
      </Typography>

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
          label="Project Name"
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
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

      <Typography sx={{ mt: 2 }} align="center" variant="body2">
        Already have an account? <a href={ROUTES.LOGIN}>Login</a>
      </Typography>
      
    </div>
  );
}
