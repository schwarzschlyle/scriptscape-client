import { useState, useEffect, useCallback } from "react";
import {
  useCreateSegmentCollection,
  useUpdateSegmentCollection,
  useDeleteSegmentCollection,
} from "@api/segment_collections/mutations";
import { useCreateSegment, useUpdateSegment } from "@api/segments/mutations";
import { addAiJob, listAiJobs, pruneAiJobs, removeAiJob, removeAiJobsWhere } from "../utils/aiJobPersistence";
import { getSegmentCollections } from "@api/segment_collections/queries";
import { getSegments } from "@api/segments/queries";
import { ReconnectingWebSocket } from "../utils/websocket";
import { buildWsUrl } from "../utils/wsUrl";
import type { SegmentCollection } from "@api/segment_collections/types";
import type { Segment as BaseSegment } from "@api/segments/types";

type Segment = BaseSegment;

function normalizeParentScriptId(col: any) {
  return col?.scriptId || col?.script_id || "";
}
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
  /** Child segment-collection-card generating state (orange dot). */
  const [generatingCollections, setGeneratingCollections] = useState<{ [collectionId: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const createSegmentCollectionMutation = useCreateSegmentCollection();
  const createSegmentMutation = useCreateSegment();
  const updateCollectionMutation = useUpdateSegmentCollection();
  const deleteCollectionMutation = useDeleteSegmentCollection();
  const updateSegmentMutation = useUpdateSegment();

  // Refresh canonical data after any local create/delete.
  // (A lightweight mechanism without threading query-client into this hook.)
  const [refreshTick, setRefreshTick] = useState(0);

  // Prevent duplicate websocket attachments for the same job.
  // This can happen in React strict mode / rerenders and leads to repeated writes (flooding).
  const attachedJobsRef = useState(() => new Set<string>())[0];

  // Prevent duplicate terminal message handling ("done" / "error").
  // Reconnects or multiple sockets can otherwise cause repeated POST /segments calls.
  const terminalHandledJobsRef = useState(() => new Set<string>())[0];

  const startSegmentsJob = useCallback(async (script: string, numSegments: number) => {
    const aiApiUrl = import.meta.env.VITE_AI_API_URL;
    const resp = await fetch(`${aiApiUrl}/run-generate-script-segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, num_segments: numSegments }),
    });
    if (!resp.ok) throw new Error("Failed to start segment generation.");
    const data = await resp.json();
    return data as { job_id: string };
  }, []);

  const attachToSegmentsJob = useCallback(
    (jobId: string, parentScriptId: string, collectionId: string, _numSegments: number, parentScriptPosition?: { x: number; y: number }) => {
      if (attachedJobsRef.has(jobId)) return;
      attachedJobsRef.add(jobId);

      const wsUrl = buildWsUrl(`/ws/generate-script-segments-result/${jobId}`);

      const ws = new ReconnectingWebSocket(wsUrl);

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data.status === "pending") return;
          if (data.status === "done" && Array.isArray(data.result)) {
            // Guard against duplicate terminal messages (reconnects / duplicate sockets)
            // causing repeated POST /segments calls.
            if (terminalHandledJobsRef.has(jobId)) return;
            terminalHandledJobsRef.add(jobId);

            const createdSegments: Segment[] = await Promise.all(
              (data.result as string[]).map((text: string, i: number) =>
                createSegmentMutation.mutateAsync({ collectionId, segmentIndex: i, text })
              )
            );

            setCollections((prev) => {
              const updated = {
                ...prev,
                [collectionId]: {
                  ...(prev[collectionId] as any),
                  id: collectionId,
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

            setPositions((prev) => {
              if (prev[collectionId]) return prev;
              const parentPos = parentScriptPosition || { x: 200, y: 200 };
              const offsetX = 380;
              const offsetY = 40 + Object.keys(prev).length * 40;
              const updated = { ...prev, [collectionId]: { x: parentPos.x + offsetX, y: parentPos.y + offsetY } };
              updatePositionsCache(updated);
              return updated;
            });

            removeAiJob("segments", jobId);
            setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: false }));
            setGeneratingCollections((prev) => {
              const next = { ...prev };
              delete next[collectionId];
              return next;
            });
            attachedJobsRef.delete(jobId);
            ws.disableReconnect();
            ws.close();
          } else if (data.status === "error") {
            if (terminalHandledJobsRef.has(jobId)) return;
            terminalHandledJobsRef.add(jobId);
            removeAiJob("segments", jobId);
            setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: false }));
            setGeneratingCollections((prev) => {
              const next = { ...prev };
              delete next[collectionId];
              return next;
            });
            attachedJobsRef.delete(jobId);
            ws.disableReconnect();
            ws.close();
          }
        } catch {
          removeAiJob("segments", jobId);
          setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: false }));
          setGeneratingCollections((prev) => {
            const next = { ...prev };
            delete next[collectionId];
            return next;
          });
          attachedJobsRef.delete(jobId);
          // Leave terminalHandledJobsRef entry until timeout cleanup.
          ws.disableReconnect();
          ws.close();
        }
      };

      window.setTimeout(() => {
        attachedJobsRef.delete(jobId);
        terminalHandledJobsRef.delete(jobId);
        removeAiJob("segments", jobId);
        setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: false }));
        setGeneratingCollections((prev) => {
          const next = { ...prev };
          delete next[collectionId];
          return next;
        });
        ws.disableReconnect();
        ws.close();
      }, 4 * 60_000);
    },
    [createSegmentMutation, attachedJobsRef, terminalHandledJobsRef]
  );

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
    let mounted = true;
    (async () => {
      try {
        const scriptsCacheKey = `scripts-cache-${organizationId}-${projectId}`;
        const raw = localStorage.getItem(scriptsCacheKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const scriptIds = Array.isArray(parsed) ? parsed.map((s: any) => s?.id).filter(Boolean) : [];
        if (!scriptIds.length) return;

        const collectionsResponses = await Promise.all(
          scriptIds.map(async (scriptId: string) => ({ scriptId, collections: await getSegmentCollections(scriptId) }))
        );
        const allCollections = collectionsResponses.flatMap(({ scriptId, collections }) =>
          (collections || []).map((c: any) => ({ ...c, scriptId }))
        );

        const segmentsResponses = await Promise.all(
          allCollections.map(async (col: any) => ({ colId: col.id, segmentsRes: await getSegments(col.id) }))
        );
        const segmentsByCollectionId: Record<string, Segment[]> = {};
        segmentsResponses.forEach(({ colId, segmentsRes }) => {
          // API returns a raw list[Segment] (not { data, pagination }).
          // The previous code expected a `{ data }` wrapper and would therefore
          // set segments to [] on every refresh, which looks like “entries cleared”.
          const payload = segmentsRes as any;
          segmentsByCollectionId[colId] = (Array.isArray(payload) ? payload : payload?.data || []) as any;
        });

        if (!mounted) return;
        setCollections((prev) => {
          const next: CollectionsState = { ...prev };
          allCollections.forEach((col: any) => {
            const existing = prev[col.id];
            next[col.id] = {
              ...(existing || ({} as any)),
              ...col,
              id: col.id,
              parentScriptId: normalizeParentScriptId(col) || existing?.parentScriptId || "",
              segments: segmentsByCollectionId[col.id] || existing?.segments || [],
              isSaving: (segmentsByCollectionId[col.id]?.length ?? 0) > 0 ? false : existing?.isSaving,
            } as any;
          });

          const backendIds = new Set(allCollections.map((c: any) => c.id));
          Object.keys(next).forEach((id) => {
            if (!backendIds.has(id)) delete (next as any)[id];
          });

          updateCache(next);
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [organizationId, projectId, refreshTick]);

  useEffect(() => {
    pruneAiJobs(24 * 60 * 60_000);
    const jobs = listAiJobs("segments");
    jobs.forEach((job) => {
      const meta = job.meta || {};
      const parentScriptId = meta.parentScriptId as string | undefined;
      const collectionId = meta.collectionId as string | undefined;
      const numSegments = meta.numSegments as number | undefined;
      const parentPos = meta.parentScriptPosition as { x: number; y: number } | undefined;
      if (!parentScriptId || !collectionId || typeof numSegments !== "number") return;
      setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: true }));
      setGeneratingCollections((prev) => ({ ...prev, [collectionId]: true }));
      attachToSegmentsJob(job.jobId, parentScriptId, collectionId, numSegments, parentPos);
    });
  }, [attachToSegmentsJob]);

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

        setCollections((prev) => {
          const updated = {
            ...prev,
            [collection.id]: {
              ...collection,
              parentScriptId,
              segments: [],
              isSaving: true,
              deleting: false,
              error: null,
            },
          };
          updateCache(updated);
          return updated;
        });

        // Child card should show orange while segments are generating.
        setGeneratingCollections((prev) => ({ ...prev, [collection.id]: true }));

        setPositions((prev) => {
          if (prev[collection.id]) return prev;
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

        const { job_id } = await startSegmentsJob(scriptText, numSegments);

        addAiJob({
          type: "segments",
          jobId: job_id,
          createdAt: Date.now(),
          meta: {
            parentScriptId,
            collectionId: collection.id,
            numSegments,
            parentScriptPosition: parentScriptPosition || null,
            collection: {
              id: collection.id,
              name: collection.name,
              metadata: (collection as any).metadata,
            },
          },
        });

        attachToSegmentsJob(job_id, parentScriptId, collection.id, numSegments, parentScriptPosition);

        // Pull canonical backend data after creating the container + starting AI.
        // (Ensures cross-session/device parity.)
        setRefreshTick((t) => t + 1);
      } catch (e: any) {
        setError(e?.message || "Failed to create segment collection.");
        setPendingSegmentCollection((prev) => ({ ...prev, [parentScriptId]: false }));

        // Ensure child generating is cleared if we already created a collection.
        // (collectionId can be missing in some failure paths)
        setGeneratingCollections((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((cid) => {
            const col = (collections as any)?.[cid];
            if (col?.parentScriptId === parentScriptId) delete next[cid];
          });
          return next;
        });

        setCollections((prev) => {
          const next = { ...prev };
          const col = Object.values(prev).find((c: any) => c?.parentScriptId === parentScriptId && c?.isSaving);
          if (col?.id && next[col.id]) {
            next[col.id] = { ...(next[col.id] as any), isSaving: false, error: e?.message || "Failed to create segment collection." };
            updateCache(next);
          }
          return next;
        });
      } finally {
        setSyncing(false);
        if (onSyncChange) onSyncChange(false);
      }
    },
    [organizationId, projectId, onSyncChange, createSegmentCollectionMutation, createSegmentMutation, startSegmentsJob, attachToSegmentsJob]
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
      // Cancel any outstanding AI jobs tied to this collection so it can't resurrect.
      removeAiJobsWhere((j) => j.type === "segments" && j.meta?.collectionId === colId);

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
        setRefreshTick((t) => t + 1);
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
      // Cancel any outstanding AI jobs tied to this script.
      removeAiJobsWhere((j) => j.type === "segments" && j.meta?.parentScriptId === scriptId);

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

      setRefreshTick((t) => t + 1);
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
    generatingCollections,
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



