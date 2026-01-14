import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import VisualDirectionCardBody from "../atoms/VisualDirectionCardBody";
import VisualDirectionCardHeader from "../atoms/VisualDirectionCardHeader";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";
import StoryboardSketchGenerationModal from "./StoryboardSketchGenerationModal";
import Box from "@mui/material/Box";
import CardFooter from "@components/CardFooter";

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
            <CardFooter
              left={null}
              center={null}
              right={
                <>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isSaving || generating || pendingStoryboardSketches ? "not-allowed" : "pointer",
                      opacity: isSaving || generating || pendingStoryboardSketches ? 0.5 : 1,
                      padding: 0,
                      margin: 0,
                      outline: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSaving && !generating && !pendingStoryboardSketches && onGenerateStoryboardSketches) {
                        setShowGenerateStoryboardModal(true);
                      }
                    }}
                    aria-label="Generate Storyboard Sketches"
                    disabled={isSaving || generating || pendingStoryboardSketches || !onGenerateStoryboardSketches}
                  >
                    <img
                      src={AiPromptIcon}
                      alt="AI Prompt"
                      style={{
                        width: 22,
                        height: 22,
                        display: "block",
                        filter: isSaving || generating || pendingStoryboardSketches ? "grayscale(1) opacity(0.5)" : "none",
                      }}
                    />
                  </button>
                </>
              }
            />
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
      />
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
