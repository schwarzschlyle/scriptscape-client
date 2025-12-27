import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

type ScriptsState = Script[];
type PositionsState = { [id: string]: { x: number; y: number } };

const getCacheKey = (organizationId: string, projectId: string) =>
  `scripts-cache-${organizationId}-${projectId}`;
const getPositionsKey = (organizationId: string, projectId: string) =>
  `canvas-positions-${organizationId}-${projectId}`;

export function useCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseCanvasAreaLogicProps) {
  const [scripts, setScripts] = useState<ScriptsState>([]);
  const [positions, setPositions] = useState<PositionsState>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function updateCache(scripts: ScriptsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(scripts));
  }

  function updatePositionsCache(positions: PositionsState) {
    const positionsKey = getPositionsKey(organizationId, projectId);
    console.log("Writing positions to localStorage:", positions);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
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

    // Load positions from cache
    const positionsKey = getPositionsKey(organizationId, projectId);
    const cachedPositions = localStorage.getItem(positionsKey);
    if (cachedPositions) {
      try {
        const parsed = JSON.parse(cachedPositions);
        if (parsed && typeof parsed === "object") {
          console.log("Loaded positions from localStorage (on mount):", parsed);
          setPositions(parsed);
        }
      } catch {}
    }
    setPositionsLoaded(true);

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
    setPositions((prev) => {
      // Only add positions for scripts that do not already have one
      let changed = false;
      const next: PositionsState = { ...prev };
      scripts.forEach((s, i) => {
        if (!next[s.id]) {
          next[s.id] = { x: 200 + (i % 5) * 60, y: 200 + Math.floor(i / 5) * 120 };
          changed = true;
        }
      });
      // Remove positions for deleted scripts
      Object.keys(next).forEach((id) => {
        if (!scripts.find((s) => s.id === id)) {
          delete next[id];
          changed = true;
        }
      });
      if (changed) {
        updatePositionsCache(next);
        return next;
      }
      return prev;
    });
  }, [scripts, organizationId, projectId, positionsLoaded]);

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
        // Migrate position from tempId to real id
        setPositions((prev) => {
          if (prev[tempId]) {
            const { [tempId]: tempPos, ...rest } = prev;
            const next = { ...rest, [created.id]: tempPos };
            updatePositionsCache(next);
            return next;
          }
          return prev;
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

  // Optimistic Edit
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
    setPositions((prev) => {
      if (prev[tempId]) {
        const { [tempId]: _, ...rest } = prev;
        updatePositionsCache(rest);
        return rest;
      }
      return prev;
    });
  }, [organizationId, projectId]);

  // Update position of a script card and cache
  const handleCardPositionChange = useCallback((id: string, x: number, y: number) => {
    console.log("handleCardPositionChange called for", id, "with", { x, y });
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      console.log("Updating position for", id, "to", { x, y }, "next positions:", next);
      updatePositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    scripts,
    positions,
    loading,
    error,
    syncing,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
    handleCardPositionChange,
    clearError,
  };
}
