import { useState, useRef, useEffect, useCallback } from "react";
import { useDeleteScript } from "@api/scripts/mutations";
import type { Script } from "@api/scripts/types";

interface UseScriptDeleteHandlerProps {
  script?: Script;
  organizationId: string;
  projectId: string;
  onDeleteOptimistic?: (id: string) => void;
  onSavedOrCancel?: () => void;
  onSyncChange?: (syncing: boolean) => void;
}

export function useScriptDeleteHandler({
  script,
  organizationId,
  projectId,
  onDeleteOptimistic,
  onSavedOrCancel,
  onSyncChange,
}: UseScriptDeleteHandlerProps) {
  const [deleting, setDeleting] = useState(false);
  const deleteScript = useDeleteScript();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isSyncingRef.current && onSyncChange) {
        onSyncChange(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteHandler = useCallback(() => {
    if (!script) return;
    setDeleting(true);
    if (onDeleteOptimistic) onDeleteOptimistic(script.id);
    if (onSyncChange) onSyncChange(true);
    isSyncingRef.current = true;
    deleteScript.mutate(
      {
        id: script.id,
        organizationId,
        projectId,
      },
      {
        onSettled: () => {
          setDeleting(false);
          if (onSyncChange) onSyncChange(false);
          isSyncingRef.current = false;
          if (onSavedOrCancel) onSavedOrCancel();
        },
      }
    );
  }, [script, organizationId, projectId, onDeleteOptimistic, onSavedOrCancel, onSyncChange, deleteScript]);

  return { deleteHandler, deleting };
}
