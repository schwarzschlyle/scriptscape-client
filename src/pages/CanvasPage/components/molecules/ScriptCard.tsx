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
import type { Script } from "@api/scripts/types";

interface ScriptCardProps {
  script: Script;
  organizationId: string;
  projectId: string;
  isNew?: boolean;
  onSavedOrCancel?: () => void;
  onSave: (name: string, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  isNew = false,
  onSavedOrCancel,
  onSave,
  onDelete,
}) => {
  const [text, setText] = useState(script.text || "");
  const [name, setName] = useState(script.name || "");
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    // Immediately exit editing mode for true optimistic UX
    setEditing(false);
    try {
      await onSave(name, text);
    } catch (e: any) {
      setError(e?.message || "Failed to save script.");
      // For new cards, if save fails, let parent remove the card
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (e: any) {
      setError(e?.message || "Failed to delete script.");
    } finally {
      setDeleting(false);
    }
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
                setName(script.name || "");
                setText(script.text || "");
                if (isNew && onSavedOrCancel) onSavedOrCancel();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </CardActions>
        </Card>
        {/* No global syncing overlay */}
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
            <IconButton size="small" onClick={handleDelete} disabled={deleting}>
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
      {/* No global syncing overlay */}
    </Box>
  );
};

export default ScriptCard;
