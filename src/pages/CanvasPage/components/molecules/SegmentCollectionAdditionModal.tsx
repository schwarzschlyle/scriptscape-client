import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

interface SegmentCollectionAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (name: string, numSegments: number) => void;
}

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

const SegmentCollectionAdditionModal: React.FC<SegmentCollectionAdditionModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [numSegments, setNumSegments] = useState(1);

  const handleGenerate = () => {
    if (numSegments > 0) {
      onGenerate("Segments", numSegments);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create New Segment Collection
        </Typography>
        <TextField
          type="number"
          label="Number of Segments"
          value={numSegments}
          onChange={e => setNumSegments(Math.max(1, parseInt(e.target.value, 10) || 1))}
          inputProps={{ min: 1, step: 1 }}
          fullWidth
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button onClick={handleGenerate} variant="contained" color="primary">
            Generate
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SegmentCollectionAdditionModal;
