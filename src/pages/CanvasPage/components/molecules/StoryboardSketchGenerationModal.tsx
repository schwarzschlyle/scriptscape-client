import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

interface StoryboardSketchGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (instructions?: string) => void;
}

// Match SegmentCollectionAdditionModal styling for consistency
const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 340,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const StoryboardSketchGenerationModal: React.FC<StoryboardSketchGenerationModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [instructions, setInstructions] = useState<string>("");

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Generate Storyboard Sketches
        </Typography>
        <TextField
          label="Optional instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="E.g. ‘rough thumbnails’, ‘cinematic framing’, ‘high contrast’"
          fullWidth
          multiline
          minRows={3}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => onGenerate(instructions)}
            variant="contained"
            color="primary"
          >
            Generate
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default StoryboardSketchGenerationModal;

