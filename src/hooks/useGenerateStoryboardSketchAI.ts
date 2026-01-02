import { useState, useCallback, useRef } from "react";
import api from "../api/client";

type UseGenerateStoryboardSketchAIResult = {
  generate: (visualDirection: string, instructions?: string) => Promise<string>;
  loading: boolean;
  error: string | null;
};

export function useGenerateStoryboardSketchAI(): UseGenerateStoryboardSketchAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const generate = useCallback(
    async (visualDirection: string, instructions?: string): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        // Start the AI job
        const { job_id } = (
          await api.post<{ job_id: string }>("/run-generate-storyboard-sketch", {
            visual_direction: visualDirection,
            instructions: instructions || "",
          })
        ).data;

        const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
        let wsUrl: string;
        if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
          wsUrl = `${wsBase}/ws/generate-storyboard-sketch-result/${job_id}`;
        } else {
          const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
          wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-storyboard-sketch-result/${job_id}`;
        }

        return await new Promise<string>((resolve, reject) => {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            // WebSocket opened
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.status === "done" && typeof data.image_base64 === "string") {
                ws.close();
                resolve(data.image_base64);
              } else if (data.status === "error") {
                ws.close();
                reject(new Error(data.error || "AI storyboard sketch generation failed"));
              }
            } catch (err) {
              ws.close();
              reject(new Error("Malformed WebSocket message"));
            }
          };

          ws.onerror = () => {
            ws.close();
            reject(new Error("WebSocket error"));
          };

          ws.onclose = () => {};

          // Timeout after 2 minutes
          setTimeout(() => {
            if (ws.readyState !== ws.CLOSED) {
              ws.close();
              reject(new Error("AI storyboard sketch generation timed out"));
            }
          }, 120000);
        });
      } catch (err: any) {
        setError(err?.message || "Failed to generate storyboard sketch from AI.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generate, loading, error };
}
