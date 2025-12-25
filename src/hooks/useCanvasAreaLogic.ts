import { useState, useEffect, useCallback } from "react";
import { useScripts } from "@api/scripts/queries";
import type { Script } from "@api/scripts/types";

export interface PendingCreate {
  id: number;
  name: string;
  text: string;
  syncing: boolean;
}

export interface UseCanvasAreaLogicProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

export function useCanvasAreaLogic({
  organizationId,
  projectId,
  onSyncChange,
}: UseCanvasAreaLogicProps) {
  const [pendingCreates, setPendingCreates] = useState<PendingCreate[]>([]);
  const [optimisticScripts, setOptimisticScripts] = useState<Record<string, Script | null>>({});
  const [optimisticDeletes, setOptimisticDeletes] = useState<{ [id: string]: boolean }>({});
  const [syncCount, setSyncCount] = useState(0);

  const syncing = syncCount > 0;

  const { data, isLoading, error } = useScripts(organizationId, projectId);

  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  const handleAddScript = useCallback(() => {
    setPendingCreates((prev) => [
      ...prev,
      { id: Date.now(), name: "", text: "", syncing: false },
    ]);
  }, []);

  const handlePendingCreateChange = useCallback((id: number, name: string, text: string) => {
    setPendingCreates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, text } : c))
    );
  }, []);

  const handleRemoveNewScript = useCallback((id: number) => {
    setPendingCreates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCreateSyncStart = useCallback((id: number) => {
    setPendingCreates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, syncing: true } : c))
    );
    setSyncCount((prev) => prev + 1);
  }, []);

  const handleCreateSyncFinish = useCallback((id: number) => {
    setPendingCreates((prev) => prev.filter((c) => c.id !== id));
    setSyncCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleDeleteOptimistic = useCallback((id: string) => {
    setOptimisticDeletes((prev) => ({ ...prev, [id]: true }));
    setSyncCount((prev) => prev + 1);
  }, []);

  const handleDeleteSyncFinish = useCallback((id: string) => {
    setOptimisticDeletes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setOptimisticScripts((prev) => ({ ...prev, [id]: null }));
    setSyncCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleEditOptimistic = useCallback((id: string, name: string, text: string) => {
    setOptimisticScripts((prev) => {
      const original = data?.find((s) => s.id === id);
      if (!original) return prev;
      return {
        ...prev,
        [id]: {
          id,
          name,
          text,
          projectId: original.projectId,
          version: original.version,
          metadata: original.metadata,
          createdAt: original.createdAt,
          updatedAt: original.updatedAt,
        },
      };
    });
  }, [data]);

  const handleSyncChange = useCallback((sync: boolean) => {
    setSyncCount((prev) => (sync ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  const scriptsToShow = (data || [])
    .filter((script) => optimisticScripts[script.id] !== null)
    .map((script) => optimisticScripts[script.id] ? optimisticScripts[script.id]! : script);

  return {
    pendingCreates,
    optimisticScripts,
    optimisticDeletes,
    syncing,
    isLoading,
    error,
    scriptsToShow,
    handleAddScript,
    handlePendingCreateChange,
    handleRemoveNewScript,
    handleCreateSyncStart,
    handleCreateSyncFinish,
    handleDeleteOptimistic,
    handleDeleteSyncFinish,
    handleEditOptimistic,
    handleSyncChange,
  };
}
