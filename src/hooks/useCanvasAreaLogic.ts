import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";
import { useCreateSegmentCollection, useUpdateSegmentCollection, useDeleteSegmentCollection } from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment } from "@api/segments/mutations";
import type { SegmentCollection } from "@api/segment_collections/types";
import type { Segment as BaseSegment } from "@api/segments/types";

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

type ScriptsState = Script[];
type Segment = BaseSegment;
type SegmentCollectionsState = {
  [id: string]: SegmentCollection & {
    parentScriptId: string;
    segments: Segment[];
    isSaving?: boolean;
    deleting?: boolean;
    error?: string | null;
  };
};
type PositionsState = { [id: string]: { x: number; y: number } };

const getCacheKey = (organizationId: string, projectId: string) =>
  `scripts-cache-${organizationId}-${projectId}`;
const getPositionsKey = (organizationId: string, projectId: string) =>
  `canvas-positions-${organizationId}-${projectId}`;
const getSegColCacheKey = (organizationId: string, projectId: string) =>
  `segment-collections-cache-${organizationId}-${projectId}`;
const getSegColPositionsKey = (organizationId: string, projectId: string) =>
  `segment-collections-positions-${organizationId}-${projectId}`;

export function useCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseCanvasAreaLogicProps) {
  const [scripts, setScripts] = useState<ScriptsState>([]);
  // Local draft scripts (not yet persisted)
  const [draftScripts, setDraftScripts] = useState<{ [id: string]: { name: string; text: string } }>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [segmentCollections, setSegmentCollections] = useState<SegmentCollectionsState>({});
  const [segColPositions, setSegColPositions] = useState<PositionsState>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track pending segment collection creation per script
  const [pendingSegmentCollection, setPendingSegmentCollection] = useState<{ [scriptId: string]: boolean }>({});

  const updateCollectionMutation = useUpdateSegmentCollection();
  const deleteCollectionMutation = useDeleteSegmentCollection();
  const updateSegmentMutation = useUpdateSegment();

  function updateCache(scripts: ScriptsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(scripts));
  }

  function updatePositionsCache(positions: PositionsState) {
    const positionsKey = getPositionsKey(organizationId, projectId);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
  }

  // Load from cache on mount, then fetch from backend in background
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

    // Script positions
    const positionsKey = getPositionsKey(organizationId, projectId);
    const cachedPositions = localStorage.getItem(positionsKey);
    if (cachedPositions) {
      try {
        const parsed = JSON.parse(cachedPositions);
        if (parsed && typeof parsed === "object") {
          setPositions(parsed);
        }
      } catch {}
    }

    // Segment collections: load from localStorage first (optimistic render)
    const segColCacheKey = getSegColCacheKey(organizationId, projectId);
    const cachedSegCols = localStorage.getItem(segColCacheKey);
    if (cachedSegCols) {
      try {
        const parsed = JSON.parse(cachedSegCols);
        if (parsed && typeof parsed === "object") {
          setSegmentCollections(parsed);
        }
      } catch {}
    }

    // Segment collections and segments: fetch from backend for all scripts
    (async () => {
      try {
        const scriptsData = await getScripts(organizationId, projectId);
        if (mounted) {
          // Only use backend scripts, do not merge temp scripts
          setScripts(scriptsData || []);
          localStorage.setItem(cacheKey, JSON.stringify(scriptsData || []));
        }
        let allCollections: SegmentCollectionsState = {};
        for (const script of scriptsData || []) {
          const res = await fetch(`/api/scripts/${script.id}/segment-collections`);
          if (!res.ok) continue;
          const { data: collections } = await res.json();
          for (const col of collections) {
            const segRes = await fetch(`/api/segment-collections/${col.id}/segments`);
            let segments: Segment[] = [];
            if (segRes.ok) {
              const segData = await segRes.json();
              segments = (segData.data || []).map((seg: BaseSegment) => ({ ...seg }));
            }
            allCollections[col.id] = {
              ...col,
              parentScriptId: script.id,
              segments,
              isSaving: false,
              deleting: false,
              error: null,
            };
          }
        }
        if (mounted) {
          // Only use backend segment collections, do not merge temp collections
          setSegmentCollections(allCollections);
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(allCollections));
        }
      } catch (e) {
        if (mounted) setError("Failed to load segment collections.");
      }
    })();

    // Segment collection positions
    const segColPositionsKey = getSegColPositionsKey(organizationId, projectId);
    const cachedSegColPositions = localStorage.getItem(segColPositionsKey);
    if (cachedSegColPositions) {
      try {
        const parsed = JSON.parse(cachedSegColPositions);
        if (parsed && typeof parsed === "object") {
          setSegColPositions(parsed);
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
      let changed = false;
      const next: PositionsState = { ...prev };
      scripts.forEach((s, i) => {
        if (!next[s.id]) {
          next[s.id] = { x: 200 + (i % 5) * 60, y: 200 + Math.floor(i / 5) * 120 };
          changed = true;
        }
      });
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

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // --- Script logic omitted for brevity (unchanged) ---

  // --- Segment Collection Logic ---

  // --- NEW SEGMENT COLLECTION LOGIC (mirrors ScriptCard) ---

  const createSegmentCollectionMutation = useCreateSegmentCollection();
  const createSegmentMutation = useCreateSegment();

  // Add a new segment collection (non-optimistic: only add after API call succeeds)
  const handleAddSegmentCollection = useCallback(
    async (parentScriptId: string, name: string, numSegments: number) => {
      console.log("handleAddSegmentCollection parentScriptId:", parentScriptId);
      setPendingSegmentCollection(prev => ({ ...prev, [parentScriptId]: true }));
      setSyncing(true);
      if (onSyncChange) onSyncChange(true);
      try {
        // Create the collection in backend
        const segCol = await createSegmentCollectionMutation.mutateAsync({
          scriptId: parentScriptId,
          name,
        });
        // Create segments in backend
        const createdSegments: Segment[] = [];
        function random4Digit() {
          return Math.floor(1000 + Math.random() * 9000).toString();
        }
        for (let i = 0; i < numSegments; i++) {
          const seg = await createSegmentMutation.mutateAsync({
            collectionId: segCol.id,
            segmentIndex: i,
            text: `Generated-Segment-${random4Digit()}`,
          });
          createdSegments.push(seg);
        }
        // Add the new collection to state and localStorage only after all API calls succeed
        setSegmentCollections((prev) => {
          const updated = {
            ...prev,
            [segCol.id]: {
              ...segCol,
              parentScriptId,
              segments: createdSegments,
              isSaving: false,
              deleting: false,
              error: null,
            },
          };
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(updated));
          return updated;
        });
        // Assign a position for the new collection
        setSegColPositions((prev) => {
          const parentPos = positions[parentScriptId] || { x: 200, y: 200 };
          const offsetX = 380;
          const offsetY = 40 + Object.keys(prev).length * 40;
          const updated = {
            ...prev,
            [segCol.id]: { x: parentPos.x + offsetX, y: parentPos.y + offsetY },
          };
          localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(updated));
          return updated;
        });
      } catch (e: any) {
        setError(e?.message || "Failed to create segment collection.");
      } finally {
        setPendingSegmentCollection(prev => ({ ...prev, [parentScriptId]: false }));
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [organizationId, projectId, positions, createSegmentCollectionMutation, createSegmentMutation]
  );

  // Save a new segment collection (convert temp to real, like ScriptCard)
  const handleSaveNewSegmentCollection = useCallback(
    async (tempId: string, name: string, segments: { text: string }[]) => {
      // Remove temp segment collection logic (no temp collections)
      return;
      setSyncing(true);
      try {
        // Create the collection
        const segCol = await createSegmentCollectionMutation.mutateAsync({
          scriptId: segmentCollections[tempId].parentScriptId,
          name,
        });
        // Create segments
        const createdSegments: Segment[] = [];
        for (let i = 0; i < segments.length; i++) {
          const seg = await createSegmentMutation.mutateAsync({
            collectionId: segCol.id,
            segmentIndex: i,
            text: segments[i].text || "New Segment",
          });
          createdSegments.push(seg);
        }
        // Remove temp segment collection logic (no temp collections)
        return;
      } catch (e: any) {
        setSegmentCollections((prev) => {
          const { [tempId]: _, ...rest } = prev;
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(rest));
          return rest;
        });
        setSegColPositions((prev) => {
          const { [tempId]: _, ...rest } = prev;
          localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(rest));
          return rest;
        });
        setError(e?.message || "Failed to create segment collection.");
      } finally {
        setSyncing(false);
      }
    },
    [createSegmentCollectionMutation, createSegmentMutation, organizationId, projectId, segmentCollections]
  );

  // Remove new segment collection (cancel)
  // Removed unused handleRemoveNewSegmentCollection (no temp collections)

  // Remove handleSaveNewSegmentCollection (no more temp collections)

  // Remove handleRemoveNewSegmentCollection (no more temp collections)

  // --- REFACTOR NOTE ---
  // State is now fully centralized here. All persistent state for scripts, segment collections, and positions
  // is managed in this hook. All editing state is managed locally in the card components for UI responsiveness.
  // To further unify editing logic, consider extracting a useEditableField hook for name/text editing in cards.
  // This will reduce duplication and improve extensibility.

  // Edit segment collection name
  const handleEditSegmentCollectionName = useCallback(
    async (colId: string, newName: string) => {
      setSegmentCollections((prev) => ({
        ...prev,
        [colId]: {
          ...prev[colId],
          name: newName,
          isSaving: true,
          error: null,
        },
      }));
      setSyncing(true);
      try {
        await updateCollectionMutation.mutateAsync({ id: colId, data: { name: newName } });
        setSegmentCollections((prev) => ({
          ...prev,
          [colId]: {
            ...prev[colId],
            name: newName,
            isSaving: false,
            error: null,
          },
        }));
      } catch (e: any) {
        setSegmentCollections((prev) => ({
          ...prev,
          [colId]: {
            ...prev[colId],
            isSaving: false,
            error: e?.message || "Failed to update collection name.",
          },
        }));
      } finally {
        setSyncing(false);
      }
    },
    [updateCollectionMutation]
  );

  // Edit segment text
  const handleEditSegmentText = useCallback(
    async (colId: string, segmentId: string, newText: string, index: number) => {
      // PATCH for all segments (no temp segments)
      setSegmentCollections((prev) => {
        const col = prev[colId];
        if (!col) return prev;
        const updatedSegments = col.segments.map((seg, i) =>
          seg.id === segmentId && i === index
            ? { ...seg, text: newText, isSaving: true, error: null }
            : seg
        );
        return {
          ...prev,
          [colId]: {
            ...col,
            segments: updatedSegments,
            isSaving: true,
            error: null,
          },
        };
      });
      setSyncing(true);
      if (onSyncChange) onSyncChange(true);
      try {
        await updateSegmentMutation.mutateAsync({ id: segmentId, data: { text: newText } });
        setSegmentCollections((prev) => {
          const col = prev[colId];
          if (!col) return prev;
          const updatedSegments = col.segments.map((seg, i) =>
            seg.id === segmentId && i === index
              ? { ...seg, text: newText, isSaving: false, error: null }
              : seg
          );
          return {
            ...prev,
            [colId]: {
              ...col,
              segments: updatedSegments,
              isSaving: false,
              error: null,
            },
          };
        });
      } catch (e: any) {
        setSegmentCollections((prev) => {
          const col = prev[colId];
          if (!col) return prev;
          const updatedSegments = col.segments.map((seg, i) =>
            seg.id === segmentId && i === index
              ? { ...seg, isSaving: false, error: e?.message || "Failed to update segment." }
              : seg
          );
          return {
            ...prev,
            [colId]: {
              ...col,
              segments: updatedSegments,
              isSaving: false,
              error: e?.message || "Failed to update segment.",
            },
          };
        });
      } finally {
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [updateSegmentMutation]
  );

  // Delete segment collection (optimistic, like ScriptCard)
  const handleDeleteSegmentCollection = useCallback(
    async (colId: string) => {
      let prevCol: any;
      setSegmentCollections((prev) => {
        prevCol = prev[colId];
        const { [colId]: _, ...rest } = prev;
        localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(rest));
        return rest;
      });
      setSegColPositions((prev) => {
        const { [colId]: _, ...rest } = prev;
        localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(rest));
        return rest;
      });
      setSyncing(true);
      try {
        await deleteCollectionMutation.mutateAsync(colId);
      } catch (e: any) {
        // Rollback on error
        setSegmentCollections((prev) => {
          const updated = {
            ...prev,
            [colId]: {
              ...prevCol,
              deleting: false,
              error: e?.message || "Failed to delete segment collection.",
            },
          };
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(updated));
          return updated;
        });
        setSegColPositions((prev) => {
          const updated = {
            ...prev,
            [colId]: prevCol && prevCol.position ? prevCol.position : { x: 600, y: 200 },
          };
          localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(updated));
          return updated;
        });
      } finally {
        setSyncing(false);
      }
    },
    [deleteCollectionMutation, organizationId, projectId]
  );

  // Update position of a segment collection card and cache
  const handleSegColPositionChange = useCallback((id: string, x: number, y: number) => {
    setSegColPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(next));
      return next;
    });
  }, [organizationId, projectId]);

  // --- Script logic (define all handlers before return) ---
  // Only allow script creation via backend, no temp scripts
  const handleAddScript = useCallback(
    async (name: string, text: string) => {
      setSyncing(true);
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
      // Find all child segment collections
      const childCollectionIds = Object.values(segmentCollections)
        .filter(col => col.parentScriptId === id)
        .map(col => col.id);

      // Optimistically remove child segment collections from state and localStorage
      setSegmentCollections((prev) => {
        const updated = { ...prev };
        childCollectionIds.forEach(colId => {
          delete updated[colId];
        });
        localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(updated));
        return updated;
      });
      setSegColPositions((prev) => {
        const updated = { ...prev };
        childCollectionIds.forEach(colId => {
          delete updated[colId];
        });
        localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(updated));
        return updated;
      });

      // Optimistically remove the script from the UI immediately
      setScripts((prev) => prev.filter((s) => s.id !== id));

      setSyncing(true);
      try {
        // Delete all child segment collections in the backend
        for (const colId of childCollectionIds) {
          if (colId) {
            await deleteCollectionMutation.mutateAsync(colId);
          }
        }
        await deleteScript(organizationId, projectId, id);
      } catch (e) {
        // If deletion fails, reload scripts from cache (fallback)
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
    [organizationId, projectId, segmentCollections, deleteCollectionMutation]
  );

  // Update position of a script card and cache
  const handleCardPositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      updatePositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

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
    segmentCollections,
    segColPositions,
    loading,
    error,
    syncing,
    pendingSegmentCollection,
    handleAddScript,
    handleAddDraftScript,
    handleSaveDraftScript,
    handleRemoveDraftScript,
    handleEditScript,
    handleDeleteScript,
    handleCardPositionChange,
    handleAddSegmentCollection,
    handleSaveNewSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
    clearError,
  };
}
