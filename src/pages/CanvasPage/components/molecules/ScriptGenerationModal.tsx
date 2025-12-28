import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

interface ScriptGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => void;
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

const ScriptGenerationModal: React.FC<ScriptGenerationModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [brief, setBrief] = useState("");
  const [branding, setBranding] = useState("");
  const [duration, setDuration] = useState("");

  const canGenerate = brief.trim() && branding.trim() && duration.trim();

  React.useEffect(() => {
    if (open) {
      setBrief("");
      setBranding("");
      setDuration("");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Script Generation
        </Typography>
        <TextField
          type="text"
          label="Project Brief"
          value={brief}
          onChange={e => setBrief(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          type="text"
          label="Branding"
          value={branding}
          onChange={e => setBranding(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          type="text"
          label="Duration"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            variant="contained"
            color="primary"
            disabled={!canGenerate}
          >
            GENERATE
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ScriptGenerationModal;
