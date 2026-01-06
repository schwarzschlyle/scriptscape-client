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
  getStoryboardSketches,
  deleteStoryboardSketch,
} from "@api/storyboard_sketches/queries";
import { useGenerateScriptSketchesAI } from "./useGenerateScriptSketchesAI";
import { idbDel } from "../utils/indexedDb";

type StoryboardCard = Storyboard & {
  parentVisualDirectionId: string;
  sketches: StoryboardSketch[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  loadingSketches?: boolean;
};

type StoryboardsState = {
  [storyboardId: string]: StoryboardCard;
};

type PositionsState = { [id: string]: { x: number; y: number } };
const getCacheKey = (organizationId: string, projectId: string) =>
  `storyboards-cache-${organizationId}-${projectId}`;
const getPositionsKey = (organizationId: string, projectId: string) =>
  `storyboards-positions-${organizationId}-${projectId}`;

export interface UseStoryboardCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  /** Visual set ids currently present on the canvas (derived from VisualDirection visuals). */
  visualSetIds: string[];
  onSyncChange?: (syncing: boolean) => void;
  /** Optional lookup for the parent visual direction position to seed default storyboard positions */
  getVisualDirectionPosition?: (visualDirectionId: string) => { x: number; y: number } | undefined;
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
  getVisualDirectionPosition,
}: UseStoryboardCanvasAreaLogicProps) {
  const [storyboards, setStoryboards] = useState<StoryboardsState>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [pendingStoryboard, setPendingStoryboard] = useState<{ [parentVisualDirectionId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { generate: generateSketchAI } = useGenerateScriptSketchesAI();

  function updateCache(next: StoryboardsState) {
    // Cache the storyboard container only (no sketches/image_base64)
    const lite: Record<string, any> = {};
    Object.entries(next).forEach(([id, sb]) => {
      lite[id] = {
        id: sb.id,
        visualSetId: sb.visualSetId,
        name: sb.name,
        description: sb.description,
        meta: sb.meta,
        parentVisualDirectionId: sb.parentVisualDirectionId,
      };
    });
    try {
      localStorage.setItem(getCacheKey(organizationId, projectId), JSON.stringify(lite));
    } catch {
      // ignore quota errors; base64 is not cached, but user may have small quota
    }
  }

  function updatePositionsCache(next: PositionsState) {
    localStorage.setItem(getPositionsKey(organizationId, projectId), JSON.stringify(next));
  }

  // Load storyboards (container only) + positions from cache first
  useEffect(() => {
    setLoading(true);

    const cacheKey = getCacheKey(organizationId, projectId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          const fromCache: StoryboardsState = {};
          Object.values(parsed).forEach((sb: any) => {
            if (!sb?.id) return;
            fromCache[sb.id] = {
              ...(sb as Storyboard),
              parentVisualDirectionId: sb.parentVisualDirectionId || (sb.meta as any)?.parentVisualDirectionId || "",
              sketches: [],
              isSaving: false,
              deleting: false,
              error: null,
              loadingSketches: true,
            };
          });
          setStoryboards(fromCache);
        }
      } catch {}
    }

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

  // Ensure a default position exists for any storyboard that doesn't have one yet.
  // This is critical for connector visibility, and mirrors the behavior of scripts.
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.values(storyboards).forEach((sb) => {
        if (!sb?.id) return;
        if (!next[sb.id]) {
          // Default placement: spawn near parent visual direction for parity.
          const parentPos = getVisualDirectionPosition?.(sb.parentVisualDirectionId);
          const offsetX = 380;
          const offsetY = 120;
          next[sb.id] = parentPos
            ? { x: parentPos.x + offsetX, y: parentPos.y + offsetY }
            : { x: 1200, y: 300 };
          changed = true;
        }
      });
      if (changed) {
        updatePositionsCache(next);
        return next;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(storyboards).join("|"), getVisualDirectionPosition]);

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
              nextStoryboards[b.id] = {
                ...b,
                parentVisualDirectionId,
                sketches: [],
                isSaving: false,
                deleting: false,
                error: null,
                loadingSketches: true,
              };
            })
          )
        );

        if (!mounted) return;
        setStoryboards((prev) => {
          // IMPORTANT: preserve already-loaded sketches from IndexedDB.
          // Otherwise, when storyboards refresh from backend, it replaces the storyboard entry
          // (same id) and can clear `sketches` without re-triggering the cache-load effect.
          const merged: StoryboardsState = { ...prev };
          Object.entries(nextStoryboards).forEach(([id, incoming]) => {
            const existing = prev[id];
            merged[id] = {
              ...incoming,
              sketches: existing?.sketches?.length ? existing.sketches : incoming.sketches,
              loadingSketches: existing?.sketches?.length ? false : incoming.loadingSketches,
              error: incoming.error ?? existing?.error ?? null,
            } as any;
          });

          const next = merged;
          updateCache(next);
          return next;
        });
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

  // Fetch storyboard sketches from backend on every refresh.
  // No caching: images are stored in S3 and served via presigned URLs.
  useEffect(() => {
    let mounted = true;
    const storyboardIds = Object.keys(storyboards);
    if (storyboardIds.length === 0) return;

    (async () => {
      await Promise.all(
        storyboardIds.map(async (id) => {
          try {
            const sketches = await getStoryboardSketches(id);
            if (!mounted) return;
            setStoryboards((prev) => {
              const sb = prev[id];
              if (!sb) return prev;
              return {
                ...prev,
                [id]: { ...sb, sketches, loadingSketches: false },
              };
            });
          } catch (e: any) {
            if (!mounted) return;
            setStoryboards((prev) => {
              const sb = prev[id];
              if (!sb) return prev;
              return {
                ...prev,
                [id]: {
                  ...sb,
                  sketches: [],
                  loadingSketches: false,
                  error: e?.message || "Failed to load storyboard sketches.",
                },
              };
            });
          }
        })
      );
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(storyboards).join("|")]);

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
        const visualMeta = (visualDirections || []).map((v: any, idx: number) => {
          const segmentId = v?.segmentId || v?.segment_id || v?.meta?.segmentId || v?.meta?.segment_id;
          const segmentText = v?.meta?.segmentText || v?.meta?.segment_text || "";
          return {
            index: idx,
            visualId: v?.id,
            segmentId,
            segmentText,
          };
        });

        const storyboard = await createStoryboard(visualSetId, {
          name: "Storyboard Sketches",
          description: "",
          meta: {
            parentVisualDirectionId,
            instructions: instructions || "",
            // mapping for traceability
            visuals: visualMeta,
          },
        });

        // Generate images in parallel
        const images: string[] = await Promise.all(
          visualDirections.map(async (vd) => {
            const dir = (vd as any)?.content || "";
            if (!dir.trim()) return "";
            const imageBase64 = await generateSketchAI(dir, instructions || "");
            return imageBase64;
          })
        );

        // Persist storyboard_sketches in parallel
        const createdSketches: StoryboardSketch[] = await Promise.all(
          images.map(async (image_base64, idx) => {
            const name = `Sketch ${idx + 1}`;
            const meta = visualMeta[idx] || { index: idx };
            // If generation failed for a particular direction, still store an empty marker? For now, skip.
            if (!image_base64) {
              return {
                id: `temp-sketch-${idx}-${Date.now()}`,
                storyboardId: storyboard.id,
                name,
                image_url: "",
                s3_key: "",
                meta: { ...meta, skipped: true },
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
                ...meta,
              },
            });
          })
        );

        const card: StoryboardCard = {
          ...storyboard,
          parentVisualDirectionId,
          sketches: createdSketches.filter((s) => !!(s as any)?.image_url),
          isSaving: false,
          deleting: false,
          error: null,
          loadingSketches: false,
        };

        setStoryboards((prev) => {
          const next = { ...prev, [storyboard.id]: card };
          updateCache(next);
          return next;
        });

        // No image caching: images are in S3.

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
        updateCache(next);
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
          updateCache(next);
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
          updateCache(next);
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
      updateCache(rest as any);
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
      // best-effort remove legacy IDB cache
      await idbDel(`storyboard-sketches:${storyboardId}`).catch(() => undefined);
      setError(null);
    } catch (e: any) {
      // rollback
      if (prevStoryboard) {
        setStoryboards((prev) => {
          const next = { ...prev, [storyboardId]: prevStoryboard as any };
          updateCache(next);
          return next;
        });
      }
      setError(e?.message || "Failed to delete storyboard.");
    } finally {
      setSyncing(false);
    }
  }, []);

  /** Cascade delete storyboards that belong to a given parentVisualDirectionId. */
  const handleDeleteStoryboardsByParentVisualDirectionId = useCallback(
    async (parentVisualDirectionId: string) => {
      const boards = Object.values(storyboards).filter((sb) => sb.parentVisualDirectionId === parentVisualDirectionId);
      const ids = boards.map((b) => b.id).filter(Boolean);
      await Promise.all(ids.map((id) => handleDeleteStoryboard(id).catch(() => undefined)));
    },
    [storyboards, handleDeleteStoryboard]
  );

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
    handleDeleteStoryboardsByParentVisualDirectionId,
    handleStoryboardPositionChange,
    clearError,
  };
}
