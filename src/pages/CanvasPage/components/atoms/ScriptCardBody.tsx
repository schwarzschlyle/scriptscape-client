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

const ScriptCardBody: React.FC<ScriptCardBodyProps> = (props) => (
  <CustomCardBody
    {...props}
    onDoubleClick={() => {
      if (!props.editable && props.onRequestEditBody) props.onRequestEditBody();
    }}
  >
    {props.editable && props.onTextChange ? (
      <textarea
        value={props.text}
        onChange={e => props.onTextChange!(e.target.value)}
        onBlur={props.onBodyBlur}
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
        {props.text}
      </Box>
    )}
  </CustomCardBody>
);

export default ScriptCardBody;
