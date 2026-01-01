import { useState, useEffect, useCallback } from "react";
import { useCreateSegmentCollection, useUpdateSegmentCollection, useDeleteSegmentCollection } from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment } from "@api/segments/mutations";
import type { SegmentCollection } from "@api/segment_collections/types";
import type { Segment as BaseSegment } from "@api/segments/types";

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

const getSegColCacheKey = (organizationId: string, projectId: string) =>
  `segment-collections-cache-${organizationId}-${projectId}`;
const getSegColPositionsKey = (organizationId: string, projectId: string) =>
  `segment-collections-positions-${organizationId}-${projectId}`;

export interface UseSegmentsCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

export function useSegmentsCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseSegmentsCanvasAreaLogicProps) {
  const [segmentCollections, setSegmentCollections] = useState<SegmentCollectionsState>({});
  const [segColPositions, setSegColPositions] = useState<PositionsState>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track pending segment collection creation per script
  const [pendingSegmentCollection, setPendingSegmentCollection] = useState<{ [scriptId: string]: boolean }>({});

  const updateCollectionMutation = useUpdateSegmentCollection();
  const deleteCollectionMutation = useDeleteSegmentCollection();
  const updateSegmentMutation = useUpdateSegment();
  const createSegmentCollectionMutation = useCreateSegmentCollection();
  const createSegmentMutation = useCreateSegment();

  function updateSegColCache(collections: SegmentCollectionsState) {
    const cacheKey = getSegColCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(collections));
  }

  function updateSegColPositionsCache(positions: PositionsState) {
    const positionsKey = getSegColPositionsKey(organizationId, projectId);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
  }

  // Load from cache on mount, then fetch from backend in background
  useEffect(() => {
    setLoading(true);

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

    setLoading(false);
  }, [organizationId, projectId]);

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // Add a new segment collection (non-optimistic: only add after API call succeeds)
  const handleAddSegmentCollection = useCallback(
    async (parentScriptId: string, name: string, numSegments: number, parentScriptPosition?: { x: number; y: number }) => {
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
        // TODO: [AI INTEGRATION] The following random string will be replaced by AI-generated content from the API.
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
          updateSegColCache(updated);
          return updated;
        });
        // Assign a position for the new collection
        setSegColPositions((prev) => {
          const parentPos = parentScriptPosition || { x: 200, y: 200 };
          const offsetX = 380;
          const offsetY = 40 + Object.keys(prev).length * 40;
          const updated = {
            ...prev,
            [segCol.id]: { x: parentPos.x + offsetX, y: parentPos.y + offsetY },
          };
          updateSegColPositionsCache(updated);
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
    [organizationId, projectId, createSegmentCollectionMutation, createSegmentMutation]
  );

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

  // Delete segment collection (optimistic)
  const handleDeleteSegmentCollection = useCallback(
    async (colId: string) => {
      let prevCol: any;
      setSegmentCollections((prev) => {
        prevCol = prev[colId];
        const { [colId]: _, ...rest } = prev;
        updateSegColCache(rest);
        return rest;
      });
      setSegColPositions((prev) => {
        const { [colId]: _, ...rest } = prev;
        updateSegColPositionsCache(rest);
        return rest;
      });
      setSyncing(true);
      try {
        await deleteCollectionMutation.mutateAsync(colId);
        setError(null); // Clear error after successful delete
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
          updateSegColCache(updated);
          return updated;
        });
        setSegColPositions((prev) => {
          const updated = {
            ...prev,
            [colId]: prevCol && prevCol.position ? prevCol.position : { x: 600, y: 200 },
          };
          updateSegColPositionsCache(updated);
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
      updateSegColPositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    segmentCollections,
    segColPositions,
    loading,
    error,
    syncing,
    pendingSegmentCollection,
    handleAddSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
    clearError,
  };
}
