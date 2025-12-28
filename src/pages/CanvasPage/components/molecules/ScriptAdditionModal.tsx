import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

interface ScriptAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, text: string) => void;
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

const ScriptAdditionModal: React.FC<ScriptAdditionModalProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), text);
    }
  };

  React.useEffect(() => {
    if (open) {
      setName("");
      setText("");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create New Script
        </Typography>
        <TextField
          type="text"
          label="Script Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          type="text"
          label="Script Text"
          value={text}
          onChange={e => setText(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" color="primary" disabled={!name.trim()}>
            Create
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ScriptAdditionModal;
