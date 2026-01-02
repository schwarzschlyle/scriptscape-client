import { useState, useCallback, useRef } from "react";
import { useGenerateScriptAIMutation } from "../api/ai-visuals/mutations";

type UseGenerateScriptAIResult = {
  generate: (project_brief: string, branding: string, duration: string) => Promise<string>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptAI(): UseGenerateScriptAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const mutation = useGenerateScriptAIMutation();

  const generate = useCallback(async (project_brief: string, branding: string, duration: string): Promise<string> => {
    setLoading(true);
    setError(null);

    // Log what is being sent to the AI for script generation
    console.log("[AI SCRIPT GENERATION] project_brief:", project_brief, "branding:", branding, "duration:", duration);

    try {
      // Start the AI job
      const { job_id } = await mutation.mutateAsync({ project_brief, branding, duration });
      const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
      let wsUrl: string;
      if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
        wsUrl = `${wsBase}/ws/generate-script-result/${job_id}`;
      } else {
        // Relative path, use current host and protocol
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-script-result/${job_id}`;
      }

      return await new Promise<string>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("AI Script WebSocket opened:", wsUrl);
        };

        ws.onmessage = (event) => {
          try {
            // Debug: log raw websocket message and event
            console.log("AI Script WebSocket onmessage event:", event);
            console.log("AI Script WebSocket message:", event.data);
            const data = JSON.parse(event.data);
            if (data.status === "done" && typeof data.result === "string") {
              console.log("AI Script WebSocket: received DONE, closing and resolving", ws.readyState);
              ws.close();
              resolve(data.result);
            } else if (data.status === "error") {
              console.log("AI Script WebSocket: received ERROR, closing and rejecting", ws.readyState);
              ws.close();
              reject(new Error(data.error || "AI script generation failed"));
            } else {
              console.log("AI Script WebSocket: received unknown message", data, ws.readyState);
            }
          } catch (err) {
            console.error("AI Script WebSocket: malformed message", event.data, err, ws.readyState);
            ws.close();
            reject(new Error("Malformed WebSocket message"));
          }
        };

        ws.onerror = (event) => {
          console.error("AI Script WebSocket error:", event);
          ws.close();
          reject(new Error("WebSocket error"));
        };

        ws.onclose = (event) => {
          console.log("AI Script WebSocket closed:", event);
        };

        // Timeout after 2 minutes
        setTimeout(() => {
          if (ws.readyState !== ws.CLOSED) {
            ws.close();
            reject(new Error("AI script generation timed out"));
          }
        }, 120000);
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate script from AI.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutation]);

  return { generate, loading, error };
}
