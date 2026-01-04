import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import VisualDirectionCardBody from "../atoms/VisualDirectionCardBody";
import VisualDirectionCardHeader from "../atoms/VisualDirectionCardHeader";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";
import StoryboardSketchGenerationModal from "./StoryboardSketchGenerationModal";
import Box from "@mui/material/Box";

interface VisualDirection {
  id?: string;
  tempId?: string;
  content: string;
  visualIndex?: number;
}

interface VisualDirectionCardProps {
  name: string;
  visuals: VisualDirection[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  active?: boolean;
  editable?: boolean;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  onClick?: () => void;
  onNameChange?: (name: string) => void;
  onVisualChange?: (visualId: string, newContent: string, index: number) => void;
  onDelete?: () => void;
  pendingVisualDirection?: boolean;
  onGenerateStoryboardSketches?: (instructions?: string) => void;
  pendingStoryboardSketches?: boolean;
}

const VisualDirectionCard: React.FC<VisualDirectionCardProps> = ({
  name,
  visuals,
  isSaving = false,
  deleting = false,
  error = null,
  active = false,
  editable = true,
  dragAttributes,
  dragListeners,
  onClick,
  onNameChange,
  onVisualChange,
  onDelete,
  pendingVisualDirection = false,
  onGenerateStoryboardSketches,
  pendingStoryboardSketches = false,
}) => {
  const CARD_WIDTH = 340;
  const FIXED_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
  const [localName, setLocalName] = useState(name || "");
  const [localVisuals, setLocalVisuals] = useState<{ content: string }[]>(visuals.map(v => ({ content: v.content || "" })));
  // Removed editingVisualIndex state (unused after refactor)
  const [lastSaved, setLastSaved] = useState<{ name: string; visuals: { content: string }[] }>({
    name: name || "",
    visuals: visuals.map(v => ({ content: v.content || "" })),
  });

  const [showGenerateStoryboardModal, setShowGenerateStoryboardModal] = useState(false);

  React.useEffect(() => {
    setLocalName(name || "");
    setLocalVisuals(visuals.map(v => ({ content: v.content || "" })));
    setLastSaved({
      name: name || "",
      visuals: visuals.map(v => ({ content: v.content || "" })),
    });
  }, [name, visuals]);

  React.useEffect(() => {
    if (visuals && visuals.length === localVisuals.length) {
      setLocalVisuals(visuals.map(v => ({ content: v.content || "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visuals]);

  React.useEffect(() => {
    if (
      !active &&
      (localName !== lastSaved.name ||
        localVisuals.some((v, i) => v.content !== (lastSaved.visuals[i]?.content ?? "")))
    ) {
      if (onNameChange && localName !== lastSaved.name) {
        onNameChange(localName);
      }
      if (onVisualChange) {
        localVisuals.forEach((vis, idx) => {
          if (vis.content !== (lastSaved.visuals[idx]?.content ?? "")) {
            const visualId = visuals[idx]?.id || "";
            if (visualId) {
              onVisualChange(visualId, vis.content, idx);
            }
          }
        });
      }
      setLastSaved({ name: localName, visuals: [...localVisuals] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div style={{ position: "relative" }}>
      <CustomCard
        header={
          <VisualDirectionCardHeader
            name={localName}
            onNameChange={setLocalName}
            deleting={deleting}
            isSaving={isSaving}
            visualsCount={visuals.length}
            onDelete={onDelete}
            dragAttributes={dragAttributes}
            dragListeners={dragListeners}
            active={active}
            editable={editable && !isSaving && !deleting}
            pendingVisualDirection={pendingVisualDirection}
            pendingStoryboardSketches={pendingStoryboardSketches}
          />
        }
        body={
          <Box className="canvas-scrollbar" sx={{ flex: 1, overflowY: "auto" }}>
            <VisualDirectionCardBody
              visuals={visuals}
              editable={editable && !isSaving && !deleting}
              isSaving={isSaving}
              deleting={deleting}
              error={error}
              onVisualChange={onVisualChange}
              extraBottomPadding
            />
          </Box>
        }
        height={FIXED_HEIGHT}
        active={active}
        style={{
          marginTop: 16,
        }}
        onClick={onClick}
      />
      <button
        style={{
          position: "absolute",
          right: 2,
          bottom: 2,
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isSaving || pendingStoryboardSketches ? "not-allowed" : "pointer",
          opacity: isSaving || pendingStoryboardSketches ? 0.5 : 1,
          padding: 0,
          margin: 0,
          outline: "none",
          zIndex: 2,
        }}
        onClick={() => {
          if (!isSaving && !pendingStoryboardSketches && onGenerateStoryboardSketches) {
            setShowGenerateStoryboardModal(true);
          }
        }}
        aria-label="Generate Storyboard Sketches"
        disabled={isSaving || pendingStoryboardSketches || !onGenerateStoryboardSketches}
      >
        <img
          src={AiPromptIcon}
          alt="AI Prompt"
          style={{
            width: 22,
            height: 22,
            display: "block",
            filter: isSaving || pendingStoryboardSketches ? "grayscale(1) opacity(0.5)" : "none",
          }}
        />
      </button>

      {showGenerateStoryboardModal && (
        <StoryboardSketchGenerationModal
          open={showGenerateStoryboardModal}
          onClose={() => setShowGenerateStoryboardModal(false)}
          onGenerate={(instructions?: string) => {
            setShowGenerateStoryboardModal(false);
            onGenerateStoryboardSketches?.(instructions);
          }}
        />
      )}
    </div>
  );
};

export default VisualDirectionCard;
