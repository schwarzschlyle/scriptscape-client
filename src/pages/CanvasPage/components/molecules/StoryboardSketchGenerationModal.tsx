import React, { useState } from "react";
import Box from "@mui/material/Box";
import CardStyleModal from "./CardStyleModal";
import { CardModalPrimaryButton, CardModalSecondaryButton } from "./CardModalButtons";
import { CardModalTextarea } from "./CardModalInputs";

interface StoryboardSketchGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (instructions?: string) => void;
}

const StoryboardSketchGenerationModal: React.FC<StoryboardSketchGenerationModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [instructions, setInstructions] = useState<string>("");

  return (
    <CardStyleModal
      open={open}
      onClose={onClose}
      title="Generate Storyboard Sketches"
      heightPx={340}
      footer={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <CardModalSecondaryButton onClick={onClose}>Cancel</CardModalSecondaryButton>
          <CardModalPrimaryButton onClick={() => onGenerate(instructions)}>Generate</CardModalPrimaryButton>
        </Box>
      }
    >
      <CardModalTextarea
        label={undefined}
        value={instructions}
        onChange={setInstructions}
        placeholder="E.g. ‘rough thumbnails’, ‘cinematic framing’, ‘high contrast’"
        minRows={8}
        helperText="These instructions will guide the sketch style, framing, and tone. Leave empty for default results."
      />
    </CardStyleModal>
  );
};

export default StoryboardSketchGenerationModal;
