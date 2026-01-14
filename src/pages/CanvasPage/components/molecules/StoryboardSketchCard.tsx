import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import StoryboardSketchCardHeader from "../atoms/StoryboardSketchCardHeader";
import StoryboardSketchCardBody from "../atoms/StoryboardSketchCardBody";
import Box from "@mui/material/Box";
import CardFooter from "@components/CardFooter";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** True while storyboard sketches are being generated (child orange dot). */
  generating?: boolean;
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
  generating = false,
}) => {
  const theme = useTheme();
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
            generating={generating}
          />
        }
        body={
          <>
            <Box
              className={expanded ? undefined : "canvas-scrollbar"}
              sx={{
                flex: 1,
                overflowY: expanded ? "visible" : "auto",
                overflowX: "hidden",
              }}
            >
              <StoryboardSketchCardBody sketches={sketches} isSaving={isSaving} deleting={deleting} error={error} compact={!expanded} />
            </Box>

            <CardFooter
              left={null}
              center={
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !expanded;
                    if (onExpandedChange) onExpandedChange(next);
                    else setUncontrolledExpanded(next);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              }
              right={null}
            />

            {error && (
              <Box sx={{ mt: 1, px: 2 }}>
                <span style={{ color: theme.palette.error.main, fontSize: 13 }}>{error}</span>
              </Box>
            )}
          </>
        }
        height={expanded ? "auto" : FIXED_HEIGHT}
        style={{
          ...(expanded ? { width: CARD_WIDTH * columns } : { width: CARD_WIDTH }),
          opacity: deleting ? 0.5 : 1,
        }}
        active={active}
        onClick={onClick}
      />
    </div>
  );
};

export default StoryboardSketchCard;
