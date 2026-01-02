import { useState, useCallback, useRef } from "react";
import { useGenerateScriptSegmentsAIMutation } from "../api/ai-visuals/mutations";

type UseGenerateScriptSegmentsAIResult = {
  generate: (script: string, numSegments: number) => Promise<string[]>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptSegmentsAI(): UseGenerateScriptSegmentsAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const mutation = useGenerateScriptSegmentsAIMutation();

  const generate = useCallback(async (script: string, numSegments: number): Promise<string[]> => {
    setLoading(true);
    setError(null);

    // Log what is being sent to the AI for segment generation
    console.log("[AI SEGMENT GENERATION] script:", script, "numSegments:", numSegments);

    try {
      // Start the AI job
      const { job_id } = await mutation.mutateAsync({ script, numSegments });
      const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
      let wsUrl: string;
      if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
        wsUrl = `${wsBase}/ws/generate-script-segments-result/${job_id}`;
      } else {
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-script-segments-result/${job_id}`;
      }

      return await new Promise<string[]>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("AI WebSocket opened:", wsUrl);
        };

        ws.onmessage = (event) => {
          try {
            // Debug: log raw websocket message
            console.log("AI WebSocket message:", event.data);
            const data = JSON.parse(event.data);
            if (data.status === "done" && Array.isArray(data.result)) {
              ws.close();
              resolve(data.result);
            } else if (data.status === "error") {
              ws.close();
              reject(new Error(data.error || "AI segment generation failed"));
            }
          } catch (err) {
            ws.close();
            reject(new Error("Malformed WebSocket message"));
          }
        };

        ws.onerror = (event) => {
          console.error("AI WebSocket error:", event);
          ws.close();
          reject(new Error("WebSocket error"));
        };

        ws.onclose = (event) => {
          console.log("AI WebSocket closed:", event);
        };

        // Timeout after 2 minutes
        setTimeout(() => {
          if (ws.readyState !== ws.CLOSED) {
            ws.close();
            reject(new Error("AI segment generation timed out"));
          }
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
