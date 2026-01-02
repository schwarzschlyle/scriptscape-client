import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { useGenerateScriptAI } from "../../../../hooks/useGenerateScriptAI";

interface ScriptGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, text: string) => void;
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
  onCreate,
}) => {
  const [brief, setBrief] = useState("");
  const [branding, setBranding] = useState("");
  const [duration, setDuration] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const { generate, loading, error } = useGenerateScriptAI();

  const canGenerate = brief.trim() && branding.trim() && duration.trim();

  React.useEffect(() => {
    if (open) {
      setBrief("");
      setBranding("");
      setDuration("");
      setGeneratedScript("");
    }
  }, [open]);

  const handleGenerate = async () => {
    setGeneratedScript("");
    try {
      const script = await generate(brief, branding, duration);
      setGeneratedScript(script);
      if (onCreate) {
        // Use the first line or a default as the title, and the full script as text
        const title = script.split("\n")[0] || "Generated Script";
        onCreate(title, script);
      }
    } catch (e: any) {
      // error is handled by the hook
    }
  };

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
        {error && (
          <Box sx={{ mt: 1, px: 2 }}>
            <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
          </Box>
        )}
        {generatedScript && (
          <TextField
            label="Generated Script"
            value={generatedScript}
            multiline
            minRows={4}
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{ readOnly: true }}
          />
        )}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            color="primary"
            disabled={!canGenerate || loading}
          >
            {loading ? "GENERATING..." : "GENERATE"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ScriptGenerationModal;
