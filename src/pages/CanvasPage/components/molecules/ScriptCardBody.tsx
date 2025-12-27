import React from "react";
import Box from "@mui/material/Box";

interface ScriptCardBodyProps {
  text: string;
  onTextChange?: (value: string) => void;
  editable?: boolean;
  onRequestEditBody?: () => void;
  onBodyBlur?: () => void;
}

const ScriptCardBody: React.FC<ScriptCardBodyProps> = ({
  text,
  onTextChange,
  editable,
  onRequestEditBody,
  onBodyBlur,
}) => (
  <Box
    sx={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      p: 2,
      boxSizing: "border-box",
      background: "#2F312F",
      border: "1.5px solid #1f211f",
      borderRadius: 4,
      minHeight: 60,
      mt: 2,
      mb: 2,
      cursor: editable ? "text" : "pointer",
      textAlign: !editable ? "center" : "left",
      alignItems: !editable ? "center" : "stretch",
      justifyContent: !editable ? "center" : "flex-start",
    }}
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
  </Box>
);

export default ScriptCardBody;
