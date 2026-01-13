import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";
import { usePersistedCardPositions } from "./usePersistedCardPositions";

type ScriptsState = Script[];

const getCacheKey = (organizationId: string, projectId: string) =>
  `scripts-cache-${organizationId}-${projectId}`;

export interface UseScriptsCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

export function useScriptsCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseScriptsCanvasAreaLogicProps) {
  const [scripts, setScripts] = useState<ScriptsState>([]);
  const [draftScripts, setDraftScripts] = useState<{ [id: string]: { name: string; text: string } }>({});
  const {
    positions,
    loaded: positionsLoaded,
    setCardPosition,
    deleteCardPosition,
    ensureDefaultPositions,
  } = usePersistedCardPositions({ organizationId, projectId, cardType: "script" });
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function updateCache(scripts: ScriptsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(scripts));
  }


  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Scripts
    const cacheKey = getCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setScripts(parsed);
          setLoading(false);
        }
      } catch {}
    }

    // positions are hydrated by usePersistedCardPositions (IDB -> DB)

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

  // Only assign default positions for new scripts, never overwrite existing positions
  useEffect(() => {
    if (!positionsLoaded) return;
    ensureDefaultPositions(
      scripts.map((s) => s.id),
      (_id, i) => ({ x: 200 + (i % 5) * 60, y: 200 + Math.floor(i / 5) * 120 })
    );
  }, [scripts, organizationId, projectId, positionsLoaded]);

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // --- Script logic (define all handlers before return) ---
  const handleAddScript = useCallback(
    async (name: string, text: string, position?: { x: number; y: number }) => {
      setSyncing(true);
      try {
        const created = await createScript(organizationId, projectId, { name, text });
        setScripts((prev) => {
          const updated = [created, ...prev];
          updateCache(updated);
          return updated;
        });
        // Assign position if provided
        if (position) {
          setCardPosition(created.id, position.x, position.y);
        }
      } catch (e) {
        setError("Failed to create script.");
      } finally {
        setSyncing(false);
      }
    },
    [organizationId, projectId]
  );

  // Optimistic Edit
  const handleEditScript = useCallback(
    async (id: string, name: string, text: string) => {
      setScripts((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, name, text, isSaving: true } : s
        );
        updateCache(updated);
        return updated;
      });
      setSyncing(true);
      try {
        await updateScript(organizationId, projectId, id, { name, text });
        setScripts((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isSaving: false } : s
          )
        );
      } catch (e) {
        setScripts((prev) => {
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
          return fallback.map((s) =>
            s.id === id ? { ...s, isSaving: false } : s
          );
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
      setScripts((prev) => prev.filter((s) => s.id !== id));
      setSyncing(true);
      try {
        await deleteScript(organizationId, projectId, id);
        setError(null); // Clear error after successful delete
      } catch (e) {
        setScripts((prev) => {
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

  /** Optimistically remove script positions too (and cache). */
  const handleDeleteScriptPosition = useCallback(
    (id: string) => {
      deleteCardPosition(id);
    },
    [deleteCardPosition]
  );

  // Update position of a script card and cache
  const handleCardPositionChange = useCallback((id: string, x: number, y: number) => {
    setCardPosition(id, x, y);
  }, [setCardPosition]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Add a new draft script (not persisted)
  const handleAddDraftScript = useCallback(() => {
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setDraftScripts((prev) => ({
      ...prev,
      [tempId]: { name: "", text: "" },
    }));
  }, []);

  // Save a draft script (persist to backend, replace with real script)
  const handleSaveDraftScript = useCallback(
    async (tempId: string, name: string, text: string) => {
      try {
        const created = await createScript(organizationId, projectId, { name, text });
        setScripts((prev) => {
          const updated = [created, ...prev];
          updateCache(updated);
          return updated;
        });
      } catch (e) {
        setError("Failed to create script.");
      } finally {
        setDraftScripts((prev) => {
          const { [tempId]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [organizationId, projectId]
  );

  // Remove a draft script (cancel)
  const handleRemoveDraftScript = useCallback((tempId: string) => {
    setDraftScripts((prev) => {
      const { [tempId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    scripts,
    draftScripts,
    positions,
    loading,
    error,
    syncing,
    handleAddScript,
    handleAddDraftScript,
    handleSaveDraftScript,
    handleRemoveDraftScript,
    handleEditScript,
    handleDeleteScript,
    handleDeleteScriptPosition,
    handleCardPositionChange,
    clearError,
  };
}
