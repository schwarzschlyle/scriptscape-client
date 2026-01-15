import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import VisualDirectionCardBody from "../atoms/VisualDirectionCardBody";
import VisualDirectionCardHeader from "../atoms/VisualDirectionCardHeader";
import StoryboardSketchGenerationModal from "./StoryboardSketchGenerationModal";
import Box from "@mui/material/Box";
import RadialAddButton from "@components/RadialAddButton";
import CardFooter from "@components/CardFooter";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

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
  /** True while this card is generating its visuals (child orange dot). */
  generating?: boolean;
  onGenerateStoryboardSketches?: (instructions?: string) => void;
  onGenerateStoryboardSketchesAt?: (side: import("./cardSpawn").SpawnSide, instructions?: string) => void;
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
  generating = false,
  onGenerateStoryboardSketches,
  onGenerateStoryboardSketchesAt,
  pendingStoryboardSketches = false,
}) => {
  const CARD_WIDTH = 340;
  const FIXED_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [localName, setLocalName] = useState(name || "");
  const [lastSaved, setLastSaved] = useState<{ name: string }>({ name: name || "" });
  React.useEffect(() => {
    setLocalName(name || "");
    setLastSaved({ name: name || "" });
  }, [name]);

  React.useEffect(() => {
    if (!active && localName !== lastSaved.name) {
      onNameChange?.(localName);
      setLastSaved({ name: localName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const [showGenerateStoryboardModal, setShowGenerateStoryboardModal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [spawnSide, setSpawnSide] = useState<import("./cardSpawn").SpawnSide>("right");
  const disabled = isSaving || generating || pendingStoryboardSketches || !onGenerateStoryboardSketches;


  return (
    <div
      style={{ position: "relative" }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
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
            generating={generating}
            deleteDisabled={!!pendingVisualDirection || !!pendingStoryboardSketches}
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
              <VisualDirectionCardBody
                visuals={visuals}
                editable={editable && !isSaving && !deleting}
                isSaving={isSaving}
                deleting={deleting}
                error={error}
                onVisualChange={onVisualChange}
              />
            </Box>

            {/* Keep original footer + AI icon for continuity, but it does nothing now. */}
            <CardFooter
              left={null}
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
                  <img src={AiPromptIcon} alt="AI Prompt" style={{ width: 22, height: 22, display: "block" }} />
                </button>
              }
            />
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
      />

      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <RadialAddButton
          key={side}
          side={side}
          visible={hovered || active}
          disabled={disabled && !onGenerateStoryboardSketchesAt}
          ariaLabel={`Generate Storyboard Sketches (${side})`}
          onClick={() => {
            if (!onGenerateStoryboardSketchesAt && disabled) return;
            setSpawnSide(side);
            setShowGenerateStoryboardModal(true);
          }}
        />
      ))}
      {showGenerateStoryboardModal && (
        <StoryboardSketchGenerationModal
          open={showGenerateStoryboardModal}
          onClose={() => setShowGenerateStoryboardModal(false)}
          onGenerate={(instructions?: string) => {
            setShowGenerateStoryboardModal(false);
            if (onGenerateStoryboardSketchesAt) {
              onGenerateStoryboardSketchesAt(spawnSide, instructions);
              return;
            }
            onGenerateStoryboardSketches?.(instructions);
          }}
        />
      )}
    </div>
  );
};

export default VisualDirectionCard;
