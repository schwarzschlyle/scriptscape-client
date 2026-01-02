import { useCallback, useEffect, useState } from "react";
import type { Storyboard } from "@api/storyboards/types";
import type { StoryboardSketch } from "@api/storyboard_sketches/types";
import {
  createStoryboard,
  updateStoryboard,
  deleteStoryboard,
  getStoryboards,
} from "@api/storyboards/queries";
import {
  createStoryboardSketch,
  deleteStoryboardSketch,
  getStoryboardSketches,
} from "@api/storyboard_sketches/queries";
import { useGenerateScriptSketchesAI } from "./useGenerateScriptSketchesAI";

type StoryboardCard = Storyboard & {
  parentVisualDirectionId: string;
  sketches: StoryboardSketch[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
};

type StoryboardsState = {
  [storyboardId: string]: StoryboardCard;
};

type PositionsState = { [id: string]: { x: number; y: number } };
const getPositionsKey = (organizationId: string, projectId: string) =>
  `storyboards-positions-${organizationId}-${projectId}`;

export interface UseStoryboardCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  /** Visual set ids currently present on the canvas (derived from VisualDirection visuals). */
  visualSetIds: string[];
  onSyncChange?: (syncing: boolean) => void;
}

/**
 * Canvas-local state manager for storyboard sketch cards.
 * Mirrors patterns from useSegmentsCanvasAreaLogic / useVisualDirectionCanvasAreaLogic:
 * - localStorage cache-first render
 * - position persistence
 * - non-optimistic create (adds to state after API succeeds)
 * - optimistic update/delete
 */
export function useStoryboardCanvasAreaLogic({
  organizationId,
  projectId,
  visualSetIds,
  onSyncChange,
}: UseStoryboardCanvasAreaLogicProps) {
  const [storyboards, setStoryboards] = useState<StoryboardsState>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [pendingStoryboard, setPendingStoryboard] = useState<{ [parentVisualDirectionId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { generate: generateSketchAI } = useGenerateScriptSketchesAI();

  function updatePositionsCache(next: PositionsState) {
    localStorage.setItem(getPositionsKey(organizationId, projectId), JSON.stringify(next));
  }

  // Load positions from cache first (DO NOT cache sketches/images; they exceed storage quota)
  useEffect(() => {
    setLoading(true);

    const positionsKey = getPositionsKey(organizationId, projectId);
    const cachedPositions = localStorage.getItem(positionsKey);
    if (cachedPositions) {
      try {
        const parsed = JSON.parse(cachedPositions);
        if (parsed && typeof parsed === "object") setPositions(parsed);
      } catch {}
    }

    setLoading(false);
  }, [organizationId, projectId]);

  // Load storyboards + sketches from backend whenever visible visual set ids change.
  // This keeps data canonical and avoids localStorage quota issues.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!visualSetIds || visualSetIds.length === 0) return;
      setLoading(true);
      try {
        const boardsByVisualSet = await Promise.all(
          visualSetIds.map(async (vsId) => ({ vsId, boards: await getStoryboards(vsId) }))
        );

        const nextStoryboards: StoryboardsState = {};
        await Promise.all(
          boardsByVisualSet.flatMap(({ boards }) =>
            (boards || []).map(async (b) => {
              const parentVisualDirectionId = (b.meta as any)?.parentVisualDirectionId || "";
              const sketches = await getStoryboardSketches(b.id).catch(() => []);
              nextStoryboards[b.id] = {
                ...b,
                parentVisualDirectionId,
                sketches,
                isSaving: false,
                deleting: false,
                error: null,
              };
            })
          )
        );

        if (!mounted) return;
        setStoryboards(nextStoryboards);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load storyboards.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [visualSetIds.join("|"), organizationId, projectId]);

  useEffect(() => {
    onSyncChange?.(syncing);
  }, [syncing, onSyncChange]);

  const handleAddStoryboardWithSketches = useCallback(
    async (
      parentVisualDirectionId: string,
      visualSetId: string,
      visualDirections: { id?: string; content: string }[],
      instructions: string | undefined,
      position?: { x: number; y: number }
    ) => {
      setPendingStoryboard((prev) => ({ ...prev, [parentVisualDirectionId]: true }));
      setSyncing(true);
      onSyncChange?.(true);
      setError(null);
      try {
        const storyboard = await createStoryboard(visualSetId, {
          name: "Storyboard",
          description: "",
          meta: {
            parentVisualDirectionId,
            instructions: instructions || "",
          },
        });

        // Generate images in parallel
        const images: string[] = await Promise.all(
          visualDirections.map(async (vd) => {
            const dir = vd.content || "";
            if (!dir.trim()) return "";
            const imageBase64 = await generateSketchAI(dir, instructions || "");
            return imageBase64;
          })
        );

        // Persist storyboard_sketches in parallel
        const createdSketches: StoryboardSketch[] = await Promise.all(
          images.map(async (image_base64, idx) => {
            const name = `Sketch ${idx + 1}`;
            // If generation failed for a particular direction, still store an empty marker? For now, skip.
            if (!image_base64) {
              return {
                id: `temp-sketch-${idx}-${Date.now()}`,
                storyboardId: storyboard.id,
                name,
                image_base64: "",
                meta: { skipped: true },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as any;
            }
            return await createStoryboardSketch(storyboard.id, {
              name,
              image_base64,
              meta: {
                parentVisualDirectionId,
                visualDirectionIndex: idx,
              },
            });
          })
        );

        const card: StoryboardCard = {
          ...storyboard,
          parentVisualDirectionId,
          sketches: createdSketches.filter((s) => !!s?.image_base64),
          isSaving: false,
          deleting: false,
          error: null,
        };

        setStoryboards((prev) => ({ ...prev, [storyboard.id]: card }));

        if (position) {
          setPositions((prev) => {
            const next = { ...prev, [storyboard.id]: position };
            updatePositionsCache(next);
            return next;
          });
        }
      } catch (e: any) {
        setError(e?.message || "Failed to generate storyboard sketches.");
      } finally {
        setPendingStoryboard((prev) => ({ ...prev, [parentVisualDirectionId]: false }));
        setSyncing(false);
        onSyncChange?.(false);
      }
    },
    [onSyncChange, generateSketchAI]
  );

  const handleEditStoryboardName = useCallback(
    async (storyboardId: string, newName: string) => {
      setStoryboards((prev) => {
        const sb = prev[storyboardId];
        if (!sb) return prev;
        const next = {
          ...prev,
          [storyboardId]: { ...sb, name: newName, isSaving: true, error: null },
        };
        return next;
      });
      setSyncing(true);
      try {
        await updateStoryboard(storyboardId, { name: newName });
        setStoryboards((prev) => {
          const sb = prev[storyboardId];
          if (!sb) return prev;
          const next = {
            ...prev,
            [storyboardId]: { ...sb, name: newName, isSaving: false, error: null },
          };
          return next;
        });
      } catch (e: any) {
        setStoryboards((prev) => {
          const sb = prev[storyboardId];
          if (!sb) return prev;
          const next = {
            ...prev,
            [storyboardId]: { ...sb, isSaving: false, error: e?.message || "Failed to update storyboard." },
          };
          return next;
        });
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  const handleDeleteStoryboard = useCallback(async (storyboardId: string) => {
    let prevStoryboard: StoryboardCard | undefined;

    setStoryboards((prev) => {
      prevStoryboard = prev[storyboardId];
      const { [storyboardId]: _, ...rest } = prev;
      return rest as any;
    });
    setPositions((prev) => {
      const { [storyboardId]: _, ...rest } = prev;
      updatePositionsCache(rest);
      return rest;
    });

    setSyncing(true);
    try {
      // best-effort: delete sketches first (backend cascade might handle, but keep parity)
      if (prevStoryboard?.sketches?.length) {
        await Promise.all(
          prevStoryboard.sketches.map((s) =>
            s?.id ? deleteStoryboardSketch(s.id).catch(() => undefined) : Promise.resolve(undefined)
          )
        );
      }
      await deleteStoryboard(storyboardId);
      setError(null);
    } catch (e: any) {
      // rollback
      if (prevStoryboard) {
        setStoryboards((prev) => {
          const next = { ...prev, [storyboardId]: prevStoryboard as any };
          return next;
        });
      }
      setError(e?.message || "Failed to delete storyboard.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleStoryboardPositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setPositions((prev) => {
        const next = { ...prev, [id]: { x, y } };
        updatePositionsCache(next);
        return next;
      });
    },
    [organizationId, projectId]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    storyboards,
    positions,
    pendingStoryboard,
    loading,
    error,
    syncing,
    handleAddStoryboardWithSketches,
    handleEditStoryboardName,
    handleDeleteStoryboard,
    handleStoryboardPositionChange,
    clearError,
  };
}
