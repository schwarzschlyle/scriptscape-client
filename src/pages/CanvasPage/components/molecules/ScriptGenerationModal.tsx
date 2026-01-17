import React, { useState } from "react";
import Box from "@mui/material/Box";
import CardTypography from "./CardTypography";
import { useGenerateScriptAI } from "../../../../hooks/useGenerateScriptAI";
import InputScriptIcon from "../../../../assets/input-script.svg";
import CardStyleModal from "./CardStyleModal";
import { CardModalLinkButton, CardModalPrimaryButton, CardModalSecondaryButton } from "./CardModalButtons";
import { CardModalTextInput, CardModalTextarea } from "./CardModalInputs";

interface ScriptGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, text: string) => void;
  /** Optional: allow going back to the manual-create modal. */
  onBackToCreate?: () => void;
}

const ScriptGenerationModal: React.FC<ScriptGenerationModalProps> = ({
  open,
  onClose,
  onCreate,
  onBackToCreate,
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
        // Always use "Script Input" as the title
        onCreate("Script Input", script);
      }
    } catch (e: any) {
      // error is handled by the hook
    }
  };

  return (
    <CardStyleModal
      open={open}
      onClose={onClose}
      title="Script Generation"
      titleIcon={
        <img
          src={InputScriptIcon}
          alt="Input Script"
          style={{ width: 16, height: 16, marginRight: 4, display: "inline-block", verticalAlign: "middle" }}
        />
      }
      footer={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            {onBackToCreate ? (
              <CardModalLinkButton onClick={onBackToCreate} disabled={loading}>
                Back to manual input
              </CardModalLinkButton>
            ) : null}
          </Box>

          <CardModalSecondaryButton onClick={onClose} disabled={loading}>
            Cancel
          </CardModalSecondaryButton>
          <CardModalPrimaryButton onClick={handleGenerate} disabled={!canGenerate || loading}>
            {loading ? "Generating…" : "Generate"}
          </CardModalPrimaryButton>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <CardTypography variant="projectDescription" style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
          Provide a quick brief, your brand voice, and desired duration. We’ll generate a first draft you can refine.
        </CardTypography>
        <CardModalTextInput
          label="Project Brief"
          value={brief}
          onChange={setBrief}
          placeholder="What is this project about? Who is it for?"
        />

        <CardModalTextInput
          label="Branding"
          value={branding}
          onChange={setBranding}
          placeholder="Voice / tone / style guidelines"
        />

        <CardModalTextInput
          label="Duration"
          value={duration}
          onChange={setDuration}
          placeholder="e.g. 30s, 60s, 2 minutes"
        />

        {error && (
          <Box sx={{ mt: 0.5 }}>
            <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
          </Box>
        )}

        {generatedScript ? (
          <CardModalTextarea
            label={undefined}
            value={generatedScript}
            onChange={setGeneratedScript}
            readOnly
            minRows={10}
            helperText="Review the generated draft. When you click Generate again, it will re-generate from the prompts above."
          />
        ) : (
          <Box sx={{ mt: 0.5 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              Fill out the prompts above and click <strong>Generate</strong>.
            </span>
          </Box>
        )}
      </Box>
    </CardStyleModal>
  );
};

export default ScriptGenerationModal;
