import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import type { Script } from "@api/scripts/types";
import ScriptCardHeader from "./ScriptCardHeader";
import ScriptCardBody from "./ScriptCardBody";

interface ScriptCardProps {
  script: Script;
  organizationId: string;
  projectId: string;
  isNew?: boolean;
  onSavedOrCancel?: () => void;
  onSave: (name: string, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
  // Drag handle props from dnd-kit
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  onClick?: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  isNew = false,
  onSavedOrCancel,
  onSave,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  onClick,
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
    setEditing(false);
    try {
      await onSave(name, text);
    } catch (e: any) {
      setError(e?.message || "Failed to save script.");
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
        <Card
          sx={{
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            opacity: saving ? 0.7 : 1,
            outline: active ? "2.5px solid #abf43e" : "none",
            outlineOffset: "0px",
            borderRadius: 2,
          }}
        >
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
              <Box sx={{ mt: 1 }}>
                <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
              </Box>
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
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Card
        sx={{
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          opacity: deleting ? 0.5 : 1,
          outline: active ? "2.5px solid #abf43e" : "none",
          outlineOffset: "0px",
          borderRadius: 2,
          transition: "outline 0.15s",
          background: "#272927",
          p: 0,
        }}
        onClick={onClick}
      >
        <ScriptCardHeader
          name={name}
          editing={editing}
          deleting={deleting}
          onEdit={() => setEditing(true)}
          onDelete={handleDelete}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          active={active}
        />
        <Divider sx={{ mb: 0, bgcolor: "#1f211f", height: 2 }} />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
          <ScriptCardBody text={text} />
          {error && (
            <Box sx={{ mt: 1, px: 2 }}>
              <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default ScriptCard;
