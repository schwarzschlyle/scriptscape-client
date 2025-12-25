import { useState, useRef, useEffect, useCallback } from "react";
import { useCreateScript, useUpdateScript } from "@api/scripts/mutations";
import type { Script } from "@api/scripts/types";

interface UseScriptSaveHandlerProps {
  script?: Script;
  organizationId: string;
  projectId: string;
  isNew: boolean;
  onSavedOrCancel?: () => void;
  onEditOptimistic?: (id: string, name: string, text: string) => void;
  onSyncChange?: (syncing: boolean) => void;
}

export function useScriptSaveHandler({
  script,
  organizationId,
  projectId,
  isNew,
  onSavedOrCancel,
  onEditOptimistic,
  onSyncChange,
}: UseScriptSaveHandlerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isSyncingRef.current && onSyncChange) {
        onSyncChange(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(
    (name: string, text: string) => {
      setSaving(true);
      setError(null);
      if (isNew) {
        if (onSyncChange) onSyncChange(true);
        isSyncingRef.current = true;
        createScript.mutate(
          {
            organizationId,
            projectId,
            name: name || "Untitled Script",
            text,
          },
          {
            onSettled: () => {
              setSaving(false);
              if (onSyncChange) onSyncChange(false);
              isSyncingRef.current = false;
              if (onSavedOrCancel) onSavedOrCancel();
            },
          }
        );
      } else if (script) {
        if (onEditOptimistic) onEditOptimistic(script.id, name, text);
        if (onSyncChange) onSyncChange(true);
        isSyncingRef.current = true;
        updateScript.mutate(
          {
            id: script.id,
            organizationId,
            projectId,
            data: { name, text },
          },
          {
            onSettled: () => {
              setSaving(false);
              if (onSyncChange) onSyncChange(false);
              isSyncingRef.current = false;
            },
          }
        );
      }
    },
    [
      isNew,
      script,
      organizationId,
      projectId,
      onSavedOrCancel,
      onEditOptimistic,
      onSyncChange,
      createScript,
      updateScript,
    ]
  );

  return { save, saving, error, setError };
}
