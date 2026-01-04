import React from "react";
import CustomCardBody from "../../../../components/CustomCardBody";
import Box from "@mui/material/Box";
import CardTypography from "../molecules/CardTypography";

interface EditableCardContentAreaProps {
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  onRequestEdit?: () => void;
  onBlur?: () => void;
  minHeight?: number;
}

const EditableCardContentArea: React.FC<EditableCardContentAreaProps> = ({
  value,
  editable,
  onChange,
  onRequestEdit,
  onBlur,
  minHeight = 60,
}) => (
  <CustomCardBody
    onDoubleClick={() => {
      if (!editable && onRequestEdit) onRequestEdit();
    }}
    style={{ minHeight }}
  >
    {editable && onChange ? (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          minHeight,
          display: "block",
        }}
      >
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          style={{
            width: "100%",
            minHeight,
            height: "100%",
            background: "transparent",
            color: "#fff",
            border: "none",
            outline: "none",
            resize: "vertical",
            fontFamily: "monospace",
            fontSize: 12,
            padding: "8px",
            textAlign: "justify",
          }}
          autoFocus
        />
      </Box>
    ) : (
      <Box
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          width: "100%",
          height: "100%",
          minHeight,
          textAlign: "justify",
        }}
      >
        <CardTypography variant="cardBody">{value}</CardTypography>
      </Box>
    )}
  </CustomCardBody>
);

export default EditableCardContentArea;
