import { useState, useCallback, useRef } from "react";
import { useGenerateScriptSketchAIMutation } from "../api/ai-visuals/mutations";

type UseGenerateScriptSketchesAIResult = {
  generate: (visual_direction: string, instructions?: string) => Promise<string>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptSketchesAI(): UseGenerateScriptSketchesAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const mutation = useGenerateScriptSketchAIMutation();

  const generate = useCallback(
    async (visual_direction: string, instructions: string = ""): Promise<string> => {
      setLoading(true);
      setError(null);

      // Log what is being sent to the AI for storyboard sketch generation
      console.log("[AI STORYBOARD SKETCH GENERATION] visual_direction:", visual_direction, "instructions:", instructions);

      try {
        // Start the AI job
        const { job_id } = await mutation.mutateAsync({ visual_direction, instructions });
        const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
        let wsUrl: string;
        if (wsBase.startsWith("ws://") || wsBase.startsWith("wss://")) {
          wsUrl = `${wsBase}/ws/generate-storyboard-sketch-result/${job_id}`;
        } else {
          // Relative path, use current host and protocol
          const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
          wsUrl = `${wsProtocol}://${window.location.host}${wsBase}/ws/generate-storyboard-sketch-result/${job_id}`;
        }

        return await new Promise<string>((resolve, reject) => {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log("AI Storyboard Sketch WebSocket opened:", wsUrl);
          };

          ws.onmessage = (event) => {
            try {
              // Debug: log raw websocket message and event
              console.log("AI Storyboard Sketch WebSocket onmessage event:", event);
              console.log("AI Storyboard Sketch WebSocket message:", event.data);
              const data = JSON.parse(event.data);
              if (data.status === "done" && typeof data.image_base64 === "string") {
                console.log("AI Storyboard Sketch WebSocket: received DONE, closing and resolving", ws.readyState);
                ws.close();
                resolve(data.image_base64);
              } else if (data.status === "error") {
                console.log("AI Storyboard Sketch WebSocket: received ERROR, closing and rejecting", ws.readyState);
                ws.close();
                reject(new Error(data.error || "AI storyboard sketch generation failed"));
              } else {
                console.log("AI Storyboard Sketch WebSocket: received unknown message", data, ws.readyState);
              }
            } catch (err) {
              console.error("AI Storyboard Sketch WebSocket: malformed message", event.data, err, ws.readyState);
              ws.close();
              reject(new Error("Malformed WebSocket message"));
            }
          };

          ws.onerror = (event) => {
            console.error("AI Storyboard Sketch WebSocket error:", event);
            ws.close();
            reject(new Error("WebSocket error"));
          };

          ws.onclose = (event) => {
            console.log("AI Storyboard Sketch WebSocket closed:", event);
          };

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
    [mutation]
  );

  return { generate, loading, error };
}
