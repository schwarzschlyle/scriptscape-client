import React from "react";
import Box from "@mui/material/Box";

interface ScriptCardBodyProps {
  text: string;
}

const ScriptCardBody: React.FC<ScriptCardBodyProps> = ({ text }) => (
  <Box
    sx={{
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontFamily: "monospace",
      fontSize: 12,
      color: "#fff",
      background: "#272927",
      px: 2,
      py: 1,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      minHeight: 60,
    }}
  >
    {text}
  </Box>
);

export default ScriptCardBody;
