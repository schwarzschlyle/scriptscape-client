import React, { useState } from "react";
import type { Script } from "@api/scripts/types";
import CustomCard from "../../../../components/CustomCard";
import ScriptCardHeader from "../atoms/ScriptCardHeader";
import ScriptCardBody from "../atoms/ScriptCardBody";
import Box from "@mui/material/Box";
import SegmentCollectionAdditionModal from "./SegmentCollectionAdditionModal";
import { useTheme } from "@mui/material/styles";
import RadialAddButton from "@components/RadialAddButton";
import type { SpawnSide } from "./cardSpawn";
import CardFooter from "@components/CardFooter";
import Typography from "@mui/material/Typography";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

interface ScriptCardProps {
  script: Script;
  organizationId: string;
  projectId: string;
  isNew?: boolean;
  onSavedOrCancel?: () => void;
  onSave: (name: string, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  onClick?: () => void;
  onAddSegmentCollection?: (name: string, numSegments: number) => void;
  onAddSegmentCollectionAt?: (side: SpawnSide, name: string, numSegments: number) => void;
  isSaving?: boolean;
  deleting?: boolean;
  pendingSegmentCollection?: boolean;
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
  onAddSegmentCollectionAt,
  isSaving = false,
  deleting = false,
  pendingSegmentCollection = false,
}) => {
  const theme = useTheme();
  const CARD_WIDTH = 340;
  const FIXED_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [text, setText] = useState(script.text || "");
  const [name, setName] = useState(script.name || "");

  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState({ name: script.name || "", text: script.text || "" });
  const [editingBody, setEditingBody] = useState(false);

  const [showAddSegmentCollectionModal, setShowAddSegmentCollectionModal] = useState(false);
  const [spawnSide, setSpawnSide] = useState<SpawnSide>("right");

  const handleAddSegmentCollection = (name: string, numSegments: number) => {
    setShowAddSegmentCollectionModal(false);
    if (onAddSegmentCollectionAt) {
      onAddSegmentCollectionAt(spawnSide, name, numSegments);
      return;
    }
    onAddSegmentCollection?.(name, numSegments);
  };

  React.useEffect(() => {
    if (!active && editingBody) {
      setEditingBody(false);
    }
  }, [active, editingBody]);

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
    <div
      className="canvas-card-radials"
      data-active={active ? "true" : "false"}
      style={{ position: "relative" }}
    >
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
            pendingSegmentCollection={pendingSegmentCollection}
            expanded={isFullHeight}
            onExpandedChange={setIsFullHeight}
          />
        }
        body={
          <>
            <Box
              className={isFullHeight ? undefined : "canvas-scrollbar"}
              sx={{
                flex: 1,
                overflowY: isFullHeight ? "visible" : "auto",
              }}
            >
              <ScriptCardBody
                text={text}
                onTextChange={setText}
                editable={editingBody && !isSaving && !deleting}
                onRequestEditBody={() => setEditingBody(true)}
                onBodyBlur={() => setEditingBody(false)}
              />
              {error && (
                <Box sx={{ mt: 1, px: 2 }}>
                  <span style={{ color: theme.palette.error.main, fontSize: 13 }}>{error}</span>
                </Box>
              )}
              {showAddSegmentCollectionModal && (
                <SegmentCollectionAdditionModal
                  open={showAddSegmentCollectionModal}
                  onClose={() => setShowAddSegmentCollectionModal(false)}
                  onGenerate={handleAddSegmentCollection}
                />
              )}
            </Box>

            <CardFooter
              left={
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                  Click the (+) buttons on the edges to generate segment variations
                </Typography>
              }
              center={null}
              right={
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
                    opacity: 0.85,
                    padding: 0,
                    margin: 0,
                    outline: "none",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="AI (inactive)"
                >
                  <img
                    src={AiPromptIcon}
                    alt="AI Prompt"
                    style={{ width: 22, height: 22, display: "block" }}
                  />
                </button>
              }
            />
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
        style={{ opacity: deleting ? 0.5 : 1 }}
      />

      {/* Render as sibling so it isn't clipped by the card's overflow:hidden */}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <RadialAddButton
          key={side}
          side={side}
          disabled={isSaving || pendingSegmentCollection}
          ariaLabel={`Add Segment Collection (${side})`}
          onClick={() => {
            if (isSaving || pendingSegmentCollection) return;
            setSpawnSide(side);
            setShowAddSegmentCollectionModal(true);
          }}
        />
      ))}
    </div>
  );
};

export default ScriptCard;
