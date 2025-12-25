import React, { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import { useScripts } from "@api/scripts/queries";
import ScriptCard from "./ScriptCard";
import AddScriptButton from "./AddScriptButton";
import type { Script } from "@api/scripts/types";

interface CanvasAreaProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

const CARD_WIDTH = 340;

type PendingCreate = {
  id: number;
  name: string;
  text: string;
  syncing: boolean;
};

type OptimisticDelete = {
  [id: string]: boolean; // true if deleting
};

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  // State for locally added (unsaved) scripts, now with syncing state
  const [pendingCreates, setPendingCreates] = useState<PendingCreate[]>([]);
  // Optimistic state for deleted/edited scripts
  const [optimisticScripts, setOptimisticScripts] = useState<Record<string, Script | null>>({});
  // Track which scripts are being deleted (for spinner overlay)
  const [optimisticDeletes, setOptimisticDeletes] = useState<OptimisticDelete>({});
  // Track number of ongoing syncs (create/edit/delete)
  const [syncCount, setSyncCount] = useState(0);

  const syncing = syncCount > 0;

  const { data, isLoading, error } = useScripts(organizationId, projectId);

  // Notify parent of syncing state
  useEffect(() => {
    if (onSyncChange) onSyncChange(syncing);
  }, [syncing, onSyncChange]);

  // Handler to add a new (unsaved) script card
  const handleAddScript = () => {
    setPendingCreates((prev) => [
      ...prev,
      { id: Date.now(), name: "", text: "", syncing: false },
    ]);
  };

  // Handler to update name/text for a pending create
  const handlePendingCreateChange = (id: number, name: string, text: string) => {
    setPendingCreates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, text } : c))
    );
  };

  // Handler to remove a new script card after cancel or after API finishes
  const handleRemoveNewScript = (id: number) => {
    setPendingCreates((prev) => prev.filter((c) => c.id !== id));
  };

  // Handler to start syncing for a pending create
  const handleCreateSyncStart = (id: number) => {
    setPendingCreates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, syncing: true } : c))
    );
    setSyncCount((prev) => prev + 1);
  };

  // Handler to finish syncing for a pending create
  const handleCreateSyncFinish = (id: number) => {
    setPendingCreates((prev) => prev.filter((c) => c.id !== id));
    setSyncCount((prev) => Math.max(0, prev - 1));
  };

  // Optimistically delete a script from UI (show spinner overlay until API finishes)
  const handleDeleteOptimistic = useCallback((id: string) => {
    setOptimisticDeletes((prev) => ({ ...prev, [id]: true }));
    setSyncCount((prev) => prev + 1);
  }, []);

  // Called by ScriptCard when delete API finishes
  const handleDeleteSyncFinish = useCallback((id: string) => {
    setOptimisticDeletes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setOptimisticScripts((prev) => ({ ...prev, [id]: null }));
    setSyncCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Optimistically edit a script in UI
  const handleEditOptimistic = useCallback((id: string, name: string, text: string) => {
    const original = data?.find((s) => s.id === id);
    if (!original) return;
    setOptimisticScripts((prev) => ({
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
    }));
  }, [data]);

  // Handle syncing state from ScriptCard (increment/decrement counter for update)
  const handleSyncChange = useCallback((sync: boolean) => {
    setSyncCount((prev) => (sync ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  // Filter scripts for display: remove deleted, apply edits
  const scriptsToShow = (data || [])
    .filter((script) => optimisticScripts[script.id] !== null)
    .map((script) => optimisticScripts[script.id] ? optimisticScripts[script.id]! : script);

  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        width: "100%",
        minHeight: "calc(100vh - 64px)", // adjust for header
        bgcolor: "background.default",
        p: 3,
        pt: 8,
        overflow: "auto",
      }}
    >
      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        alignItems="flex-start"
        justifyContent="flex-start"
      >
        {/* Existing scripts (optimistic) */}
        {scriptsToShow.map((script: Script) => (
          <Box
            key={script.id}
            sx={{
              width: CARD_WIDTH,
              minWidth: 0,
              m: 1,
              flex: "0 1 auto",
            }}
          >
            <ScriptCard
              script={script}
              organizationId={organizationId}
              projectId={projectId}
              isNew={false}
              onDeleteOptimistic={handleDeleteOptimistic}
              onEditOptimistic={handleEditOptimistic}
              onSyncChange={handleSyncChange}
              syncing={!!optimisticDeletes[script.id]}
              // When delete finishes, remove from UI
              onSavedOrCancel={() => handleDeleteSyncFinish(script.id)}
            />
          </Box>
        ))}
        {/* Pending create script cards */}
        {pendingCreates.map((pending) => (
          <Box
            key={pending.id}
            sx={{
              width: CARD_WIDTH,
              minWidth: 0,
              m: 1,
              flex: "0 1 auto",
            }}
          >
            <ScriptCard
              organizationId={organizationId}
              projectId={projectId}
              isNew
              onSavedOrCancel={() => handleRemoveNewScript(pending.id)}
              onSyncChange={(sync) => {
                if (sync) {
                  handleCreateSyncStart(pending.id);
                } else {
                  handleCreateSyncFinish(pending.id);
                }
              }}
              // Pass name/text for instant display and update as user types
              script={{
                id: String(pending.id),
                name: pending.name,
                text: pending.text,
                projectId: projectId,
                version: 1,
                createdAt: "",
                updatedAt: "",
              }}
              syncing={pending.syncing}
              // Update name/text as user types
              onEditOptimistic={(_id, name, text) => handlePendingCreateChange(pending.id, name, text)}
            />
          </Box>
        ))}
      </Box>
      {/* Floating Add Script Button */}
      <AddScriptButton onClick={handleAddScript} />
      {/* Loading/Error states */}
      {isLoading && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          Loading scripts...
        </Box>
      )}
      {error && (
        <Box color="error.main" sx={{ mt: 2 }}>
          Failed to load scripts.
        </Box>
      )}
    </Box>
  );
};

export default CanvasArea;
