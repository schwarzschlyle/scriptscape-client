import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import LoadingSpinner from "@components/LoadingSpinner";
import { useScriptSaveHandler } from "@hooks/useScriptSaveHandler";
import type { Script } from "@api/scripts/types";

interface NewScriptCardProps {
  script?: Script;
  organizationId: string;
  projectId: string;
  isNew?: boolean;
  onSavedOrCancel?: () => void;
  onEditOptimistic?: (id: string, name: string, text: string) => void;
  onSyncChange?: (syncing: boolean) => void;
  syncing?: boolean;
}

const NewScriptCard: React.FC<NewScriptCardProps> = ({
  script,
  organizationId,
  projectId,
  isNew = false,
  onSavedOrCancel,
  onEditOptimistic,
  onSyncChange,
  syncing,
}) => {
  const [text, setText] = useState(script?.text || "");
  const [name, setName] = useState(script?.name || "");

  const {
    save,
    saving,
    error,
  } = useScriptSaveHandler({
    script,
    organizationId,
    projectId,
    isNew,
    onSavedOrCancel,
    onEditOptimistic,
    onSyncChange,
  });

  return (
    <Box sx={{ position: "relative" }}>
      <Card sx={{ minHeight: 220, display: "flex", flexDirection: "column", opacity: saving ? 0.7 : 1 }}>
        <CardContent sx={{ flex: 1 }}>
          <TextField
            label="Script Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="dense"
            size="small"
            sx={{ mb: 1 }}
            disabled={saving}
          />
          <TextField
            label="Script"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            multiline
            minRows={4}
            margin="dense"
            size="small"
            disabled={saving}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </CardContent>
        <CardActions>
          <Button
            size="small"
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => save(name, text)}
            disabled={saving || !text.trim()}
          >
            {saving ? <LoadingSpinner size={18} /> : "Save"}
          </Button>
          <Button
            size="small"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={() => {
              if (onSavedOrCancel) onSavedOrCancel();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
        </CardActions>
      </Card>

      {syncing && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <LoadingSpinner size={32} />
        </Box>
      )}
    </Box>
  );
};

export default NewScriptCard;
