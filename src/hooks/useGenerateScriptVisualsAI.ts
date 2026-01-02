import { useState, useCallback, useRef } from "react";
import { useGenerateScriptVisualsAIMutation } from "../api/ai-visuals/mutations";

type UseGenerateScriptVisualsAIResult = {
  generate: (segments: string[]) => Promise<string[]>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptVisualsAI(): UseGenerateScriptVisualsAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const mutation = useGenerateScriptVisualsAIMutation();

  const generate = useCallback(async (segments: string[]): Promise<string[]> => {
    setLoading(true);
    setError(null);

    // Log what is being sent to the AI for visual generation
    console.log("[AI VISUAL GENERATION] segments:", segments);

    try {
      // Start the AI job
      const { job_id } = await mutation.mutateAsync({ segments });
      const aiApiUrl = import.meta.env.VITE_AI_API_URL;
      const wsProtocol = aiApiUrl.startsWith("https") ? "wss" : "ws";
      const wsBase = aiApiUrl.replace(/^http(s?):\/\//, "");
      const wsUrl = `${wsProtocol}://${wsBase}/ws/generate-script-visuals-result/${job_id}`;

      // Log the websocket URL before opening
      console.log("[AI VISUAL GENERATION] Opening WebSocket:", wsUrl);

      return await new Promise<string[]>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("AI Visuals WebSocket opened:", wsUrl);
        };

        ws.onmessage = (event) => {
          try {
            // Debug: log raw websocket message
            console.log("AI Visuals WebSocket message:", event.data);
            const data = JSON.parse(event.data);
            if (data.status === "done" && Array.isArray(data.result)) {
              ws.close();
              resolve(data.result);
            } else if (data.status === "error") {
              ws.close();
              reject(new Error(data.error || "AI visual generation failed"));
            }
          } catch (err) {
            ws.close();
            reject(new Error("Malformed WebSocket message"));
          }
        };

        ws.onerror = (event) => {
          console.error("AI Visuals WebSocket error:", event);
          ws.close();
          reject(new Error("WebSocket error"));
        };

        ws.onclose = (event) => {
          console.log("AI Visuals WebSocket closed:", event);
        };

        // Timeout after 2 minutes
        setTimeout(() => {
          if (ws.readyState !== ws.CLOSED) {
            ws.close();
            reject(new Error("AI visual generation timed out"));
          }
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
