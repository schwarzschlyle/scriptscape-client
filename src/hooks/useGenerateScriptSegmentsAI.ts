import { useState, useCallback, useRef } from "react";
import { useGenerateScriptSegmentsAIMutation } from "../api/ai-visuals/mutations";
import { ReconnectingWebSocket } from "../utils/websocket";
import { addAiJob, removeAiJob } from "../utils/aiJobPersistence";

type UseGenerateScriptSegmentsAIResult = {
  generate: (script: string, numSegments: number) => Promise<string[]>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptSegmentsAI(): UseGenerateScriptSegmentsAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  const mutation = useGenerateScriptSegmentsAIMutation();

  const generate = useCallback(async (script: string, numSegments: number): Promise<string[]> => {
    setLoading(true);
    setError(null);

    // Log what is being sent to the AI for segment generation
    console.log("[AI SEGMENT GENERATION] script:", script, "numSegments:", numSegments);

    try {
      // Start the AI job
      const { job_id } = await mutation.mutateAsync({ script, numSegments });
      addAiJob({ type: "segments", jobId: job_id, createdAt: Date.now() });
      const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
      let wsUrl: string;
      if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
        wsUrl = `${wsBase}/ws/generate-script-segments-result/${job_id}`;
      } else {
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-script-segments-result/${job_id}`;
      }

      return await new Promise<string[]>((resolve, reject) => {
        const ws = new ReconnectingWebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data));
            if (data.status === "pending") return;
            if (data.status === "done" && Array.isArray(data.result)) {
              removeAiJob("segments", job_id);
              ws.disableReconnect();
              ws.close();
              resolve(data.result);
            } else if (data.status === "error") {
              removeAiJob("segments", job_id);
              ws.disableReconnect();
              ws.close();
              reject(new Error(data.error || "AI segment generation failed"));
            }
          } catch {
            removeAiJob("segments", job_id);
            ws.disableReconnect();
            ws.close();
            reject(new Error("Malformed WebSocket message"));
          }
        };

        ws.onerror = () => {
          // reconnecting websocket will retry; reject only on timeout
        };

        setTimeout(() => {
          removeAiJob("segments", job_id);
          ws.disableReconnect();
          ws.close();
          reject(new Error("AI segment generation timed out"));
        }, 120000);
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate segments from AI.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutation]);

  return { generate, loading, error };
}
