import React, { useState } from "react";
import Box from "@mui/material/Box";
import ScriptIcon from "../../../../assets/script-icon.svg";
import CardStyleModal from "./CardStyleModal";
import { CardModalPrimaryButton, CardModalSecondaryButton } from "./CardModalButtons";
import { CardModalTextarea } from "./CardModalInputs";
import CardTypography from "./CardTypography";

interface ScriptAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, text: string) => void;
  onGenerate: () => void;
}

const ScriptAdditionModal: React.FC<ScriptAdditionModalProps> = ({
  open,
  onClose,
  onCreate,
  onGenerate,
}) => {
  const [text, setText] = useState("");

  const handleCreate = () => {
    if (text.trim()) {
      onCreate("Script Input", text);
    }
  };

  React.useEffect(() => {
    if (open) {
      setText("");
    }
  }, [open]);

  return (
    <CardStyleModal
      open={open}
      onClose={onClose}
      title="Create New Script"
      titleIcon={
        <img
          src={ScriptIcon}
          alt="Script"
          style={{ width: 16, height: 16, marginRight: 4, display: "inline-block", verticalAlign: "middle" }}
        />
      }
      footer={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <CardModalSecondaryButton onClick={onClose}>
            Cancel
          </CardModalSecondaryButton>
          <CardModalPrimaryButton
            onClick={onGenerate}
            sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            Generate with AI
          </CardModalPrimaryButton>
          <CardModalPrimaryButton onClick={handleCreate} disabled={!text.trim()}>
            Create
          </CardModalPrimaryButton>
        </Box>
      }
    >
      <CardTypography variant="projectDescription" style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35, marginBottom: 8 }}>
        Paste an existing script or write one from scratch. You can also generate a draft using AI.
      </CardTypography>
      <CardModalTextarea
        label={undefined}
        value={text}
        onChange={setText}
        placeholder="Paste a script, or type your own..."
        minRows={12}
        helperText="Tip: keep one idea per paragraph for cleaner segmenting."
      />
    </CardStyleModal>
  );
};

export default ScriptAdditionModal;
