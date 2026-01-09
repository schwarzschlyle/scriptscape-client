import { useState, useCallback, useRef } from "react";
import { useGenerateScriptVisualsAIMutation } from "../api/ai-visuals/mutations";
import { ReconnectingWebSocket } from "../utils/websocket";
import { addAiJob, removeAiJob } from "../utils/aiJobPersistence";

type UseGenerateScriptVisualsAIResult = {
  generate: (segments: string[]) => Promise<string[]>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptVisualsAI(): UseGenerateScriptVisualsAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  const mutation = useGenerateScriptVisualsAIMutation();

  const generate = useCallback(async (segments: string[]): Promise<string[]> => {
    setLoading(true);
    setError(null);

    // Log what is being sent to the AI for visual generation
    console.log("[AI VISUAL GENERATION] segments:", segments);

    try {
      // Start the AI job
      const { job_id } = await mutation.mutateAsync({ segments });
      addAiJob({ type: "visuals", jobId: job_id, createdAt: Date.now() });
      const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
      let wsUrl: string;
      if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
        wsUrl = `${wsBase}/ws/generate-script-visuals-result/${job_id}`;
      } else {
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-script-visuals-result/${job_id}`;
      }

      // Log the websocket URL before opening
      console.log("[AI VISUAL GENERATION] Opening WebSocket:", wsUrl);

      return await new Promise<string[]>((resolve, reject) => {
        const ws = new ReconnectingWebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data));
            if (data.status === "pending") return;
            if (data.status === "done" && Array.isArray(data.result)) {
              removeAiJob("visuals", job_id);
              ws.disableReconnect();
              ws.close();
              resolve(data.result);
            } else if (data.status === "error") {
              removeAiJob("visuals", job_id);
              ws.disableReconnect();
              ws.close();
              reject(new Error(data.error || "AI visual generation failed"));
            }
          } catch {
            removeAiJob("visuals", job_id);
            ws.disableReconnect();
            ws.close();
            reject(new Error("Malformed WebSocket message"));
          }
        };

        ws.onerror = () => {
          // reconnecting websocket will retry; reject only on timeout
        };

        setTimeout(() => {
          removeAiJob("visuals", job_id);
          ws.disableReconnect();
          ws.close();
          reject(new Error("AI visual generation timed out"));
        }, 120000);
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate visuals from AI.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutation]);

  return { generate, loading, error };
}
