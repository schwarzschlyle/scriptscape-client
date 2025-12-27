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
    scripts,
    loading,
    error,
    syncing,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
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
        {scripts.map((script: Script) => (
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
              isNew={script.id.startsWith("temp-")}
              onSavedOrCancel={() => handleRemoveNewScript(script.id)}
              onSave={(name, text) =>
                script.id.startsWith("temp-")
                  ? handleSaveNewScript(script.id, name, text)
                  : handleEditScript(script.id, name, text)
              }
              onDelete={() => handleDeleteScript(script.id)}
            />
          </Box>
        ))}
      </Box>
      <AddScriptButton onClick={handleAddScript} />
      {loading && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          Loading scripts...
        </Box>
      )}
      {error && (
        <Box color="error.main" sx={{ mt: 2 }}>
          {error}
        </Box>
      )}
    </Box>
  );
};

export default CanvasArea;
