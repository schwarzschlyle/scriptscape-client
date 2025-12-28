import React, { useState } from "react";
import type { Script } from "@api/scripts/types";
import CustomCard from "../../../../components/CustomCard";
import ScriptCardHeader from "../atoms/ScriptCardHeader";
import ScriptCardBody from "../atoms/ScriptCardBody";
import Box from "@mui/material/Box";
import SegmentCollectionAdditionModal from "./SegmentCollectionAdditionModal";
import SegmentCollectionCard from "./SegmentCollectionCard";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

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
  isSaving?: boolean;
  deleting?: boolean;
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
  isSaving = false,
  deleting = false,
}) => {
  const [text, setText] = useState(script.text || "");
  const [name, setName] = useState(script.name || "");
  // Remove local saving/deleting state, use props only
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
        setError(null);
        try {
          await onSave(name, text);
          setLastSaved({ name, text });
        } catch (e: any) {
          setError(e?.message || "Failed to save script.");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleDelete = async () => {
    if (isSaving || deleting) return;
    setError(null);
    try {
      await onDelete();
    } catch (e: any) {
      setError(e?.message || "Failed to delete script.");
    }
  };

  return (
    <CustomCard
      header={
        <ScriptCardHeader
          name={name}
          onNameChange={setName}
          deleting={deleting}
          isSaving={isSaving}
          onDelete={handleDelete}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          active={active}
          editable={!isSaving && !deleting}
        />
      }
      body={
        <>
          <ScriptCardBody
            text={text}
            onTextChange={setText}
            editable={editingBody && !isSaving && !deleting}
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
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <button
              style={{
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.5 : 1,
                padding: 0,
                margin: 0,
                outline: "none",
              }}
              onClick={() => {
                if (!isSaving) setShowAddSegmentCollectionModal(true);
              }}
              aria-label="Generate Segments"
              disabled={isSaving}
            >
              <img
                src={AiPromptIcon}
                alt="AI Prompt"
                style={{
                  width: 22,
                  height: 22,
                  display: "block",
                  filter: isSaving ? "grayscale(1) opacity(0.5)" : "none",
                }}
              />
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
