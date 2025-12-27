import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

type ScriptsState = Script[];

const getCacheKey = (organizationId: string, projectId: string) =>
  `scripts-cache-${organizationId}-${projectId}`;

export function useCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseCanvasAreaLogicProps) {
  const [scripts, setScripts] = useState<ScriptsState>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to update cache after any change
  function updateCache(scripts: ScriptsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(scripts));
  }

  // Load from cache on mount, then fetch from backend in background
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const cacheKey = getCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setScripts(parsed);
          setLoading(false); // Hide spinner if cached scripts are rendered
        }
      } catch {}
    }

    getScripts(organizationId, projectId)
      .then((data) => {
        if (mounted) {
          setScripts(data || []);
          localStorage.setItem(cacheKey, JSON.stringify(data || []));
        }
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

  // Optimistic Create
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
    setScripts((prev) => {
      const updated = [newScript, ...prev];
      updateCache(updated);
      return updated;
    });
  }, [projectId, organizationId]);

  const handleSaveNewScript = useCallback(
    async (tempId: string, name: string, text: string) => {
      setScripts((prev) => {
        const updated = prev.map((s) =>
          s.id === tempId ? { ...s, name, text } : s
        );
        updateCache(updated);
        return updated;
      });
      setSyncing(true);
      try {
        const created = await createScript(organizationId, projectId, { name, text });
        setScripts((prev) => {
          const updated = prev.map((s) =>
            s.id === tempId ? { ...created } : s
          );
          updateCache(updated);
          return updated;
        });
      } catch (e) {
        setScripts((prev) => {
          const updated = prev.filter((s) => s.id !== tempId);
          updateCache(updated);
          return updated;
        });
        setError("Failed to create script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId]
  );

  // Optimistic Update
  const handleEditScript = useCallback(
    async (id: string, name: string, text: string) => {
      setScripts((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, name, text } : s
        );
        updateCache(updated);
        return updated;
      });
      setSyncing(true);
      try {
        await updateScript(organizationId, projectId, id, { name, text });
        // Optionally, update with backend response if needed
      } catch (e) {
        setScripts((prev) => {
          // Revert to previous state if update fails
          const cacheKey = getCacheKey(organizationId, projectId);
          const cached = localStorage.getItem(cacheKey);
          let fallback = prev;
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                fallback = parsed;
              }
            } catch {}
          }
          updateCache(fallback);
          return fallback;
        });
        setError("Failed to update script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId]
  );

  // Optimistic Delete
  const handleDeleteScript = useCallback(
    async (id: string) => {
      setScripts((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        updateCache(updated);
        return updated;
      });
      setSyncing(true);
      try {
        await deleteScript(organizationId, projectId, id);
      } catch (e) {
        setScripts((prev) => {
          // Revert to previous state if delete fails
          const cacheKey = getCacheKey(organizationId, projectId);
          const cached = localStorage.getItem(cacheKey);
          let fallback = prev;
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                fallback = parsed;
              }
            } catch {}
          }
          updateCache(fallback);
          return fallback;
        });
        setError("Failed to delete script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId]
  );

  // Remove new script (cancel)
  const handleRemoveNewScript = useCallback((tempId: string) => {
    setScripts((prev) => {
      const updated = prev.filter((s) => s.id !== tempId);
      updateCache(updated);
      return updated;
    });
  }, [organizationId, projectId]);

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
