import { useMutation } from "@tanstack/react-query";

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
