import React, { useState } from "react";
import Box from "@mui/material/Box";
import GenerateSegmentsIcon from "../../../../assets/generate-segments-icon.svg";
import CardStyleModal from "./CardStyleModal";
import { CardModalPrimaryButton, CardModalSecondaryButton } from "./CardModalButtons";
import CardTypography from "./CardTypography";
import { CardModalTextarea } from "./CardModalInputs";

interface SegmentCollectionAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (name: string, numSegments: number) => void;
}

const SegmentCollectionAdditionModal: React.FC<SegmentCollectionAdditionModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [numSegmentsText, setNumSegmentsText] = useState("1");

  const numSegments = Math.max(1, parseInt(numSegmentsText, 10) || 1);

  const handleGenerate = () => {
    if (numSegments > 0) {
      onGenerate("Segments", numSegments);
    }
  };

  return (
    <CardStyleModal
      open={open}
      onClose={onClose}
      title="Split to Beats"
      titleIcon={
        <img
          src={GenerateSegmentsIcon}
          alt="Generate Segments"
          style={{ width: 16, height: 16, marginRight: 4, display: "inline-block", verticalAlign: "middle" }}
        />
      }
      heightPx={300}
      footer={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <CardModalSecondaryButton onClick={onClose}>Cancel</CardModalSecondaryButton>
          <CardModalPrimaryButton onClick={handleGenerate}>Generate</CardModalPrimaryButton>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <CardTypography variant="projectDescription" style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
          Choose how many segments to start with.
        </CardTypography>

        <CardModalTextarea
          label={undefined}
          value={numSegmentsText}
          onChange={(v) => setNumSegmentsText(v.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 8"
          minRows={1}
          scrollable={false}
          helperText={undefined}
        />

        <CardTypography variant="projectDescription" style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
          This creates a new collection and prepares {numSegments} segment{numSegments === 1 ? "" : "s"} for editing.
        </CardTypography>
      </Box>
    </CardStyleModal>
  );
};

export default SegmentCollectionAdditionModal;
