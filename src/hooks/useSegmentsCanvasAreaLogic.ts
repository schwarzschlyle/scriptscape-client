import { useState, useEffect, useCallback } from "react";
import {
  useCreateSegmentCollection,
  useUpdateSegmentCollection,
  useDeleteSegmentCollection,
} from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment } from "@api/segments/mutations";
import type { SegmentCollection } from "@api/segment_collections/types";
import type { Segment as BaseSegment } from "@api/segments/types";

type Segment = BaseSegment;
type CollectionsState = {
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
  `segment-collections-cache-${organizationId}-${projectId}`;
const getPositionsKey = (organizationId: string, projectId: string) =>
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
  const [collections, setCollections] = useState<CollectionsState>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [pendingSegmentCollection, setPendingSegmentCollection] = useState<{ [scriptId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const createSegmentCollectionMutation = useCreateSegmentCollection();
  const createSegmentMutation = useCreateSegment();
  const updateCollectionMutation = useUpdateSegmentCollection();
  const deleteCollectionMutation = useDeleteSegmentCollection();
  const updateSegmentMutation = useUpdateSegment();

  function updateCache(collections: CollectionsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(collections));
  }

  function updatePositionsCache(positions: PositionsState) {
    const positionsKey = getPositionsKey(organizationId, projectId);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
  }

  useEffect(() => {
    setLoading(true);

    // Collections
    const cacheKey = getCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setCollections(parsed);
        }
      } catch {}
    }

    // Positions
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

    setLoading(false);
  }, [organizationId, projectId]);

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // Add a new collection (non-optimistic: only add after API call succeeds)
  const handleAddCollection = useCallback(
    async (
      parentScriptId: string,
      name: string,
      numSegments: number,
      parentScriptPosition?: { x: number; y: number }
    ) => {
      setPendingSegmentCollection(prev => ({ ...prev, [parentScriptId]: true }));
      setSyncing(true);
      if (onSyncChange) onSyncChange(true);
      try {
        // Create the collection in backend
        const collection = await createSegmentCollectionMutation.mutateAsync({
          scriptId: parentScriptId,
          name,
        });
        // Create segments in backend
        function random4Digit() {
          return Math.floor(1000 + Math.random() * 9000).toString();
        }
        // Placeholder: simulate AI content generation delay and AI output
        await new Promise(res => setTimeout(res, 1000));
        // Mocked AI output: array of segment texts
        // TODO: Replace this block with actual AI integration
        const aiSegments: string[] = Array.from({ length: numSegments }).map((_, i) => `AI-Segment-${i + 1}`);
        // Create segments in parallel using the AI output
        const createdSegments: Segment[] = await Promise.all(
          aiSegments.map((text, i) =>
            createSegmentMutation.mutateAsync({
              collectionId: collection.id,
              segmentIndex: i,
              text,
            })
          )
        );
        // Add the new collection to state and localStorage only after all API calls succeed
        setCollections((prev) => {
          const updated = {
            ...prev,
            [collection.id]: {
              ...collection,
              parentScriptId,
              segments: createdSegments,
              isSaving: false,
              deleting: false,
              error: null,
            },
          };
          updateCache(updated);
          return updated;
        });
        // Assign a position for the new collection
        setPositions((prev) => {
          const parentPos = parentScriptPosition || { x: 200, y: 200 };
          const offsetX = 380;
          const offsetY = 40 + Object.keys(prev).length * 40;
          const updated = {
            ...prev,
            [collection.id]: { x: parentPos.x + offsetX, y: parentPos.y + offsetY },
          };
          updatePositionsCache(updated);
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
    [organizationId, projectId, onSyncChange, createSegmentCollectionMutation, createSegmentMutation]
  );

  // Edit collection name
  const handleEditCollectionName = useCallback(
    async (colId: string, newName: string) => {
      setCollections((prev) => ({
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
        setCollections((prev) => ({
          ...prev,
          [colId]: {
            ...prev[colId],
            name: newName,
            isSaving: false,
            error: null,
          },
        }));
      } catch (e: any) {
        setCollections((prev) => ({
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
      setCollections((prev) => {
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
        setCollections((prev) => {
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
        setCollections((prev) => {
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
    [onSyncChange, updateSegmentMutation]
  );

  // Delete collection (optimistic)
  const handleDeleteCollection = useCallback(
    async (colId: string) => {
      let prevCol: any;
      setCollections((prev) => {
        prevCol = prev[colId];
        const { [colId]: _, ...rest } = prev;
        updateCache(rest);
        return rest;
      });
      setPositions((prev) => {
        const { [colId]: _, ...rest } = prev;
        updatePositionsCache(rest);
        return rest;
      });
      setSyncing(true);
      try {
        await deleteCollectionMutation.mutateAsync(colId);
        setError(null); // Clear error after successful delete
      } catch (e: any) {
        // Rollback on error
        setCollections((prev) => {
          const updated = {
            ...prev,
            [colId]: {
              ...prevCol,
              deleting: false,
              error: e?.message || "Failed to delete segment collection.",
            },
          };
          updateCache(updated);
          return updated;
        });
        setPositions((prev) => {
          const updated = {
            ...prev,
            [colId]: prevCol && prevCol.position ? prevCol.position : { x: 600, y: 200 },
          };
          updatePositionsCache(updated);
          return updated;
        });
      } finally {
        setSyncing(false);
      }
    },
    [deleteCollectionMutation]
  );

  // Update position of a collection card and cache
  const handleCollectionPositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      updatePositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    collections,
    positions,
    pendingSegmentCollection,
    loading,
    error,
    syncing,
    handleAddCollection,
    handleEditCollectionName,
    handleEditSegmentText,
    handleDeleteCollection,
    handleCollectionPositionChange,
    clearError,
  };
}
