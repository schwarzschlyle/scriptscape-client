import { useState, useEffect, useCallback } from "react";
import { useCreateVisual, useUpdateVisual, useDeleteVisual } from "@api/visuals/mutations";
import type { Visual } from "@api/visuals/types";

type VisualDirection = Visual;
type VisualDirectionsState = {
  [id: string]: VisualDirection & {
    parentSegmentCollectionId: string;
    isSaving?: boolean;
    deleting?: boolean;
    error?: string | null;
  };
};
type PositionsState = { [id: string]: { x: number; y: number } };

const getVisualDirectionsCacheKey = (organizationId: string, projectId: string) =>
  `visual-directions-cache-${organizationId}-${projectId}`;
const getVisualDirectionsPositionsKey = (organizationId: string, projectId: string) =>
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
  const [visualDirections, setVisualDirections] = useState<VisualDirectionsState>({});
  const [visualDirectionsPositions, setVisualDirectionsPositions] = useState<PositionsState>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track pending visual direction creation per segment collection
  const [pendingVisualDirection, setPendingVisualDirection] = useState<{ [segmentCollectionId: string]: boolean }>({});

  const createVisualMutation = useCreateVisual();
  const updateVisualMutation = useUpdateVisual();
  const deleteVisualMutation = useDeleteVisual();

  function updateVisualDirectionsCache(directions: VisualDirectionsState) {
    const cacheKey = getVisualDirectionsCacheKey(organizationId, projectId);
    localStorage.setItem(cacheKey, JSON.stringify(directions));
  }

  function updateVisualDirectionsPositionsCache(positions: PositionsState) {
    const positionsKey = getVisualDirectionsPositionsKey(organizationId, projectId);
    localStorage.setItem(positionsKey, JSON.stringify(positions));
  }

  // Load from cache on mount
  useEffect(() => {
    setLoading(true);

    // Visual directions: load from localStorage first (optimistic render)
    const cacheKey = getVisualDirectionsCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setVisualDirections(parsed);
        }
      } catch {}
    }

    // Visual direction positions
    const positionsKey = getVisualDirectionsPositionsKey(organizationId, projectId);
    const cachedPositions = localStorage.getItem(positionsKey);
    if (cachedPositions) {
      try {
        const parsed = JSON.parse(cachedPositions);
        if (parsed && typeof parsed === "object") {
          setVisualDirectionsPositions(parsed);
        }
      } catch {}
    }

    setLoading(false);
  }, [organizationId, projectId]);

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // Add a new visual direction (non-optimistic: only add after API call succeeds)
  const handleAddVisualDirection = useCallback(
    async (parentSegmentCollectionId: string, content: string, position?: { x: number; y: number }) => {
      setPendingVisualDirection(prev => ({ ...prev, [parentSegmentCollectionId]: true }));
      setSyncing(true);
      if (onSyncChange) onSyncChange(true);
      try {
        // TODO: [AI INTEGRATION] The following random string will be replaced by AI-generated content from the API.
        const randomId = Math.floor(1000 + Math.random() * 9000).toString();
        const generatedContent = content || `Generated-VisualDirection-${randomId}`;
        // Create the visual direction in backend
        const visual = await createVisualMutation.mutateAsync({
          visualSetId: projectId,
          segmentId: parentSegmentCollectionId,
          content: generatedContent,
        });
        // Add the new visual direction to state and localStorage only after API call succeeds
        setVisualDirections((prev) => {
          const updated = {
            ...prev,
            [visual.id]: {
              ...visual,
              parentSegmentCollectionId,
              isSaving: false,
              deleting: false,
              error: null,
            },
          };
          updateVisualDirectionsCache(updated);
          return updated;
        });
        // Assign a position for the new visual direction
        if (position) {
          setVisualDirectionsPositions((prev) => {
            const updated = {
              ...prev,
              [visual.id]: position,
            };
            updateVisualDirectionsPositionsCache(updated);
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
    [organizationId, projectId, createVisualMutation]
  );

  // Edit visual direction content
  const handleEditVisualDirectionContent = useCallback(
    async (visualId: string, newContent: string) => {
      setVisualDirections((prev) => ({
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
        setVisualDirections((prev) => ({
          ...prev,
          [visualId]: {
            ...prev[visualId],
            content: newContent,
            isSaving: false,
            error: null,
          },
        }));
      } catch (e: any) {
        setVisualDirections((prev) => ({
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

  // Delete visual direction (optimistic)
  const handleDeleteVisualDirection = useCallback(
    async (visualId: string) => {
      let prevVisual: any;
      setVisualDirections((prev) => {
        prevVisual = prev[visualId];
        const { [visualId]: _, ...rest } = prev;
        updateVisualDirectionsCache(rest);
        return rest;
      });
      setVisualDirectionsPositions((prev) => {
        const { [visualId]: _, ...rest } = prev;
        updateVisualDirectionsPositionsCache(rest);
        return rest;
      });
      setSyncing(true);
      try {
        await deleteVisualMutation.mutateAsync(visualId);
        setError(null); // Clear error after successful delete
      } catch (e: any) {
        // Rollback on error
        setVisualDirections((prev) => {
          const updated = {
            ...prev,
            [visualId]: {
              ...prevVisual,
              deleting: false,
              error: e?.message || "Failed to delete visual direction.",
            },
          };
          updateVisualDirectionsCache(updated);
          return updated;
        });
        setVisualDirectionsPositions((prev) => {
          const updated = {
            ...prev,
            [visualId]: prevVisual && prevVisual.position ? prevVisual.position : { x: 600, y: 200 },
          };
          updateVisualDirectionsPositionsCache(updated);
          return updated;
        });
      } finally {
        setSyncing(false);
      }
    },
    [deleteVisualMutation, organizationId, projectId]
  );

  // Update position of a visual direction card and cache
  const handleVisualDirectionPositionChange = useCallback((id: string, x: number, y: number) => {
    setVisualDirectionsPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      updateVisualDirectionsPositionsCache(next);
      return next;
    });
  }, [organizationId, projectId]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    visualDirections,
    visualDirectionsPositions,
    loading,
    error,
    syncing,
    pendingVisualDirection,
    handleAddVisualDirection,
    handleEditVisualDirectionContent,
    handleDeleteVisualDirection,
    handleVisualDirectionPositionChange,
    clearError,
  };
}
