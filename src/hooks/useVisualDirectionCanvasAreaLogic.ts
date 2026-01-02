import { useState, useEffect, useCallback } from "react";
import { useCreateVisual, useUpdateVisual, useDeleteVisual } from "@api/visuals/mutations";
import type { Visual } from "@api/visuals/types";
import { useGenerateScriptVisualsAI } from "./useGenerateScriptVisualsAI";

type VisualDirection = {
  id: string;
  parentSegmentCollectionId: string;
  visuals: Visual[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
};
type DirectionsState = {
  [visualDirectionId: string]: VisualDirection;
};
type PositionsState = { [id: string]: { x: number; y: number } };

const getCacheKey = (organizationId: string, projectId: string) =>
  `visual-directions-cache-${organizationId}-${projectId}`;
const getPositionsKey = (organizationId: string, projectId: string) =>
  `visual-directions-positions-${organizationId}-${projectId}`;

export interface UseVisualDirectionCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

export function useVisualDirectionCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseVisualDirectionCanvasAreaLogicProps) {
  const [directions, setDirections] = useState<DirectionsState>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [pendingVisualDirection, setPendingVisualDirection] = useState<{ [segmentCollectionId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const createVisualMutation = useCreateVisual();
  const updateVisualMutation = useUpdateVisual();
  const deleteVisualMutation = useDeleteVisual();
  const { generate: generateVisualsAI } = useGenerateScriptVisualsAI();

  function updateCache(directions: DirectionsState) {
    const cacheKey = getCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(directions));
  }

  function updatePositionsCache(positions: PositionsState) {
    const positionsKey = getPositionsKey(organizationId, projectId);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
  }

  // Load from cache on mount
  useEffect(() => {
    setLoading(true);

    // Directions: load from localStorage first (optimistic render)
    const cacheKey = getCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setDirections(parsed);
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

  // Add a new direction (non-optimistic: only add after API call succeeds)
  const handleAdd = useCallback(
    async (
      parentSegmentCollectionId: string,
      segmentIds: string[],
      contents: string[],
      position?: { x: number; y: number },
      visualSetIdOverride?: string
    ) => {
      setPendingVisualDirection(prev => ({ ...prev, [parentSegmentCollectionId]: true }));
      setSyncing(true);
      if (onSyncChange) onSyncChange(true);
      try {
        // Use AI hook to generate visuals
        let aiVisuals: string[] = [];
        try {
          console.log("Calling generateVisualsAI with:", contents);
          aiVisuals = await generateVisualsAI(contents);
          console.log("AI visuals generated:", aiVisuals);
        } catch (err: any) {
          setError(err?.message || "Failed to generate visuals from AI.");
          throw err;
        }
        // Create visuals in parallel using the AI output
        const visuals: Visual[] = await Promise.all(
          aiVisuals.map((aiContent, i) =>
            createVisualMutation.mutateAsync({
              visualSetId: visualSetIdOverride || projectId,
              segmentId: segmentIds[i],
              content: aiContent,
            })
          )
        );
        // Add the new direction (with all visuals) to state and localStorage only after all API calls succeed
        const newId = visuals[0]?.id || `${parentSegmentCollectionId}-visual-direction-${Date.now()}`;
        setDirections((prev) => {
          const updated = {
            ...prev,
            [newId]: {
              id: newId,
              parentSegmentCollectionId,
              visuals,
              title: "Visual Direction",
              isSaving: false,
              deleting: false,
              error: null,
            },
          };
          updateCache(updated);
          return updated;
        });
        // Assign a position for the new direction card
        if (position) {
          setPositions((prev) => {
            const updated = {
              ...prev,
              [newId]: position,
            };
            updatePositionsCache(updated);
            return updated;
          });
        }
      } catch (e: any) {
        setError(e?.message || "Failed to create visual direction.");
      } finally {
        setPendingVisualDirection(prev => ({ ...prev, [parentSegmentCollectionId]: false }));
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [organizationId, projectId, createVisualMutation, onSyncChange, generateVisualsAI]
  );

  // Edit direction content
  const handleEdit = useCallback(
    async (visualId: string, newContent: string) => {
      setDirections((prev) => ({
        ...prev,
        [visualId]: {
          ...prev[visualId],
          content: newContent,
          isSaving: true,
          error: null,
        },
      }));
      setSyncing(true);
      try {
        await updateVisualMutation.mutateAsync({
          id: visualId,
          data: { content: newContent },
        });
        setDirections((prev) => ({
          ...prev,
          [visualId]: {
            ...prev[visualId],
            content: newContent,
            isSaving: false,
            error: null,
          },
        }));
      } catch (e: any) {
        setDirections((prev) => ({
          ...prev,
          [visualId]: {
            ...prev[visualId],
            isSaving: false,
            error: e?.message || "Failed to update visual direction.",
          },
        }));
      } finally {
        setSyncing(false);
      }
    },
    [updateVisualMutation]
  );

  // Delete direction (optimistic)
  const handleDelete = useCallback(
    async (visualId: string) => {
      let prevDirection: any;
      setDirections((prev) => {
        prevDirection = prev[visualId];
        const { [visualId]: _, ...rest } = prev;
        updateCache(rest);
        return rest;
      });
      setPositions((prev) => {
        const { [visualId]: _, ...rest } = prev;
        updatePositionsCache(rest);
        return rest;
      });
      setSyncing(true);
      try {
        await deleteVisualMutation.mutateAsync(visualId);
        setError(null); // Clear error after successful delete
      } catch (e: any) {
        // Rollback on error
        setDirections((prev) => {
          const updated = {
            ...prev,
            [visualId]: {
              ...prevDirection,
              deleting: false,
              error: e?.message || "Failed to delete visual direction.",
            },
          };
          updateCache(updated);
          return updated;
        });
        setPositions((prev) => {
          const updated = {
            ...prev,
            [visualId]: prevDirection && prevDirection.position ? prevDirection.position : { x: 600, y: 200 },
          };
          updatePositionsCache(updated);
          return updated;
        });
      } finally {
        setSyncing(false);
      }
    },
    [deleteVisualMutation, organizationId, projectId]
  );

  // Update position of a direction card and cache
  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      updatePositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    directions,
    positions,
    pendingVisualDirection,
    loading,
    error,
    syncing,
    handleAdd,
    handleEdit,
    handleDelete,
    handlePositionChange,
    clearError,
  };
}
