import { useMutation } from "@tanstack/react-query";

// --- Visuals AI mutation ---
export interface GenerateScriptVisualsAIRequest {
  segments: string[];
}
export interface GenerateScriptVisualsAIResponse {
  job_id: string;
}
export function useGenerateScriptVisualsAIMutation() {
  return useMutation({
    mutationFn: async ({ segments }: GenerateScriptVisualsAIRequest) => {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL;
      const resp = await fetch(`${aiApiUrl}/run-generate-script-visuals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments }),
      });
      if (!resp.ok) throw new Error("Failed to start visual generation.");
      const data = await resp.json();
      return data as GenerateScriptVisualsAIResponse;
    },
  });
}

// --- Segment AI mutation ---
export interface GenerateScriptSegmentsAIRequest {
  script: string;
  numSegments: number;
}
export interface GenerateScriptSegmentsAIResponse {
  job_id: string;
}
export function useGenerateScriptSegmentsAIMutation() {
  return useMutation({
    mutationFn: async ({ script, numSegments }: GenerateScriptSegmentsAIRequest) => {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL;
      const resp = await fetch(`${aiApiUrl}/run-generate-script-segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, num_segments: numSegments }),
      });
      if (!resp.ok) throw new Error("Failed to start segment generation.");
      const data = await resp.json();
      return data as GenerateScriptSegmentsAIResponse;
    },
  });
}

// --- Script AI mutation ---
export interface GenerateScriptAIRequest {
  project_brief: string;
  branding: string;
  duration: string;
}
export interface GenerateScriptAIResponse {
  job_id: string;
}
export function useGenerateScriptAIMutation() {
  return useMutation({
    mutationFn: async ({ project_brief, branding, duration }: GenerateScriptAIRequest) => {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL;
      const resp = await fetch(`${aiApiUrl}/run-generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_brief, branding, duration }),
      });
      if (!resp.ok) throw new Error("Failed to start script generation.");
      const data = await resp.json();
      return data as GenerateScriptAIResponse;
    },
  });
}
