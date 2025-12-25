import React from "react";
import Box from "@mui/material/Box";
import ScriptCard from "./ScriptCard";
import AddScriptButton from "./AddScriptButton";
import type { Script } from "@api/scripts/types";
import { useCanvasAreaLogic } from "@hooks/useCanvasAreaLogic";

interface CanvasAreaProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

const CARD_WIDTH = 340;

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  const {
    pendingCreates,
    optimisticDeletes,
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
  } = useCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        width: "100%",
        minHeight: "calc(100vh - 64px)",
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
              onEditOptimistic={(_id, name, text) => handlePendingCreateChange(pending.id, name, text)}
            />
          </Box>
        ))}
      </Box>
      <AddScriptButton onClick={handleAddScript} />
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
