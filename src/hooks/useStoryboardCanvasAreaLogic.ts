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
import { idbDel, idbGet, idbSet } from "../utils/indexedDb";
import { addAiJob, listAiJobs, pruneAiJobs, removeAiJob, removeAiJobsWhere } from "../utils/aiJobPersistence";
import { ReconnectingWebSocket } from "../utils/websocket";
import { buildWsUrl } from "../utils/wsUrl";

type CachedStoryboardSketch = {
  id: string;
  storyboardId: string;
  name: string;
  s3_key: string;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

const getSketchesCacheKey = (storyboardId: string) => `storyboard-sketches:${storyboardId}`;

function sketchesToCachePayload(sketches: StoryboardSketch[]): CachedStoryboardSketch[] {
  return (sketches || [])
    .filter((s) => !!s?.id)
    .map((s) => ({
      id: s.id,
      storyboardId: s.storyboardId,
      name: s.name,
      s3_key: (s as any).s3_key || "",
      meta: s.meta,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
}

function cachePayloadToSketches(payload: CachedStoryboardSketch[]): StoryboardSketch[] {
  return (payload || []).map((p) =>
    ({
      id: p.id,
      storyboardId: p.storyboardId,
      name: p.name,
      s3_key: p.s3_key,
      // IMPORTANT: do not cache image bytes or presigned URLs.
      // On refresh we always fetch fresh presigned URLs from the API (S3-backed).
      image_url: "",
      meta: p.meta,
      createdAt: p.createdAt || "",
      updatedAt: p.updatedAt || "",
    }) as any
  );
}

function sortSketchesByVisualDirectionIndex(sketches: StoryboardSketch[]) {
  const getIdx = (s: any) =>
    (s?.meta as any)?.visualDirectionIndex ??
    (s?.meta as any)?.index ??
    Number.MAX_SAFE_INTEGER;
  return [...(sketches || [])].sort((a: any, b: any) => getIdx(a) - getIdx(b));
}

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
  /** Child storyboard-card generating state (orange dot). */
  const [generatingStoryboards, setGeneratingStoryboards] = useState<{ [storyboardId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent duplicate websocket attachments for the same AI job.
  // Without this, rerenders/strict-mode can lead to repeated POST /storyboard-sketches.
  const attachedJobsRef = useState(() => new Set<string>())[0];

  // Track how many sketch jobs are outstanding per storyboard.
  // When the count reaches 0, we clear both parent pending + child generating.
  const storyboardOutstandingRef = useState(() => new Map<string, { parentId: string; remaining: number }>())[0];

  // note: we start jobs directly via fetch() to enable persistence/resume

  const startSketchJob = useCallback(async (visual_direction: string, instructions: string) => {
    const aiApiUrl = import.meta.env.VITE_AI_API_URL;
    const resp = await fetch(`${aiApiUrl}/run-generate-storyboard-sketch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visual_direction, instructions }),
    });
    if (!resp.ok) throw new Error("Failed to start storyboard sketch generation.");
    const data = await resp.json();
    return data as { job_id: string };
  }, []);

  const attachToSketchJob = useCallback(
    (
      jobId: string,
      storyboardId: string,
      _parentVisualDirectionId: string,
      idx: number,
      name: string,
      meta: Record<string, any>
    ) => {
      if (attachedJobsRef.has(jobId)) return;
      attachedJobsRef.add(jobId);

      const wsUrl = buildWsUrl(`/ws/generate-storyboard-sketch-result/${jobId}`);

      const ws = new ReconnectingWebSocket(wsUrl);
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(String(event.data));
          // Keepalive / progress
          if (data.status === "pending") return;
          if (data.status === "done" && typeof data.image_base64 === "string") {
            // Guard against duplicate done messages / duplicate sockets.
            if (!attachedJobsRef.has(jobId)) return;

            const created = await createStoryboardSketch(storyboardId, {
              name,
              image_base64: data.image_base64,
              meta,
            });

            setStoryboards((prev) => {
              const sb = prev[storyboardId];
              if (!sb) return prev;
              const sketches = [...(sb.sketches || [])];
              const existingIdx = sketches.findIndex((s: any) => (s.meta as any)?.visualDirectionIndex === idx);
              if (existingIdx >= 0) sketches[existingIdx] = created as any;
              else sketches.push(created as any);
              const nextSketches = sortSketchesByVisualDirectionIndex(sketches as any);
              const next = { ...prev, [storyboardId]: { ...sb, sketches: nextSketches, loadingSketches: false } };
              updateCache(next);
              idbSet(getSketchesCacheKey(storyboardId), sketchesToCachePayload(nextSketches)).catch(() => undefined);
              return next;
            });

            removeAiJob("storyboard_sketch", jobId);
            attachedJobsRef.delete(jobId);

            // Decrement outstanding job count for this storyboard; clear generating states when done.
            const rec = storyboardOutstandingRef.get(storyboardId);
            if (rec) {
              rec.remaining = Math.max(0, rec.remaining - 1);
              storyboardOutstandingRef.set(storyboardId, rec);
              if (rec.remaining === 0) {
                setGeneratingStoryboards((prev) => {
                  const next = { ...prev };
                  delete next[storyboardId];
                  return next;
                });
                setPendingStoryboard((prev) => ({ ...prev, [rec.parentId]: false }));
                storyboardOutstandingRef.delete(storyboardId);

                // Mark the storyboard as no longer saving once ALL sketches have resolved.
                setStoryboards((prev) => {
                  const sb = prev[storyboardId];
                  if (!sb) return prev;
                  const next = { ...prev, [storyboardId]: { ...sb, isSaving: false } as any };
                  updateCache(next);
                  return next;
                });
              }
            }

            ws.disableReconnect();
            ws.close();
          } else if (data.status === "error") {
            removeAiJob("storyboard_sketch", jobId);
            attachedJobsRef.delete(jobId);

            const rec = storyboardOutstandingRef.get(storyboardId);
            if (rec) {
              rec.remaining = Math.max(0, rec.remaining - 1);
              storyboardOutstandingRef.set(storyboardId, rec);
              if (rec.remaining === 0) {
                setGeneratingStoryboards((prev) => {
                  const next = { ...prev };
                  delete next[storyboardId];
                  return next;
                });
                setPendingStoryboard((prev) => ({ ...prev, [rec.parentId]: false }));
                storyboardOutstandingRef.delete(storyboardId);

                setStoryboards((prev) => {
                  const sb = prev[storyboardId];
                  if (!sb) return prev;
                  const next = { ...prev, [storyboardId]: { ...sb, isSaving: false } as any };
                  updateCache(next);
                  return next;
                });
              }
            }

            ws.disableReconnect();
            ws.close();
          }
        } catch {
          removeAiJob("storyboard_sketch", jobId);
          attachedJobsRef.delete(jobId);

          const rec = storyboardOutstandingRef.get(storyboardId);
          if (rec) {
            rec.remaining = Math.max(0, rec.remaining - 1);
            storyboardOutstandingRef.set(storyboardId, rec);
            if (rec.remaining === 0) {
              setGeneratingStoryboards((prev) => {
                const next = { ...prev };
                delete next[storyboardId];
                return next;
              });
              setPendingStoryboard((prev) => ({ ...prev, [rec.parentId]: false }));
              storyboardOutstandingRef.delete(storyboardId);

              setStoryboards((prev) => {
                const sb = prev[storyboardId];
                if (!sb) return prev;
                const next = { ...prev, [storyboardId]: { ...sb, isSaving: false } as any };
                updateCache(next);
                return next;
              });
            }
          }

          ws.disableReconnect();
          ws.close();
        }
      };

      // Hard timeout so a stuck job doesn't keep the socket alive forever.
      window.setTimeout(() => {
        if (attachedJobsRef.has(jobId)) {
          attachedJobsRef.delete(jobId);
          removeAiJob("storyboard_sketch", jobId);
        }

        // Timeout counts as terminal for this sketch job.
        const rec = storyboardOutstandingRef.get(storyboardId);
        if (rec) {
          rec.remaining = Math.max(0, rec.remaining - 1);
          storyboardOutstandingRef.set(storyboardId, rec);
          if (rec.remaining === 0) {
            setGeneratingStoryboards((prev) => {
              const next = { ...prev };
              delete next[storyboardId];
              return next;
            });
            setPendingStoryboard((prev) => ({ ...prev, [rec.parentId]: false }));
            storyboardOutstandingRef.delete(storyboardId);

            setStoryboards((prev) => {
              const sb = prev[storyboardId];
              if (!sb) return prev;
              const next = { ...prev, [storyboardId]: { ...sb, isSaving: false } as any };
              updateCache(next);
              return next;
            });
          }
        }

        ws.disableReconnect();
        ws.close();
      }, 4 * 60_000);
    },
    [attachedJobsRef, storyboardOutstandingRef]
  );

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

  useEffect(() => {
    pruneAiJobs(24 * 60 * 60_000);
    const jobs = listAiJobs("storyboard_sketch");
    jobs.forEach((job) => {
      const meta = job.meta || {};
      const storyboardId = meta.storyboardId as string | undefined;
      const parentVisualDirectionId = meta.parentVisualDirectionId as string | undefined;
      const idx = meta.idx as number | undefined;
      const name = meta.name as string | undefined;
      const sketchMeta = meta.sketchMeta as Record<string, any> | undefined;
      if (!storyboardId || !parentVisualDirectionId || typeof idx !== "number" || !name || !sketchMeta) return;
      setPendingStoryboard((prev) => ({ ...prev, [parentVisualDirectionId]: true }));

      // If we have any persisted sketch jobs, mark the storyboard as generating.
      setGeneratingStoryboards((prev) => ({ ...prev, [storyboardId]: true }));

      // Ensure we have an outstanding-count record.
      // We can't know remaining count precisely from here (unless we scan jobs per storyboard),
      // but we can best-effort set to at least 1.
      const existing = storyboardOutstandingRef.get(storyboardId);
      if (!existing) storyboardOutstandingRef.set(storyboardId, { parentId: parentVisualDirectionId, remaining: 1 });
      else storyboardOutstandingRef.set(storyboardId, { parentId: parentVisualDirectionId, remaining: Math.max(1, existing.remaining) });

      attachToSketchJob(job.jobId, storyboardId, parentVisualDirectionId, idx, name, sketchMeta);
    });
  }, [attachToSketchJob]);

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
  // Cache parity: we cache *metadata* (id/name/meta/s3_key) in IndexedDB.
  // But we DO NOT cache image bytes or presigned URLs.
  // On refresh we always fetch fresh presigned URLs from the API (S3-backed).
  useEffect(() => {
    let mounted = true;
    const storyboardIds = Object.keys(storyboards);
    if (storyboardIds.length === 0) return;

    (async () => {
      await Promise.all(
        storyboardIds.map(async (id) => {
          try {
            // 1) Cache-first metadata (so card doesn't appear empty offline / during reload)
            try {
              const cached = await idbGet<CachedStoryboardSketch[]>(getSketchesCacheKey(id));
              if (mounted && cached && cached.length > 0) {
                const cachedSketches = sortSketchesByVisualDirectionIndex(cachePayloadToSketches(cached) as any);
                setStoryboards((prev) => {
                  const sb = prev[id];
                  if (!sb) return prev;
                  // Only set if we don't already have sketches in memory
                  if (sb.sketches && sb.sketches.length > 0) return prev;
                  return {
                    ...prev,
                    [id]: { ...sb, sketches: cachedSketches, loadingSketches: true },
                  };
                });
              }
            } catch {
              // ignore IDB read errors
            }

            // 2) Always fetch fresh image_url from API (presigned S3 URL)
            const sketches = sortSketchesByVisualDirectionIndex((await getStoryboardSketches(id)) as any);
            if (!mounted) return;

            // Update IDB cache with metadata only
            idbSet(getSketchesCacheKey(id), sketchesToCachePayload(sketches)).catch(() => undefined);

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

            // If API fetch fails, keep whatever cached metadata we might have shown.
            setStoryboards((prev) => {
              const sb = prev[id];
              if (!sb) return prev;
              return {
                ...prev,
                [id]: {
                  ...sb,
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

        setStoryboards((prev) => {
          const next = {
            ...prev,
            [storyboard.id]: {
              ...storyboard,
              parentVisualDirectionId,
              sketches: [],
              isSaving: true,
              deleting: false,
              error: null,
              loadingSketches: true,
            } as any,
          };
          updateCache(next);
          return next;
        });

        // Child (storyboard) should show orange while sketches are generating.
        setGeneratingStoryboards((prev) => ({ ...prev, [storyboard.id]: true }));

        const validVisuals = (visualDirections || []).filter((vd: any) => String(vd?.content || "").trim());
        // Track how many sketch jobs we expect to finish.
        // IMPORTANT: use `allSettled` and decrement for failures, otherwise we can
        // get stuck in `generating` forever if one job fails to start.
        storyboardOutstandingRef.set(storyboard.id, { parentId: parentVisualDirectionId, remaining: validVisuals.length });

        const results = await Promise.allSettled(
          validVisuals.map(async (vd: any, idx: number) => {
            const dir = String(vd?.content || "");
            const name = `Sketch ${idx + 1}`;
            const meta = {
              parentVisualDirectionId,
              visualDirectionIndex: idx,
              ...(visualMeta[idx] || { index: idx }),
            };

            const { job_id } = await startSketchJob(dir, instructions || "");
            addAiJob({
              type: "storyboard_sketch",
              jobId: job_id,
              createdAt: Date.now(),
              meta: {
                storyboardId: storyboard.id,
                parentVisualDirectionId,
                idx,
                name,
                sketchMeta: meta,
              },
            });
            attachToSketchJob(job_id, storyboard.id, parentVisualDirectionId, idx, name, meta);
            return job_id;
          })
        );

        // Adjust outstanding count for any failed starts.
        const failedStarts = results.filter((r) => r.status === "rejected").length;
        if (failedStarts > 0) {
          const rec = storyboardOutstandingRef.get(storyboard.id);
          if (rec) {
            rec.remaining = Math.max(0, rec.remaining - failedStarts);
            storyboardOutstandingRef.set(storyboard.id, rec);
          }
        }

        // If we ended up with 0 actual jobs (no visuals or all starts failed),
        // clear generating/pending immediately so the UI doesn't get stuck.
        const recAfter = storyboardOutstandingRef.get(storyboard.id);
        if (!recAfter || recAfter.remaining === 0) {
          setGeneratingStoryboards((prev) => {
            const next = { ...prev };
            delete next[storyboard.id];
            return next;
          });
          setPendingStoryboard((prev) => ({ ...prev, [parentVisualDirectionId]: false }));
          storyboardOutstandingRef.delete(storyboard.id);
          setStoryboards((prev) => {
            const sb = prev[storyboard.id];
            if (!sb) return prev;
            const next = { ...prev, [storyboard.id]: { ...sb, isSaving: false } as any };
            updateCache(next);
            return next;
          });
        }

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
        // IMPORTANT: do NOT clear pending/generating here.
        // Websocket terminal messages (done/error/timeout) clear them when the final sketch job resolves.
        setSyncing(false);
        onSyncChange?.(false);
      }
    },
    [onSyncChange, startSketchJob, attachToSketchJob, storyboardOutstandingRef]
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

    // Cancel any outstanding AI jobs tied to this storyboard so it can't resurrect.
    removeAiJobsWhere((j) => j.type === "storyboard_sketch" && j.meta?.storyboardId === storyboardId);

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
      await idbDel(getSketchesCacheKey(storyboardId)).catch(() => undefined);
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
    generatingStoryboards,
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
