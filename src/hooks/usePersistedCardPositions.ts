import { useCallback, useEffect, useRef, useState } from "react";
import { getCardPositions } from "@api/card_positions/queries";
import { batchWriteCardPositions } from "@api/card_positions/mutations";
import type { CardPosition, CardPositionsBatchRequest, CardPositionDelete, CardPositionUpsert, CardType } from "@api/card_positions/types";
import { idbGet, idbSet } from "../utils/indexedDb";

type PositionsState = Record<string, { x: number; y: number }>;

type PendingOpsState = {
  upserts: Record<string, CardPositionUpsert>;
  deletes: Record<string, CardPositionDelete>;
};

function idbKey(projectId: string, cardType: CardType) {
  return `card-positions:${projectId}:${cardType}`;
}

function idbOpsKey(projectId: string, cardType: CardType) {
  return `card-position-ops:${projectId}:${cardType}`;
}

function emptyOps(): PendingOpsState {
  return { upserts: {}, deletes: {} };
}

function toPositionsState(rows: CardPosition[]): PositionsState {
  const next: PositionsState = {};
  (rows || []).forEach((r) => {
    next[r.cardId] = { x: r.x, y: r.y };
  });
  return next;
}

/**
 * Shared (cross-device) persisted positions for a single card type.
 *
 * Three-Layer Write Pattern:
 * 1) React state immediate
 * 2) IndexedDB (debounced)
 * 3) Database (debounced + batched)
 */
export function usePersistedCardPositions(params: {
  organizationId: string;
  projectId: string;
  cardType: CardType;
  /** Debounce ms for IndexedDB writes. */
  idbDebounceMs?: number;
  /** Debounce ms for DB writes. */
  dbDebounceMs?: number;
  /** If provided, will run after first hydration so callers can migrate legacy caches. */
  onHydrated?: (ctx: {
    positions: PositionsState;
    setCardPosition: (cardId: string, x: number, y: number) => void;
    deleteCardPosition: (cardId: string) => void;
  }) => void | Promise<void>;
}) {
  const { organizationId, projectId, cardType } = params;
  const idbDebounceMs = params.idbDebounceMs ?? 600;
  const dbDebounceMs = params.dbDebounceMs ?? 1500;

  const [positions, setPositions] = useState<PositionsState>({});
  const [loaded, setLoaded] = useState(false);

  // Local cache of persisted pending ops (so offline edits survive reload).
  const persistedOpsRef = useRef<PendingOpsState>(emptyOps());

  // Keep the latest positions available for callbacks without re-subscribing effects.
  const positionsRef = useRef<PositionsState>({});
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // Track pending writes.
  const pendingUpsertsRef = useRef<Map<string, CardPositionUpsert>>(new Map());
  const pendingDeletesRef = useRef<Map<string, CardPositionDelete>>(new Map());

  // Track whether a DB flush is in-flight.
  const dbFlushInFlightRef = useRef(false);
  // Exponential backoff for DB flush failures.
  const dbRetryAttemptRef = useRef(0);

  const idbTimerRef = useRef<number | null>(null);
  const dbTimerRef = useRef<number | null>(null);

  const opsTimerRef = useRef<number | null>(null);

  const persistOpsToIdb = useCallback(
    (delayMs?: number) => {
      if (opsTimerRef.current) window.clearTimeout(opsTimerRef.current);
      opsTimerRef.current = window.setTimeout(() => {
        const upserts: PendingOpsState["upserts"] = {};
        const deletes: PendingOpsState["deletes"] = {};
        pendingUpsertsRef.current.forEach((v, k) => {
          upserts[k] = v;
        });
        pendingDeletesRef.current.forEach((v, k) => {
          deletes[k] = v;
        });
        const payload: PendingOpsState = { upserts, deletes };
        persistedOpsRef.current = payload;
        idbSet(idbOpsKey(projectId, cardType), payload).catch(() => undefined);
      }, delayMs ?? idbDebounceMs);
    },
    [projectId, cardType, idbDebounceMs]
  );

  const scheduleDbFlush = useCallback(
    (delayMs?: number) => {
      if (dbTimerRef.current) window.clearTimeout(dbTimerRef.current);
      dbTimerRef.current = window.setTimeout(async () => {
        // Prevent overlapping flushes.
        if (dbFlushInFlightRef.current) {
          // try again shortly
          scheduleDbFlush(250);
          return;
        }

        const upserts = Array.from(pendingUpsertsRef.current.values());
        const deletes = Array.from(pendingDeletesRef.current.values());
        if (!upserts.length && !deletes.length) return;

        // Snapshot and clear, but restore on failure.
        pendingUpsertsRef.current.clear();
        pendingDeletesRef.current.clear();
        persistOpsToIdb(0);

        const body: CardPositionsBatchRequest = { upserts, deletes };
        dbFlushInFlightRef.current = true;
        try {
          await batchWriteCardPositions(organizationId, projectId, body);
          dbRetryAttemptRef.current = 0;

          // If we successfully flushed, clear persisted ops.
          persistedOpsRef.current = emptyOps();
          idbSet(idbOpsKey(projectId, cardType), emptyOps()).catch(() => undefined);
        } catch {
          // Restore pending writes so we don't lose data.
          upserts.forEach((u) => pendingUpsertsRef.current.set(u.cardId, u));
          deletes.forEach((d) => pendingDeletesRef.current.set(d.cardId, d));

          // Exponential backoff (bounded) so we don't hammer the API when offline.
          dbRetryAttemptRef.current = Math.min(8, dbRetryAttemptRef.current + 1);
          const backoff = Math.min(10_000, 500 * 2 ** dbRetryAttemptRef.current);
          scheduleDbFlush(backoff);
        } finally {
          dbFlushInFlightRef.current = false;
        }
      }, delayMs ?? dbDebounceMs);
    },
    [organizationId, projectId, dbDebounceMs, cardType, persistOpsToIdb]
  );

  const flushNow = useCallback(() => scheduleDbFlush(0), [scheduleDbFlush]);

  // --- Hydration: IDB first, then DB ---
  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) IDB positions + persisted ops
      let cachedPositions: PositionsState | null = null;
      let cachedOps: PendingOpsState | null = null;
      try {
        const [p, o] = await Promise.all([
          idbGet<PositionsState>(idbKey(projectId, cardType)).catch(() => null),
          idbGet<PendingOpsState>(idbOpsKey(projectId, cardType)).catch(() => null),
        ]);
        cachedPositions = p && typeof p === "object" ? p : null;
        cachedOps = o && typeof o === "object" ? o : null;
      } catch {
        // ignore
      }

      if (cachedOps) {
        persistedOpsRef.current = cachedOps;
        Object.values(cachedOps.upserts || {}).forEach((u) => {
          if (!u?.cardId) return;
          pendingDeletesRef.current.delete(u.cardId);
          pendingUpsertsRef.current.set(u.cardId, u);
        });
        Object.values(cachedOps.deletes || {}).forEach((d) => {
          if (!d?.cardId) return;
          pendingUpsertsRef.current.delete(d.cardId);
          pendingDeletesRef.current.set(d.cardId, d);
        });
      }

      if (mounted && cachedPositions) {
        setPositions(cachedPositions);
      }

      // 2) DB (merge with pending ops so offline edits aren't overwritten)
      try {
        const rows = await getCardPositions(organizationId, projectId, cardType);
        if (!mounted) return;

        const dbPositions = toPositionsState(rows);
        const merged: PositionsState = { ...dbPositions };

        // Apply cached ops (authoritative local edits)
        pendingUpsertsRef.current.forEach((u) => {
          merged[u.cardId] = { x: u.x, y: u.y };
        });
        pendingDeletesRef.current.forEach((d) => {
          delete merged[d.cardId];
        });

        setPositions(merged);
        idbSet(idbKey(projectId, cardType), merged).catch(() => undefined);
      } catch {
        // ignore network issues; cached layout will still work
      } finally {
        if (mounted) setLoaded(true);
      }

      // If there are pending ops from an offline session, try flushing immediately.
      if (pendingUpsertsRef.current.size || pendingDeletesRef.current.size) {
        flushNow();
      }

      // Optional post-hydration migration hook.
      try {
        await params.onHydrated?.({
          positions: positionsRef.current,
          setCardPosition: (cardId: string, x: number, y: number) => setCardPosition(cardId, x, y),
          deleteCardPosition: (cardId: string) => deleteCardPosition(cardId),
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [organizationId, projectId, cardType, flushNow]);

  const flushIdb = useCallback((next: PositionsState) => {
    if (idbTimerRef.current) window.clearTimeout(idbTimerRef.current);
    idbTimerRef.current = window.setTimeout(() => {
      idbSet(idbKey(projectId, cardType), next).catch(() => undefined);
    }, idbDebounceMs);
  }, [projectId, cardType, idbDebounceMs]);

  // Flush pending DB writes when the tab is backgrounded/closed.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flushNow]);

  const setCardPosition = useCallback(
    (cardId: string, x: number, y: number) => {
      const nx = Number(x);
      const ny = Number(y);
      if (!isFinite(nx) || !isFinite(ny) || !cardId) return;

      // 1) React state
      setPositions((prev) => {
        const next = { ...prev, [cardId]: { x: nx, y: ny } };
        // 2) IDB
        flushIdb(next);
        return next;
      });

      // 3) DB
      pendingDeletesRef.current.delete(cardId);
      pendingUpsertsRef.current.set(cardId, { cardType, cardId, x: nx, y: ny });
      persistOpsToIdb();
      scheduleDbFlush();
    },
    [cardType, scheduleDbFlush, flushIdb, persistOpsToIdb]
  );

  const deleteCardPosition = useCallback(
    (cardId: string) => {
      if (!cardId) return;

      // 1) React state
      setPositions((prev) => {
        const next = { ...prev };
        delete next[cardId];
        // 2) IDB
        flushIdb(next);
        return next;
      });

      // 3) DB
      pendingUpsertsRef.current.delete(cardId);
      pendingDeletesRef.current.set(cardId, { cardType, cardId });
      persistOpsToIdb();
      scheduleDbFlush();
    },
    [cardType, scheduleDbFlush, flushIdb, persistOpsToIdb]
  );

  // Helper to ensure default positions exist without overwriting persisted ones.
  const ensureDefaultPositions = useCallback(
    (ids: string[], getDefault: (id: string, index: number) => { x: number; y: number }) => {
      setPositions((prev) => {
        let changed = false;
        const next = { ...prev };
        ids.forEach((id, i) => {
          if (!next[id]) {
            next[id] = getDefault(id, i);
            // queue write
            pendingUpsertsRef.current.set(id, { cardType, cardId: id, x: next[id].x, y: next[id].y });
            changed = true;
          }
        });
        if (changed) {
          flushIdb(next);
          persistOpsToIdb();
          scheduleDbFlush();
          return next;
        }
        return prev;
      });
    },
    [cardType, scheduleDbFlush, flushIdb, persistOpsToIdb]
  );

  return {
    positions,
    setPositions,
    loaded,
    setCardPosition,
    deleteCardPosition,
    ensureDefaultPositions,
  };
}
