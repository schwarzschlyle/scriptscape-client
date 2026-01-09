import { useState, useCallback, useEffect, useRef } from "react";
import { useGenerateScriptSketchAIMutation } from "../api/ai-visuals/mutations";
import { ReconnectingWebSocket } from "../utils/websocket";
import { addAiJob, removeAiJob } from "../utils/aiJobPersistence";
import { buildWsUrl } from "../utils/wsUrl";

type UseGenerateScriptSketchesAIResult = {
  generate: (visual_direction: string, instructions?: string) => Promise<string>;
  loading: boolean;
  error: string | null;
};

export function useGenerateScriptSketchesAI(): UseGenerateScriptSketchesAIResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  const mutation = useGenerateScriptSketchAIMutation();

  // Close any existing websocket on unmount
  // (avoids dangling reconnect loops if caller navigates away mid-generation)
  useEffect(() => {
    return () => {
      try {
        wsRef.current?.disableReconnect();
        wsRef.current?.close();
      } catch {
        // ignore
      } finally {
        wsRef.current = null;
      }
    };
  }, []);

  const generate = useCallback(
    async (visual_direction: string, instructions: string = ""): Promise<string> => {
      setLoading(true);
      setError(null);

      // Log what is being sent to the AI for storyboard sketch generation
      console.log("[AI STORYBOARD SKETCH GENERATION] visual_direction:", visual_direction, "instructions:", instructions);

      try {
        // Start the AI job
        const { job_id } = await mutation.mutateAsync({ visual_direction, instructions });
        addAiJob({ type: "storyboard_sketch", jobId: job_id, createdAt: Date.now() });
        const wsUrl = buildWsUrl(`/ws/generate-storyboard-sketch-result/${job_id}`);

        return await new Promise<string>((resolve, reject) => {
          const ws = new ReconnectingWebSocket(wsUrl);
          wsRef.current = ws;

          // Avoid leaking sockets if the component re-renders or the promise resolves.
          // Keep a hard timeout in sync with other canvas hooks.
          const timeoutMs = 4 * 60_000;
          const timeoutId = window.setTimeout(() => {
            removeAiJob("storyboard_sketch", job_id);
            ws.disableReconnect();
            ws.close();
            reject(new Error("AI storyboard sketch generation timed out"));
          }, timeoutMs);

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(String(event.data));
              if (data.status === "pending") return;
              if (data.status === "done" && typeof data.image_base64 === "string") {
                removeAiJob("storyboard_sketch", job_id);
                window.clearTimeout(timeoutId);
                ws.disableReconnect();
                ws.close();
                resolve(data.image_base64);
              } else if (data.status === "error") {
                removeAiJob("storyboard_sketch", job_id);
                window.clearTimeout(timeoutId);
                ws.disableReconnect();
                ws.close();
                reject(new Error(data.error || "AI storyboard sketch generation failed"));
              }
            } catch {
              removeAiJob("storyboard_sketch", job_id);
              window.clearTimeout(timeoutId);
              ws.disableReconnect();
              ws.close();
              reject(new Error("Malformed WebSocket message"));
            }
          };

          ws.onerror = () => {
            // reconnecting websocket will retry; reject only on timeout
          };

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
