import { useState, useEffect, useCallback, useRef } from "react";
import { useCreateVisual, useUpdateVisual, useDeleteVisual } from "@api/visuals/mutations";
import type { Visual } from "@api/visuals/types";
import { addAiJob, listAiJobs, pruneAiJobs, removeAiJob, removeAiJobsWhere } from "../utils/aiJobPersistence";
import { ReconnectingWebSocket } from "../utils/websocket";
import { buildWsUrl } from "../utils/wsUrl";

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

function sortVisualsBySegmentIndex(visuals: Visual[]) {
  const getIdx = (v: any) =>
    (v?.metadata as any)?.segmentIndex ??
    (v?.meta as any)?.segmentIndex ??
    (v?.metadata as any)?.segment_index ??
    (v?.meta as any)?.segment_index ??
    Number.MAX_SAFE_INTEGER;
  return [...(visuals || [])].sort((a: any, b: any) => getIdx(a) - getIdx(b));
}

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
  // Used to read the latest directions inside mount/resume effects without
  // re-triggering them (prevents update-depth loops).
  const directionsRef = useRef<DirectionsState>({});
  const [positions, setPositions] = useState<PositionsState>({});
  const [pendingVisualDirection, setPendingVisualDirection] = useState<{ [segmentCollectionId: string]: boolean }>({});
  /** Child visual-direction-card generating state (orange dot). */
  const [generatingDirections, setGeneratingDirections] = useState<{ [visualDirectionId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const createVisualMutation = useCreateVisual();
  const updateVisualMutation = useUpdateVisual();
  const deleteVisualMutation = useDeleteVisual();

  // Prevent duplicate websocket attachments for the same job (rerenders/strict-mode)
  // which can cause repeated POST /visuals calls.
  const attachedJobsRef = useState(() => new Set<string>())[0];

  // Prevent duplicate terminal message handling ("done" / "error").
  // Reconnects or multiple sockets can otherwise cause repeated POST /visuals calls.
  const terminalHandledJobsRef = useState(() => new Set<string>())[0];

  // Track which parent a direction belongs to, so we can reliably clear
  // both parent (blue) and child (orange) indicators on job terminal events.
  const directionParentRef = useState(() => new Map<string, string>())[0];

  // Keep a ref to the latest directions state for resume logic.
  useEffect(() => {
    directionsRef.current = directions;
  }, [directions]);
  const startVisualsJob = useCallback(async (segments: string[]) => {
    const aiApiUrl = import.meta.env.VITE_AI_API_URL;
    const resp = await fetch(`${aiApiUrl}/run-generate-script-visuals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
    });
    if (!resp.ok) throw new Error("Failed to start visual generation.");
    const data = await resp.json();
    return data as { job_id: string };
  }, []);

  const attachToVisualsJob = useCallback(
    (jobId: string, parentSegmentCollectionId: string, segmentId: string, segmentText: string, visualSetId: string, visualDirectionId: string) => {
      if (attachedJobsRef.has(jobId)) return;
      attachedJobsRef.add(jobId);

      // Remember parent so we can safely clear state later.
      directionParentRef.set(visualDirectionId, parentSegmentCollectionId);

      const wsUrl = buildWsUrl(`/ws/generate-script-visuals-result/${jobId}`);

      const ws = new ReconnectingWebSocket(wsUrl);
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data.status === "pending") return;
          if (data.status === "done" && Array.isArray(data.result)) {
            // Guard against duplicate terminal messages or duplicate sockets.
            if (terminalHandledJobsRef.has(jobId)) return;
            terminalHandledJobsRef.add(jobId);

            const content = String(data.result?.[0] || "");
            const created = await createVisualMutation.mutateAsync({
              visualSetId,
              segmentId,
              content,
              metadata: {
                parentSegmentCollectionId,
                segmentText,
                // Legacy single-item jobs may not know the segment index; batch flow sets this.
                segmentIndex: undefined,
              },
            } as any);

            setDirections((prev) => {
              const existing = prev[visualDirectionId] || {
                id: visualDirectionId,
                parentSegmentCollectionId,
                visuals: [],
              };
              const visuals = [...(existing.visuals || []), created];
              const next = {
                ...prev,
                [visualDirectionId]: {
                  ...(existing as any),
                  id: visualDirectionId,
                  parentSegmentCollectionId,
                  visuals: sortVisualsBySegmentIndex(visuals as any),
                  isSaving: false,
                  deleting: false,
                  error: null,
                },
              };
              updateCache(next);
              return next;
            });

            removeAiJob("visuals", jobId);
            setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
            setGeneratingDirections((prev) => {
              const next = { ...prev };
              delete next[visualDirectionId];
              return next;
            });
            attachedJobsRef.delete(jobId);
            terminalHandledJobsRef.delete(jobId);
            directionParentRef.delete(visualDirectionId);
            ws.disableReconnect();
            ws.close();
          } else if (data.status === "error") {
            if (terminalHandledJobsRef.has(jobId)) return;
            terminalHandledJobsRef.add(jobId);
            removeAiJob("visuals", jobId);
            setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
            setGeneratingDirections((prev) => {
              const next = { ...prev };
              delete next[visualDirectionId];
              return next;
            });
            attachedJobsRef.delete(jobId);
            terminalHandledJobsRef.delete(jobId);
            directionParentRef.delete(visualDirectionId);
            ws.disableReconnect();
            ws.close();
          }
        } catch {
          removeAiJob("visuals", jobId);
          setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
          setGeneratingDirections((prev) => {
            const next = { ...prev };
            delete next[visualDirectionId];
            return next;
          });
          attachedJobsRef.delete(jobId);
          terminalHandledJobsRef.delete(jobId);
          directionParentRef.delete(visualDirectionId);
          ws.disableReconnect();
          ws.close();
        }
      };

      window.setTimeout(() => {
        attachedJobsRef.delete(jobId);
        terminalHandledJobsRef.delete(jobId);
        removeAiJob("visuals", jobId);
        setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
        setGeneratingDirections((prev) => {
          const next = { ...prev };
          delete next[visualDirectionId];
          return next;
        });
        directionParentRef.delete(visualDirectionId);
        ws.disableReconnect();
        ws.close();
      }, 4 * 60_000);
    },
    [createVisualMutation, attachedJobsRef, terminalHandledJobsRef, directionParentRef]
  );

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
          // Ensure visuals are always stored/rendered in stable order.
          const normalized: DirectionsState = {};
          Object.entries(parsed).forEach(([id, vd]: any) => {
            normalized[id] = {
              ...(vd as any),
              visuals: sortVisualsBySegmentIndex((vd as any)?.visuals || []),
            };
          });
          setDirections(normalized);
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
    pruneAiJobs(24 * 60 * 60_000);
    const jobs = listAiJobs("visuals");
    jobs.forEach((job) => {
      const meta = job.meta || {};

      // Batch job (new behavior)
      if (meta.kind === "batch") {
        const parentSegmentCollectionId = meta.parentSegmentCollectionId as string | undefined;
        const visualSetId = meta.visualSetId as string | undefined;
        const visualDirectionId = meta.visualDirectionId as string | undefined;
        const segmentIds = meta.segmentIds as string[] | undefined;
        const segmentTexts = (meta.segmentTexts || meta.segments) as string[] | undefined;
        if (!parentSegmentCollectionId || !visualSetId || !visualDirectionId || !segmentIds || !segmentTexts) return;

        // If we already have visuals cached for this direction, don't regenerate.
        // Best-effort cleanup of stale job record.
        const existing = directionsRef.current?.[visualDirectionId];
        if (existing?.visuals?.length) {
          removeAiJob("visuals", job.jobId);
          // Clear any stale indicators for this job.
          setPendingVisualDirection((prev) => {
            if (!prev[parentSegmentCollectionId]) return prev;
            return { ...prev, [parentSegmentCollectionId]: false };
          });
          setGeneratingDirections((prev) => {
            if (!prev[visualDirectionId]) return prev;
            const next = { ...prev };
            delete next[visualDirectionId];
            return next;
          });
          return;
        }

        // IMPORTANT: guard state updates so this effect can run multiple times
        // without creating an infinite update loop.
        setPendingVisualDirection((prev) =>
          prev[parentSegmentCollectionId] ? prev : { ...prev, [parentSegmentCollectionId]: true }
        );
        setGeneratingDirections((prev) =>
          prev[visualDirectionId] ? prev : { ...prev, [visualDirectionId]: true }
        );
        directionParentRef.set(visualDirectionId, parentSegmentCollectionId);

        if (attachedJobsRef.has(job.jobId)) return;
        attachedJobsRef.add(job.jobId);

        const wsUrl = buildWsUrl(`/ws/generate-script-visuals-result/${job.jobId}`);

        const ws = new ReconnectingWebSocket(wsUrl);
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(String(event.data));
            if (data.status === "done" && Array.isArray(data.result)) {
              if (terminalHandledJobsRef.has(job.jobId)) return;
              terminalHandledJobsRef.add(job.jobId);
              const visuals = data.result as string[];
              const n = Math.min(visuals.length, segmentIds.length);
              const createdVisuals = await Promise.all(
                Array.from({ length: n }).map(async (_, i) => {
                  const segmentId = segmentIds[i];
                  const segmentText = segmentTexts[i] || "";
                  const content = String(visuals[i] || "");
                  return await createVisualMutation.mutateAsync({
                    visualSetId,
                    segmentId,
                    content,
                    metadata: {
                      parentSegmentCollectionId,
                      segmentText,
                      segmentIndex: i,
                    },
                  } as any);
                })
              );

              const orderedVisuals = sortVisualsBySegmentIndex(createdVisuals as any);

              setDirections((prev) => {
                const existingDir = prev[visualDirectionId] || {
                  id: visualDirectionId,
                  parentSegmentCollectionId,
                  visuals: [],
                };
                const next = {
                  ...prev,
                  [visualDirectionId]: {
                    ...(existingDir as any),
                    id: visualDirectionId,
                    parentSegmentCollectionId,
                    visuals: orderedVisuals,
                    isSaving: false,
                    deleting: false,
                    error: null,
                  },
                };
                updateCache(next);
                return next;
              });

              removeAiJob("visuals", job.jobId);
              // Clear parent + child generating only when this job is terminal.
              setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
              setGeneratingDirections((prev) => {
                const next = { ...prev };
                delete next[visualDirectionId];
                return next;
              });
              directionParentRef.delete(visualDirectionId);
              attachedJobsRef.delete(job.jobId);
              terminalHandledJobsRef.delete(job.jobId);
              ws.close();
            } else if (data.status === "error") {
              removeAiJob("visuals", job.jobId);
              setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
              setGeneratingDirections((prev) => {
                const next = { ...prev };
                delete next[visualDirectionId];
                return next;
              });
              directionParentRef.delete(visualDirectionId);
              attachedJobsRef.delete(job.jobId);
              terminalHandledJobsRef.delete(job.jobId);
              ws.close();
            }
          } catch {
            removeAiJob("visuals", job.jobId);
            setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
            setGeneratingDirections((prev) => {
              const next = { ...prev };
              delete next[visualDirectionId];
              return next;
            });
            directionParentRef.delete(visualDirectionId);
            attachedJobsRef.delete(job.jobId);
            terminalHandledJobsRef.delete(job.jobId);
            ws.close();
          }
        };
        return;
      }

      // Legacy single-item job
      const parentSegmentCollectionId = meta.parentSegmentCollectionId as string | undefined;
      const segmentId = meta.segmentId as string | undefined;
      const segmentText = meta.segmentText as string | undefined;
      const visualSetId = meta.visualSetId as string | undefined;
      const visualDirectionId = meta.visualDirectionId as string | undefined;
      if (!parentSegmentCollectionId || !segmentId || !segmentText || !visualSetId || !visualDirectionId) return;
      setPendingVisualDirection((prev) =>
        prev[parentSegmentCollectionId] ? prev : { ...prev, [parentSegmentCollectionId]: true }
      );
      setGeneratingDirections((prev) =>
        prev[visualDirectionId] ? prev : { ...prev, [visualDirectionId]: true }
      );
      directionParentRef.set(visualDirectionId, parentSegmentCollectionId);
      attachToVisualsJob(job.jobId, parentSegmentCollectionId, segmentId, segmentText, visualSetId, visualDirectionId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachToVisualsJob, createVisualMutation, organizationId, projectId]);

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
        const visualSetId = visualSetIdOverride || projectId;
        const newId = `${parentSegmentCollectionId}-visual-direction-${Date.now()}`;

        setDirections((prev) => {
          const next = {
            ...prev,
            [newId]: {
              id: newId,
              parentSegmentCollectionId,
              visuals: [],
              title: "Visual Direction",
              isSaving: true,
              deleting: false,
              error: null,
            } as any,
          };
          updateCache(next);
          return next;
        });

        // Child direction should show orange while visuals are generating.
        setGeneratingDirections((prev) => ({ ...prev, [newId]: true }));

        directionParentRef.set(newId, parentSegmentCollectionId);

        // Start ONE visuals AI job for the whole collection.
        // This keeps behavior consistent and avoids flooding the worker with N jobs.
        const { job_id } = await startVisualsJob(contents);

        addAiJob({
          type: "visuals",
          jobId: job_id,
          createdAt: Date.now(),
          meta: {
            kind: "batch",
            visualDirectionId: newId,
            parentSegmentCollectionId,
            visualSetId,
            segmentIds,
            segmentTexts: contents,
          },
        });

        // Attach once and create visuals for each returned item.
        // NOTE: This uses a local handler instead of attachToVisualsJob (which is single-item).
        if (!attachedJobsRef.has(job_id)) {
          attachedJobsRef.add(job_id);

          const wsUrl = buildWsUrl(`/ws/generate-script-visuals-result/${job_id}`);

          const ws = new ReconnectingWebSocket(wsUrl);
          ws.onmessage = async (event: MessageEvent) => {
            try {
              const data = JSON.parse(String(event.data));
              if (data.status === "pending") return;
              if (data.status === "done" && Array.isArray(data.result)) {
                if (terminalHandledJobsRef.has(job_id)) return;
                terminalHandledJobsRef.add(job_id);

                const visuals = data.result as string[];
                // Create visuals 1:1 with input segments (best-effort, clamp to min length)
                const n = Math.min(visuals.length, segmentIds.length);
                const createdVisuals = await Promise.all(
                  Array.from({ length: n }).map(async (_, i) => {
                    const segmentId = segmentIds[i];
                    const segmentText = contents[i] || "";
                    const content = String(visuals[i] || "");
                    return await createVisualMutation.mutateAsync({
                      visualSetId,
                      segmentId,
                      content,
                      metadata: {
                        parentSegmentCollectionId,
                        segmentText,
                        segmentIndex: i,
                      },
                    } as any);
                  })
                );

                const orderedVisuals = sortVisualsBySegmentIndex(createdVisuals as any);

                setDirections((prev) => {
                  const existing = prev[newId] || {
                    id: newId,
                    parentSegmentCollectionId,
                    visuals: [],
                  };
                  const next = {
                    ...prev,
                    [newId]: {
                      ...(existing as any),
                      id: newId,
                      parentSegmentCollectionId,
                      visuals: orderedVisuals,
                      isSaving: false,
                      deleting: false,
                      error: null,
                    },
                  };
                  updateCache(next);
                  return next;
                });

                removeAiJob("visuals", job_id);
                setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
                setGeneratingDirections((prev) => {
                  const next = { ...prev };
                  delete next[newId];
                  return next;
                });
                directionParentRef.delete(newId);
                attachedJobsRef.delete(job_id);
                terminalHandledJobsRef.delete(job_id);
                ws.disableReconnect();
                ws.close();
              } else if (data.status === "error") {
                removeAiJob("visuals", job_id);
                setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
                setGeneratingDirections((prev) => {
                  const next = { ...prev };
                  delete next[newId];
                  return next;
                });
                directionParentRef.delete(newId);
                attachedJobsRef.delete(job_id);
                terminalHandledJobsRef.delete(job_id);
                ws.disableReconnect();
                ws.close();
              }
            } catch {
              removeAiJob("visuals", job_id);
              setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
              setGeneratingDirections((prev) => {
                const next = { ...prev };
                delete next[newId];
                return next;
              });
              directionParentRef.delete(newId);
              attachedJobsRef.delete(job_id);
              terminalHandledJobsRef.delete(job_id);
              ws.disableReconnect();
              ws.close();
            }
          };

          window.setTimeout(() => {
            attachedJobsRef.delete(job_id);
            terminalHandledJobsRef.delete(job_id);
            removeAiJob("visuals", job_id);
            setPendingVisualDirection((prev) => ({ ...prev, [parentSegmentCollectionId]: false }));
            setGeneratingDirections((prev) => {
              const next = { ...prev };
              delete next[newId];
              return next;
            });
            directionParentRef.delete(newId);
            ws.disableReconnect();
            ws.close();
          }, 4 * 60_000);
        }

        setDirections((prev) => {
          const updated = {
            ...prev,
            [newId]: {
              id: newId,
              parentSegmentCollectionId,
              visuals: prev?.[newId]?.visuals || [],
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
        // NOTE: do NOT clear pending here. The AI job can still be running and will clear pending
        // when a terminal websocket message is received (done/error/timeout).
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [organizationId, projectId, createVisualMutation, onSyncChange, startVisualsJob, attachedJobsRef, terminalHandledJobsRef, directionParentRef]
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

      // Cancel any outstanding AI jobs tied to this visual direction so it can't resurrect.
      removeAiJobsWhere((j) => j.type === "visuals" && j.meta?.visualDirectionId === visualDirectionId);

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
    generatingDirections,
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
