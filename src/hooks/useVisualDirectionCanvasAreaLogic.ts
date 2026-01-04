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
        // Generate visuals with strict 1:1 mapping to segments.
        // We use one AI call per segment (in parallel) to avoid any indexing/misalignment issues.
        const aiVisuals: string[] = await Promise.all(
          contents.map(async (segmentText, i) => {
            try {
              const res = await generateVisualsAI([segmentText]);
              return res?.[0] || "";
            } catch (err: any) {
              console.error("Failed to generate visual for segment", { i, segmentId: segmentIds[i] }, err);
              return "";
            }
          })
        );

        // Create visuals in parallel using the AI output.
        // Store mapping info in Visual.meta so child storyboard sketches can reliably trace their grandparent segment.
        const visuals: Visual[] = await Promise.all(
          aiVisuals.map((aiContent, i) =>
            createVisualMutation.mutateAsync({
              visualSetId: visualSetIdOverride || projectId,
              segmentId: segmentIds[i],
              content: aiContent,
              metadata: {
                parentSegmentCollectionId,
                segmentIndex: i,
                segmentText: contents[i] || "",
              },
            } as any)
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

  // Edit a single visual (by visualId) inside a VisualDirection card.
  const handleEdit = useCallback(
    async (visualId: string, newContent: string) => {
      let directionIdForVisual: string | null = null;

      setDirections((prev) => {
        // Find the direction that contains this visual.
        const directionId =
          Object.keys(prev).find((id) => prev[id]?.visuals?.some((v) => v.id === visualId)) || null;
        directionIdForVisual = directionId;
        if (!directionId) return prev;

        const dir = prev[directionId];
        const visuals = (dir.visuals || []).map((v) => (v.id === visualId ? { ...v, content: newContent } : v));
        const next = {
          ...prev,
          [directionId]: { ...dir, visuals, isSaving: true, error: null },
        };
        updateCache(next);
        return next;
      });

      setSyncing(true);
      try {
        await updateVisualMutation.mutateAsync({
          id: visualId,
          data: { content: newContent },
        });
        if (directionIdForVisual) {
          setDirections((prev) => {
            const dir = prev[directionIdForVisual!];
            if (!dir) return prev;
            const next = { ...prev, [directionIdForVisual!]: { ...dir, isSaving: false, error: null } };
            updateCache(next);
            return next;
          });
        }
      } catch (e: any) {
        if (directionIdForVisual) {
          setDirections((prev) => {
            const dir = prev[directionIdForVisual!];
            if (!dir) return prev;
            const next = {
              ...prev,
              [directionIdForVisual!]: { ...dir, isSaving: false, error: e?.message || "Failed to update visual." },
            };
            updateCache(next);
            return next;
          });
        }
      } finally {
        setSyncing(false);
      }
    },
    [updateVisualMutation]
  );

  // Delete a VisualDirection card (optimistic).
  // IMPORTANT: a VisualDirection card is a *group* of visuals, so we delete ALL of them.
  const handleDelete = useCallback(
    async (visualDirectionId: string) => {
      let prevDirection: VisualDirection | undefined;

      // Optimistic remove from UI
      setDirections((prev) => {
        prevDirection = prev[visualDirectionId];
        const { [visualDirectionId]: _, ...rest } = prev;
        updateCache(rest);
        return rest;
      });
      setPositions((prev) => {
        const { [visualDirectionId]: _, ...rest } = prev;
        updatePositionsCache(rest);
        return rest;
      });

      setSyncing(true);
      try {
        const visuals = prevDirection?.visuals || [];
        await Promise.all(
          visuals
            .map((v) => v?.id)
            .filter(Boolean)
            .map((id) => deleteVisualMutation.mutateAsync(id as string).catch(() => undefined))
        );
        setError(null);
      } catch (e: any) {
        // Rollback on error
        if (prevDirection) {
          setDirections((prev) => {
            const next = {
              ...prev,
              [visualDirectionId]: { ...prevDirection!, deleting: false, error: e?.message || "Failed to delete visual direction." },
            };
            updateCache(next);
            return next;
          });
        }
        setError(e?.message || "Failed to delete visual direction.");
      } finally {
        setSyncing(false);
      }
    },
    [deleteVisualMutation]
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
