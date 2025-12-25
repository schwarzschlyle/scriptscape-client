import React, { useState, useRef, useEffect } from "react";
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
import { useCreateScript } from "@hooks/useCreateScript";
import { useUpdateScript } from "@hooks/useUpdateScript";
import { useDeleteScript } from "@hooks/useDeleteScript";
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const deleteScript = useDeleteScript();

  const isSyncingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isSyncingRef.current && onSyncChange) {
        onSyncChange(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setSaving(true);
    setError(null);
    if (isNew) {
      if (onSyncChange) onSyncChange(true);
      isSyncingRef.current = true;
      createScript.mutate(
        {
          organizationId,
          projectId,
          name: name || "Untitled Script",
          text,
        },
        {
          onSettled: () => {
            setSaving(false);
            if (onSyncChange) onSyncChange(false);
            isSyncingRef.current = false;
            if (onSavedOrCancel) onSavedOrCancel();
          },
        }
      );
    } else if (script) {
      if (onEditOptimistic) onEditOptimistic(script.id, name, text);
      if (onSyncChange) onSyncChange(true);
      isSyncingRef.current = true;
      setEditing(false);
      updateScript.mutate(
        {
          id: script.id,
          organizationId,
          projectId,
          data: { name, text },
        },
        {
          onSettled: () => {
            setSaving(false);
            if (onSyncChange) onSyncChange(false);
            isSyncingRef.current = false;
          },
        }
      );
    }
  };


  const handleDelete = () => {
    if (!script) return;
    setDeleting(true);
    if (onDeleteOptimistic) onDeleteOptimistic(script.id);
    if (onSyncChange) onSyncChange(true);
    isSyncingRef.current = true;
    deleteScript.mutate(
      {
        id: script.id,
        organizationId,
        projectId,
      },
      {
        onSettled: () => {
          setDeleting(false);
          if (onSyncChange) onSyncChange(false);
          isSyncingRef.current = false;
          if (onSavedOrCancel) onSavedOrCancel();
        },
      }
    );
  };

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
              onClick={handleSave}
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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" gutterBottom noWrap>
              {name || "Untitled Script"}
            </Typography>
            <Box>
              <IconButton size="small" onClick={() => setEditing(true)} disabled={deleting}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleDelete} disabled={deleting}>
                {deleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              fontSize: 14,
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
