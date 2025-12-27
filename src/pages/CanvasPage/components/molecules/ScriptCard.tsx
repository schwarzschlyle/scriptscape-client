import React, { useState } from "react";
import type { Script } from "@api/scripts/types";
import CustomCard from "../../../../components/CustomCard";
import ScriptCardHeader from "../atoms/ScriptCardHeader";
import ScriptCardBody from "../atoms/ScriptCardBody";
import Box from "@mui/material/Box";
import SegmentCollectionAdditionModal from "./SegmentCollectionAdditionModal";
import SegmentCollectionCard from "./SegmentCollectionCard";

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
  onAddSegmentCollection?: (name: string, numSegments: number) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onSave,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  onClick,
  onAddSegmentCollection,
}) => {
  const [text, setText] = useState(script.text || "");
  const [name, setName] = useState(script.name || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState({ name: script.name || "", text: script.text || "" });
  const [editingBody, setEditingBody] = useState(false);

  // Segment collection state
  const [segmentCollections, setSegmentCollections] = useState<any[]>([]);
  const [showAddSegmentCollectionModal, setShowAddSegmentCollectionModal] = useState(false);

  // Handler for adding a new segment collection (calls parent handler)
  const handleAddSegmentCollection = (name: string, numSegments: number) => {
    setShowAddSegmentCollectionModal(false);
    if (onAddSegmentCollection) {
      onAddSegmentCollection(name, numSegments);
    }
  };

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
    <CustomCard
      header={
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
      }
      body={
        <>
          <ScriptCardBody
            text={text}
            onTextChange={setText}
            editable={editingBody && !saving && !deleting}
            onRequestEditBody={() => setEditingBody(true)}
            onBodyBlur={() => setEditingBody(false)}
          >
            {error && (
              <Box sx={{ mt: 1, px: 2 }}>
                <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
              </Box>
            )}
          </ScriptCardBody>
          {/* + Button for adding segment collection */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <button
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#73a32c",
                color: "#fff",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
                transition: "background 0.2s",
              }}
              onClick={() => setShowAddSegmentCollectionModal(true)}
              aria-label="Add Segment Collection"
            >
              +
            </button>
          </Box>
          {/* Modal for adding segment collection */}
          {showAddSegmentCollectionModal && (
            <SegmentCollectionAdditionModal
              open={showAddSegmentCollectionModal}
              onClose={() => setShowAddSegmentCollectionModal(false)}
              onGenerate={handleAddSegmentCollection}
            />
          )}
          {/* Segment collections are now rendered as top-level cards in CanvasArea */}
        </>
      }
      minHeight={220}
      active={active}
      onClick={onClick}
      style={{ opacity: deleting ? 0.5 : 1 }}
    />
  );
};

export default ScriptCard;
