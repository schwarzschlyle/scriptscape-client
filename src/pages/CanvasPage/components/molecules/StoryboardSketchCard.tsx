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
  image_url: string;
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
  /** Controlled expand state (optional) so CanvasArea can compute connector width correctly. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
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
  expanded: controlledExpanded,
  onExpandedChange,
}) => {
  const CARD_WIDTH = 340;
  const FIXED_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const expanded = typeof controlledExpanded === "boolean" ? controlledExpanded : uncontrolledExpanded;
  const [localName, setLocalName] = useState(name || "");
  const [lastSaved, setLastSaved] = useState<{ name: string }>({ name: name || "" });

  const columns = Math.max(1, Math.min(3, sketches.length || 1));

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
              className={expanded ? undefined : "canvas-scrollbar"}
              sx={{
                flex: 1,
                // When compact, allow scrolling inside the card body to access all rows.
                // When expanded, we want full height (no card-level scroll).
                overflowY: expanded ? "visible" : "auto",
                overflowX: "hidden",
              }}
            >
              <StoryboardSketchCardBody
                sketches={sketches}
                isSaving={isSaving}
                deleting={deleting}
                error={error}
                compact={!expanded}
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
                    const next = !expanded;
                    if (onExpandedChange) onExpandedChange(next);
                    else setUncontrolledExpanded(next);
                  }}
                  aria-label={expanded ? "Collapse" : "Expand"}
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
        height={expanded ? "auto" : FIXED_HEIGHT}
        style={{
          ...(expanded ? { width: CARD_WIDTH * columns } : { width: CARD_WIDTH }),
          opacity: deleting ? 0.5 : 1,
          marginTop: 16,
        }}
        active={active}
        onClick={onClick}
      />
    </div>
  );
};

export default StoryboardSketchCard;
