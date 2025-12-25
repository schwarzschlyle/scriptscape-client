import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import { useScriptSaveHandler } from "@hooks/useScriptSaveHandler";
import { useScriptDeleteHandler } from "@hooks/useScriptDeleteHandler";
import type { Script } from "@api/scripts/types";

interface ScriptCardProps {
  script?: Script;
  organizationId: string;
  projectId: string;
  isNew?: boolean;
  onSavedOrCancel?: () => void;
  onDeleteOptimistic?: (id: string) => void;
  onEditOptimistic?: (id: string, name: string, text: string) => void;
  onSyncChange?: (syncing: boolean) => void;
  syncing?: boolean;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  organizationId,
  projectId,
  isNew = false,
  onSavedOrCancel,
  onDeleteOptimistic,
  onEditOptimistic,
  onSyncChange,
  syncing,
}) => {
  const [text, setText] = useState(script?.text || "");
  const [name, setName] = useState(script?.name || "");
  const [editing, setEditing] = useState(isNew);

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

  const { deleteHandler, deleting } = useScriptDeleteHandler({
    script,
    organizationId,
    projectId,
    onDeleteOptimistic,
    onSavedOrCancel,
    onSyncChange,
  });

  if (editing) {
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
              {saving ? <CircularProgress size={18} /> : "Save"}
            </Button>
            <Button
              size="small"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={() => {
                setEditing(false);
                setName(script?.name || "");
                setText(script?.text || "");
                if (isNew && onSavedOrCancel) onSavedOrCancel();
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
            <CircularProgress size={32} />
          </Box>
        )}
      </Box>
    );
  }


  return (
    <Box sx={{ position: "relative" }}>
      <Card sx={{ minHeight: 220, display: "flex", flexDirection: "column", opacity: deleting ? 0.5 : 1 }}>
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ width: "100%", textAlign: "center" }}>
            <Typography variant="subtitle2" gutterBottom noWrap>
              {name || "Untitled Script"}
            </Typography>
          </Box>
          <Divider sx={{ mb: 1 }} />
          <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{ mb: 1 }}>
            <IconButton size="small" onClick={() => setEditing(true)} disabled={deleting}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={deleteHandler} disabled={deleting}>
              {deleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Box
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            {text}
          </Box>
        </CardContent>
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
          <CircularProgress size={32} />
        </Box>
      )}
    </Box>
  );
};

export default ScriptCard;
