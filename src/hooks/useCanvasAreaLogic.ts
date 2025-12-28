import { useState, useEffect, useCallback } from "react";
import { getScripts, createScript, updateScript, deleteScript } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";
import { useCreateSegmentCollection, useUpdateSegmentCollection, useDeleteSegmentCollection } from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment, useDeleteSegment } from "@api/segments/mutations";
import type { SegmentCollection } from "@api/segment_collections/types";
import type { Segment as BaseSegment } from "@api/segments/types";

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

type ScriptsState = Script[];
type Segment = BaseSegment & { tempId?: string }; // Extend Segment to allow tempId for temp segments
type SegmentCollectionsState = {
  [id: string]: SegmentCollection & {
    tempId?: string;
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
  const [positions, setPositions] = useState<PositionsState>({});
  const [segmentCollections, setSegmentCollections] = useState<SegmentCollectionsState>({});
  const [segColPositions, setSegColPositions] = useState<PositionsState>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateCollectionMutation = useUpdateSegmentCollection();
  const deleteCollectionMutation = useDeleteSegmentCollection();
  const updateSegmentMutation = useUpdateSegment();
  const deleteSegmentMutation = useDeleteSegment();

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
          // Always merge temp (optimistic) scripts from localStorage with backend scripts
          const cachedScripts = localStorage.getItem(cacheKey);
          let mergedScripts: any[] = [];
          if (Array.isArray(scriptsData)) {
            mergedScripts = [...scriptsData];
          }
          if (cachedScripts) {
            try {
              const parsed = JSON.parse(cachedScripts);
              if (Array.isArray(parsed)) {
                parsed.forEach((script: any) => {
                  if (script.id && script.id.startsWith("temp-") && !mergedScripts.find((s: any) => s.id === script.id)) {
                    mergedScripts.unshift(script);
                  }
                });
              }
            } catch {}
          }
          // If no backend scripts and there are temp scripts, still render temp scripts
          if (mergedScripts.length === 0 && cachedScripts) {
            try {
              const parsed = JSON.parse(cachedScripts);
              if (Array.isArray(parsed)) {
                parsed.forEach((script: any) => {
                  if (script.id && script.id.startsWith("temp-") && !mergedScripts.find((s: any) => s.id === script.id)) {
                    mergedScripts.unshift(script);
                  }
                });
              }
            } catch {}
          }
          setScripts(mergedScripts);
          localStorage.setItem(cacheKey, JSON.stringify(mergedScripts));
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
              segments = (segData.data || []).map((seg: BaseSegment) => ({ ...seg, tempId: undefined }));
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
          // Always merge temp (optimistic) segment collections from localStorage with backend collections
          const segColCacheKey = getSegColCacheKey(organizationId, projectId);
          const cachedSegCols = localStorage.getItem(segColCacheKey);
          let mergedCollections: any = { ...allCollections };
          if (cachedSegCols) {
            try {
              const parsed = JSON.parse(cachedSegCols);
              if (parsed && typeof parsed === "object") {
                Object.values(parsed).forEach((col: any) => {
                  if (
                    col.tempId &&
                    !mergedCollections[col.tempId] &&
                    !mergedCollections[col.id]
                  ) {
                    mergedCollections[col.tempId] = col;
                  }
                });
              }
            } catch {}
          }
          // If no backend collections and there are temp collections, still render temp collections
          if (Object.keys(mergedCollections).length === 0 && cachedSegCols) {
            try {
              const parsed = JSON.parse(cachedSegCols);
              if (parsed && typeof parsed === "object") {
                Object.values(parsed).forEach((col: any) => {
                  if (
                    col.tempId &&
                    !mergedCollections[col.tempId] &&
                    !mergedCollections[col.id]
                  ) {
                    mergedCollections[col.tempId] = col;
                  }
                });
              }
            } catch {}
          }
          setSegmentCollections(mergedCollections);
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(mergedCollections));
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
        for (let i = 0; i < numSegments; i++) {
          const seg = await createSegmentMutation.mutateAsync({
            collectionId: segCol.id,
            segmentIndex: i,
            text: "New Segment",
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
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [organizationId, projectId, positions, createSegmentCollectionMutation, createSegmentMutation]
  );

  // Save a new segment collection (convert temp to real, like ScriptCard)
  const handleSaveNewSegmentCollection = useCallback(
    async (tempId: string, name: string, segments: { text: string }[]) => {
      setSegmentCollections((prev) => {
        const updated = {
          ...prev,
          [tempId]: {
            ...prev[tempId],
            name,
            segments: prev[tempId].segments.map((seg, i) => ({
              ...seg,
              text: segments[i]?.text ?? "",
            })),
            isSaving: true,
            error: null,
          },
        };
        localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(updated));
        return updated;
      });
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
        setSegmentCollections((prev) => {
          const { [tempId]: _, ...rest } = prev;
          const updated = {
            ...rest,
            [segCol.id]: {
              ...segCol,
              parentScriptId: segCol.scriptId,
              segments: createdSegments,
              isSaving: false,
              deleting: false,
              error: null,
              isNew: false,
            },
          };
          localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(updated));
          return updated;
        });
        setSegColPositions((prev) => {
          if (prev[tempId]) {
            const { [tempId]: tempPos, ...rest } = prev;
            const updated = { ...rest, [segCol.id]: tempPos };
            localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
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
  const handleRemoveNewSegmentCollection = useCallback(
    (tempId: string) => {
      setSegmentCollections((prev) => {
        const { [tempId]: _, ...rest } = prev;
        localStorage.setItem(getSegColCacheKey(organizationId, projectId), JSON.stringify(rest));
        return rest;
      });
      setSegColPositions((prev) => {
        if (prev[tempId]) {
          const { [tempId]: _, ...rest } = prev;
          localStorage.setItem(getSegColPositionsKey(organizationId, projectId), JSON.stringify(rest));
          return rest;
        }
        return prev;
      });
    },
    [organizationId, projectId]
  );

  // Remove handleSaveNewSegmentCollection (no more temp collections)

  // Remove handleRemoveNewSegmentCollection (no more temp collections)

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
      // Debug: log segmentId and whether PATCH will be skipped
      // eslint-disable-next-line no-console
      console.log("handleEditSegmentText", { colId, segmentId, newText, index, skipPatch: segmentId.startsWith("temp-") });
      // Prevent PATCH for temp segments (not yet in backend)
      if (segmentId.startsWith("temp-")) {
        setSegmentCollections((prev) => {
          const col = prev[colId];
          if (!col) return prev;
          const updatedSegments = col.segments.map((seg, i) =>
            (seg.id === segmentId || (seg as Segment).tempId === segmentId) && i === index
              ? { ...seg, text: newText }
              : seg
          );
          return {
            ...prev,
            [colId]: {
              ...col,
              segments: updatedSegments,
            },
          };
        });
        return;
      }
      setSegmentCollections((prev) => {
        const col = prev[colId];
        if (!col) return prev;
        const updatedSegments = col.segments.map((seg, i) =>
          (seg.id === segmentId || (seg as Segment).tempId === segmentId) && i === index
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
            (seg.id === segmentId || (seg as Segment).tempId === segmentId) && i === index
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
            (seg.id === segmentId || (seg as Segment).tempId === segmentId) && i === index
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
  // Optimistic Create
  const handleAddScript = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const newScript: Script & { isSaving?: boolean; deleting?: boolean } = {
      id: tempId,
      name: "",
      text: "",
      projectId,
      version: 1,
      createdAt: "",
      updatedAt: "",
      isSaving: false,
      deleting: false,
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
          s.id === tempId ? { ...s, name, text, isSaving: true } : s
        );
        updateCache(updated);
        return updated;
      });
      setSyncing(true);
      try {
        const created = await createScript(organizationId, projectId, { name, text });
        setScripts((prev) => {
          const updated = prev.map((s) =>
            s.id === tempId ? { ...created, isSaving: false, deleting: false } : s
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
        setScripts((prev) =>
          prev.map((s) =>
            s.id === tempId ? { ...s, isSaving: false } : s
          )
        );
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
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      updatePositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    scripts,
    positions,
    segmentCollections,
    segColPositions,
    loading,
    error,
    syncing,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
    handleCardPositionChange,
    handleAddSegmentCollection,
    handleSaveNewSegmentCollection,
    handleRemoveNewSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
    clearError,
  };
}
