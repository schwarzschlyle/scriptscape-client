import React from "react";
import CustomCardBody from "../../../../components/CustomCardBody";
import Box from "@mui/material/Box";

interface ScriptCardBodyProps {
  text: string;
  onTextChange?: (value: string) => void;
  editable?: boolean;
  onRequestEditBody?: () => void;
  onBodyBlur?: () => void;
  children?: React.ReactNode;
}

const ScriptCardBody: React.FC<ScriptCardBodyProps> = ({
  text,
  editable,
  children,
  // Do not pass these to CustomCardBody:
  onTextChange,
  onRequestEditBody,
  onBodyBlur,
  ...rest
}) => (
  <CustomCardBody
    {...rest}
    onDoubleClick={() => {
      if (!editable && onRequestEditBody) onRequestEditBody();
    }}
  >
    {editable && onTextChange ? (
      <textarea
        value={text}
        onChange={e => onTextChange(e.target.value)}
        onBlur={onBodyBlur}
        style={{
          width: "100%",
          minHeight: 60,
          background: "transparent",
          color: "#fff",
          border: "none",
          outline: "none",
          resize: "vertical",
          fontFamily: "monospace",
          fontSize: 14,
          padding: "8px",
        }}
        autoFocus
      />
    ) : (
      <Box
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "monospace",
          fontSize: 14,
          color: "#fff",
          width: "100%",
          textAlign: "center",
        }}
      >
        {text}
      </Box>
    )}
  </CustomCardBody>
);

export default ScriptCardBody;
