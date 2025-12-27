import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

type ScriptsState = Script[];

export function useCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseCanvasAreaLogicProps) {
  const [scripts, setScripts] = useState<ScriptsState>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getScripts(organizationId, projectId)
      .then((data) => {
        if (mounted) setScripts(data || []);
      })
      .catch(() => {
        if (mounted) setError("Failed to load scripts.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [organizationId, projectId]);

  // Syncing indicator for CanvasHeader
  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // CREATE (truly optimistic)
  const handleAddScript = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const newScript: Script = {
      id: tempId,
      name: "",
      text: "",
      projectId,
      version: 1,
      createdAt: "",
      updatedAt: "",
    };
    setScripts((prev) => [newScript, ...prev]);
  }, [projectId]);

  const handleSaveNewScript = useCallback(
    async (tempId: string, name: string, text: string) => {
      // Optimistically update the card immediately
      setScripts((prev) =>
        prev.map((s) =>
          s.id === tempId ? { ...s, name, text } : s
        )
      );
      setSyncing(true);
      try {
        const created = await createScript(organizationId, projectId, { name, text });
        // Replace tempId with real id from backend
        setScripts((prev) =>
          prev.map((s) =>
            s.id === tempId ? { ...created } : s
          )
        );
      } catch (e) {
        // Remove the card if creation fails
        setScripts((prev) => prev.filter((s) => s.id !== tempId));
        setError("Failed to create script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId]
  );

  // EDIT (truly optimistic)
  const handleEditScript = useCallback(
    async (id: string, name: string, text: string) => {
      // Optimistically update the card immediately
      const prevScripts = [...scripts];
      setScripts((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name, text } : s
        )
      );
      setSyncing(true);
      try {
        await updateScript(organizationId, projectId, id, { name, text });
        // Optionally, update with backend response if needed
      } catch (e) {
        // Revert to previous state if update fails
        setScripts(prevScripts);
        setError("Failed to update script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId, scripts]
  );

  // DELETE (already optimistic)
  const handleDeleteScript = useCallback(
    async (id: string) => {
      const prevScripts = [...scripts];
      setScripts((prev) => prev.filter((s) => s.id !== id));
      setSyncing(true);
      try {
        await deleteScript(organizationId, projectId, id);
      } catch (e) {
        setScripts(prevScripts);
        setError("Failed to delete script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId, scripts]
  );

  // Remove new script (cancel)
  const handleRemoveNewScript = useCallback((tempId: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== tempId));
  }, []);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    scripts,
    loading,
    error,
    syncing,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
    clearError,
  };
}
