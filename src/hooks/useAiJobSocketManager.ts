import React from "react";
import { AiJobSocketManager } from "../utils/aiJobSocketManager";

/**
 * Hook-local instance of AiJobSocketManager.
 * Guarantees `cleanupAll()` on unmount.
 */
export function useAiJobSocketManager() {
  const mgrRef = React.useRef<AiJobSocketManager | null>(null);
  if (!mgrRef.current) mgrRef.current = new AiJobSocketManager();

  React.useEffect(() => {
    return () => {
      try {
        mgrRef.current?.cleanupAll();
      } catch {
        // ignore
      }
    };
  }, []);

  return mgrRef.current;
}

