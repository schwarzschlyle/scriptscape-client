import { useState } from "react";
import {
  useCreateOrganization,
  useRegister,
  useLogin,
  useRefreshToken,
  useCreateProject,
  useCreateScript,
  useCreateSegmentCollection,
  useCreateSegment,
  useCreateVisualSet,
  useCreateVisual,
} from "./api";

function randomString() {
  return Math.random().toString(36).substring(2, 10);
}

export default function E2EWorkflowTest() {
  const [log, setLog] = useState<string[]>([]);
  const [results, setResults] = useState<any>({});
  const [running, setRunning] = useState(false);

  // Dynamic IDs for workflow
  const [orgId, setOrgId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [scriptId, setScriptId] = useState<string>("");
  const [segColId, setSegColId] = useState<string>("");
  const [visualSetId, setVisualSetId] = useState<string>("");

  // All hooks must be called at the top level
  const createOrg = useCreateOrganization();
  const register = useRegister();
  const login = useLogin();
  const refreshToken = useRefreshToken();
  const createProject = useCreateProject(orgId);
  const createScript = useCreateScript();
  const createSegCol = useCreateSegmentCollection();
  const createSegment = useCreateSegment();
  const createVisualSet = useCreateVisualSet();
  const createVisual = useCreateVisual();

  const appendLog = (msg: string) => setLog((l) => [...l, msg]);

  const runWorkflow = async () => {
    setRunning(true);
    setLog([]);
    setResults({});
    setOrgId("");
    setProjectId("");
    setScriptId("");
    setSegColId("");
    setVisualSetId("");
    try {
      // Use local variables for IDs
      let localOrgId = "";
      let localProjectId = "";
      let localScriptId = "";
      let localSegColId = "";
      let localVisualSetId = "";

      // 1. Create Organization
      const orgName = "Test Organization " + randomString();
      appendLog("Creating organization...");
      const orgResp = await createOrg.mutateAsync({ name: orgName });
      if (!orgResp.id) throw new Error("Organization creation failed");
      localOrgId = orgResp.id;
      setOrgId(localOrgId);
      setResults((r: any) => ({ ...r, org: orgResp }));
      appendLog("✔ Organization created: " + orgResp.name);

      // 2. Register User
      const userEmail = `user_${randomString()}@example.com`;
      const userPassword = "TestPass123!";
      appendLog("Registering user...");
      const regResp = await register.mutateAsync({
        email: userEmail,
        password: userPassword,
        firstName: "Test",
        lastName: "User",
        organization_name: orgResp.name,
      });
      if (!regResp.user?.id) throw new Error("User registration failed");
      setResults((r: any) => ({ ...r, user: regResp.user }));
      localStorage.setItem("accessToken", regResp.accessToken);
      localStorage.setItem("refreshToken", regResp.refreshToken);
      appendLog("✔ User registered: " + userEmail);

      // 3. Login User
      appendLog("Logging in user...");
      const loginResp = await login.mutateAsync({
        email: userEmail,
        password: userPassword,
      });
      if (!loginResp.accessToken) throw new Error("Login failed");
      localStorage.setItem("accessToken", loginResp.accessToken);
      localStorage.setItem("refreshToken", loginResp.refreshToken);
      appendLog("✔ Login successful");

      // Wait for localStorage to update before next mutation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 4. Refresh Token
      appendLog("Refreshing token...");
      const refreshResp = await refreshToken.mutateAsync({
        refreshToken: loginResp.refreshToken,
      });
      if (!refreshResp.accessToken) throw new Error("Token refresh failed");
      localStorage.setItem("accessToken", refreshResp.accessToken);
      appendLog("✔ Token refreshed");

      // Wait for localStorage to update before next mutation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 5. Create Project
      appendLog("Creating project...");
      const projectResp = await createProject.mutateAsync({
        name: "Test Project",
        description: "E2E Project",
      });
      if (!projectResp.id) throw new Error("Project creation failed");
      localProjectId = projectResp.id;
      setProjectId(localProjectId);
      setResults((r: any) => ({ ...r, project: projectResp }));
      appendLog("✔ Project created: " + projectResp.name);

      // 6. Create Script
      appendLog("Creating script...");
      if (!localOrgId || !localProjectId) throw new Error("Missing orgId or projectId for script creation");
      const scriptResp = await createScript.mutateAsync({
        organizationId: localOrgId,
        projectId: localProjectId,
        name: "Test Script",
        text: "INT. COFFEE SHOP - DAY\nSARAH enters, looking tired...",
      });
      if (!scriptResp.id) throw new Error("Script creation failed");
      localScriptId = scriptResp.id;
      setScriptId(localScriptId);
      setResults((r: any) => ({ ...r, script: scriptResp }));
      appendLog("✔ Script created: " + scriptResp.name);

      // 7. Create Segment Collection
      appendLog("Creating segment collection...");
      localScriptId = scriptResp.id;
      setScriptId(localScriptId);

      const segColResp = await createSegCol.mutateAsync({
        scriptId: localScriptId,
        name: "Manual Scene Breakdown",
      });
      if (!segColResp.id) throw new Error("Segment collection creation failed");
      localSegColId = segColResp.id;
      setSegColId(localSegColId);
      setResults((r: any) => ({ ...r, segmentCollection: segColResp }));
      appendLog("✔ Segment collection created: " + segColResp.name);

      // 8. Create Segment
      appendLog("Creating segment...");
      if (!localSegColId) throw new Error("Missing segColId for segment creation");
      const segmentResp = await createSegment.mutateAsync({
        collectionId: localSegColId,
        segmentIndex: 0,
        text: "INT. COFFEE SHOP - DAY\nSARAH enters, looking tired...",
      });
      if (!segmentResp.id) throw new Error("Segment creation failed");
      setResults((r: any) => ({ ...r, segment: segmentResp }));
      appendLog("✔ Segment created");

      // 9. Create Visual Set
      appendLog("Creating visual set...");
      const visualSetResp = await createVisualSet.mutateAsync({
        collectionId: localSegColId,
        name: "Production Guide v1",
        description: "E2E Visual Set",
      });
      if (!visualSetResp.id) throw new Error("Visual set creation failed");
      localVisualSetId = visualSetResp.id;
      setVisualSetId(localVisualSetId);
      setResults((r: any) => ({ ...r, visualSet: visualSetResp }));
      appendLog("✔ Visual set created: " + visualSetResp.name);

      // 10. Create Visual
      appendLog("Creating visual...");
      if (!localVisualSetId) throw new Error("Missing visualSetId for visual creation");
      const visualResp = await createVisual.mutateAsync({
        visualSetId: localVisualSetId,
        segmentId: segmentResp.id,
        content:
          "SEGMENT 1: Coffee Shop Entrance\n\nSCENE DESCRIPTION:\nSarah enters the coffee shop, looking tired from her commute.\nKEYFRAMES:\n- Wide shot of the coffee shop\n- Close-up of Sarah's face\nCAMERA:\n- Establishing shot, then follow Sarah\nASSETS NEEDED:\n- Coffee shop, Sarah, extras\nLIGHTING/MOOD:\n- Warm, inviting\nEDITING NOTES:\n- Slow pace, ambient sound",
      });
      if (!visualResp.id) throw new Error("Visual creation failed");
      setResults((r: any) => ({ ...r, visual: visualResp }));
      appendLog("✔ Visual created");

      appendLog("🎉 E2E WORKFLOW SUCCESSFUL");

      // Run all queries for created resources
      appendLog("Fetching and displaying all created resources...");
      const queries: Record<string, any> = {};

      // Organization
      if (orgId) {
        try {
          const orgRes = await fetch(`/api/organizations/${orgId}`).then(r => r.json());
          queries.organization = orgRes;
        } catch {}
      }
      // Project
      if (orgId && projectId) {
        try {
          const projRes = await fetch(`/api/projects/${projectId}`).then(r => r.json());
          queries.project = projRes;
        } catch {}
      }
      // Script
      if (scriptId) {
        try {
          // Wait briefly to ensure DB commit
          await new Promise((resolve) => setTimeout(resolve, 100));
          const scriptRes = await fetch(`/api/scripts/${scriptId}`).then(r => r.json());
          queries.script = scriptRes;
        } catch {}
      }
      // Segment Collection
      if (segColId) {
        try {
          const segColRes = await fetch(`/api/segment-collections/${segColId}`).then(r => r.json());
          queries.segmentCollection = segColRes;
        } catch {}
      }
      // Segment
      if (results.segment?.id) {
        try {
          const segRes = await fetch(`/api/segments/${results.segment.id}`).then(r => r.json());
          queries.segment = segRes;
        } catch {}
      }
      // Visual Set
      if (visualSetId) {
        try {
          const visSetRes = await fetch(`/api/visual-sets/${visualSetId}`).then(r => r.json());
          queries.visualSet = visSetRes;
        } catch {}
      }
      // Visual
      if (results.visual?.id) {
        try {
          const visRes = await fetch(`/api/visuals/${results.visual.id}`).then(r => r.json());
          queries.visual = visRes;
        } catch {}
      }
      setResults((r: any) => ({ ...r, queries }));

    } catch (err: any) {
      appendLog("❌ " + (err.message || err));
    }
    setRunning(false);
  };

  return (
      <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "monospace" }}>
        <h2>ScriptScape E2E API Workflow Test (Hooks)</h2>
        <button onClick={runWorkflow} disabled={running}>
          {running ? "Running..." : "Run E2E Workflow"}
        </button>
        <pre style={{ background: "#222", color: "#fff", padding: 16, minHeight: 200 }}>
          {log.join("\n")}
        </pre>
        <details>
          <summary>Show Results</summary>
          <pre style={{ background: "#eee", color: "#222", padding: 16 }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </details>
        <details>
          <summary>Show Query Results (TanStack Query hooks)</summary>
          <QueryResults
            orgId={orgId}
            projectId={projectId}
            scriptId={scriptId}
            segColId={segColId}
            segmentId={results.segment?.id}
            visualSetId={visualSetId}
            visualId={results.visual?.id}
          />
        </details>
      </div>
  );
}

import {
  useOrganization,
  useProjectByOrg,
  useScript,
  useSegmentCollection,
  useSegment,
  useVisualSet,
  useVisual,
} from "./api";

function QueryResults({
  orgId,
  projectId,
  scriptId,
  segColId,
  segmentId,
  visualSetId,
  visualId,
}: {
  orgId?: string;
  projectId?: string;
  scriptId?: string;
  segColId?: string;
  segmentId?: string;
  visualSetId?: string;
  visualId?: string;
}) {
  const orgQ = useOrganization(orgId || "");
  const projQ = useProjectByOrg(orgId || "", projectId || "");
  const scriptQ = useScript(orgId || "", projectId || "", scriptId || "");
  const segColQ = useSegmentCollection(segColId || "");
  const segmentQ = useSegment(segmentId || "");
  const visualSetQ = useVisualSet(visualSetId || "");
  const visualQ = useVisual(visualId || "");

  return (
    <div>
      <h4>Organization Query</h4>
      {orgId ? <pre>{JSON.stringify(orgQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Project Query</h4>
      {projectId ? <pre>{JSON.stringify(projQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Script Query</h4>
      {orgId && projectId && scriptId ? <pre>{JSON.stringify(scriptQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Segment Collection Query</h4>
      {segColId ? <pre>{JSON.stringify(segColQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Segment Query</h4>
      {segmentId ? <pre>{JSON.stringify(segmentQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Visual Set Query</h4>
      {visualSetId ? <pre>{JSON.stringify(visualSetQ.data, null, 2)}</pre> : <em>Not queried</em>}
      <h4>Visual Query</h4>
      {visualId ? <pre>{JSON.stringify(visualQ.data, null, 2)}</pre> : <em>Not queried</em>}
    </div>
  );
}
