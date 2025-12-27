import React, { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
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
  onSave,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  onClick,
}) => {
  const [text, setText] = useState(script.text || "");
  const [name, setName] = useState(script.name || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState({ name: script.name || "", text: script.text || "" });
  const [editingBody, setEditingBody] = useState(false);

  // Exit body editing on card deactivation
  React.useEffect(() => {
    if (!active && editingBody) {
      setEditingBody(false);
    }
  }, [active, editingBody]);

  // Save on deactivate (when active goes from true to false)
  React.useEffect(() => {
    if (!active && (name !== lastSaved.name || text !== lastSaved.text)) {
      (async () => {
        setSaving(true);
        setError(null);
        try {
          await onSave(name, text);
          setLastSaved({ name, text });
        } catch (e: any) {
          setError(e?.message || "Failed to save script.");
        } finally {
          setSaving(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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
          backgroundColor: "#272927",
          overflow: "hidden",
          p: 0,
        }}
        onClick={onClick}
      >
        <ScriptCardHeader
          name={name}
          onNameChange={setName}
          deleting={deleting}
          onDelete={handleDelete}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          active={active}
          editable={!saving && !deleting}
        />
        <Divider sx={{ mb: 0, bgcolor: "#1f211f", height: 2 }} />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
          <ScriptCardBody
            text={text}
            onTextChange={setText}
            editable={editingBody && !saving && !deleting}
            onRequestEditBody={() => setEditingBody(true)}
            onBodyBlur={() => setEditingBody(false)}
          />
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
