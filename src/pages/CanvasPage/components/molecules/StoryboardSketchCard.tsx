import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import StoryboardSketchCardHeader from "../atoms/StoryboardSketchCardHeader";
import StoryboardSketchCardBody from "../atoms/StoryboardSketchCardBody";
import Box from "@mui/material/Box";
import CardFooter from "@components/CardFooter";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

interface StoryboardSketch {
  id?: string;
  name?: string;
  image_base64: string;
}

interface StoryboardSketchCardProps {
  name: string;
  sketches: StoryboardSketch[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  active?: boolean;
  editable?: boolean;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  onClick?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  // no pending indicator on child cards (parent shows blue dot while generating)
}

const StoryboardSketchCard: React.FC<StoryboardSketchCardProps> = ({
  name,
  sketches,
  isSaving = false,
  deleting = false,
  error = null,
  active = false,
  editable = true,
  dragAttributes,
  dragListeners,
  onClick,
  onNameChange,
  onDelete,
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

  return (
    <div style={{ position: "relative" }}>
      <CustomCard
        header={
          <StoryboardSketchCardHeader
            name={localName}
            onNameChange={setLocalName}
            deleting={deleting}
            isSaving={isSaving}
            sketchesCount={sketches.length}
            onDelete={onDelete}
            dragAttributes={dragAttributes}
            dragListeners={dragListeners}
            active={active}
            editable={editable && !isSaving && !deleting}
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
              <StoryboardSketchCardBody
                sketches={sketches}
                isSaving={isSaving}
                deleting={deleting}
                error={error}
              />
            </Box>

            <CardFooter
              left={null}
              center={
                <button
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                    outline: "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullHeight((v) => !v);
                  }}
                  aria-label={isFullHeight ? "Use fixed height" : "Use full height"}
                >
                  <img
                    src={AiPromptIcon}
                    alt="Expand/Collapse"
                    style={{ width: 22, height: 22, display: "block", opacity: 0.9 }}
                  />
                </button>
              }
              right={null}
            />
            {error && (
              <Box sx={{ mt: 1, px: 2 }}>
                <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
              </Box>
            )}
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
        style={{ opacity: deleting ? 0.5 : 1, marginTop: 16 }}
      />
    </div>
  );
};

export default StoryboardSketchCard;
