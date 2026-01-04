import { useState, useEffect, useCallback } from "react";
import {
  useCreateSegmentCollection,
  useUpdateSegmentCollection,
  useDeleteSegmentCollection,
} from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment } from "@api/segments/mutations";
import { useGenerateScriptSegmentsAI } from "./useGenerateScriptSegmentsAI";
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
  getScriptById?: (id: string) => { id: string; name: string; text: string } | undefined;
}

export function useSegmentsCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
  getScriptById,
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
  const { generate: generateSegmentsAI } = useGenerateScriptSegmentsAI();

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
        // Create segments in backend using AI API
        // Get parent script text
        let scriptText = "";
        if (getScriptById) {
          const script = getScriptById(parentScriptId);
          scriptText = script?.text || "";
        }
        if (!scriptText) {
          setError("Parent script text not found.");
          throw new Error("Parent script text not found.");
        }
        // Use AI hook to generate segments
        let aiSegments: string[] = [];
        try {
          console.log("Calling generateSegmentsAI with:", { scriptText, numSegments });
          aiSegments = await generateSegmentsAI(scriptText, numSegments);
          console.log("AI segments generated:", aiSegments);
        } catch (err: any) {
          setError(err?.message || "Failed to generate segments from AI.");
          throw err;
        }
        // Create segments in parallel using the AI output
        const createdSegments: Segment[] = await Promise.all(
          aiSegments.map(async (text, i) => {
            try {
              const result = await createSegmentMutation.mutateAsync({
                collectionId: collection.id,
                segmentIndex: i,
                text,
              });
              // Debug: log successful segment creation
              console.log("Created segment:", result);
              return result;
            } catch (err) {
              // Debug: log error
              console.error("Error creating segment:", err);
              throw err;
            }
          })
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

  /**
   * Cascade delete for an entire script:
   * - delete all segment collections for that script (backend should cascade segments)
   * - remove from local state + positions
   *
   * NOTE: VisualDirections + Storyboards are handled in their respective hooks,
   * but in the current architecture those are visual-id based and live in CanvasArea.
   * CanvasArea will coordinate those additional cascades.
   */
  const handleDeleteCollectionsByScriptId = useCallback(
    async (scriptId: string) => {
      const colIds = Object.values(collections)
        .filter((c: any) => c?.parentScriptId === scriptId)
        .map((c: any) => c.id)
        .filter(Boolean);

      // Optimistic UI removal
      if (colIds.length) {
        setCollections((prev) => {
          const next = { ...prev };
          colIds.forEach((id) => {
            delete (next as any)[id];
          });
          updateCache(next as any);
          return next as any;
        });
        setPositions((prev) => {
          const next = { ...prev };
          colIds.forEach((id) => {
            delete (next as any)[id];
          });
          updatePositionsCache(next as any);
          return next as any;
        });
      }

      // Backend deletes
      await Promise.all(colIds.map((id) => deleteCollectionMutation.mutateAsync(id).catch(() => undefined)));
    },
    [collections, deleteCollectionMutation]
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
    handleDeleteCollectionsByScriptId,
    handleCollectionPositionChange,
    clearError,
  };
}
