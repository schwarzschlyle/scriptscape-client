import React from "react";
import Box from "@mui/material/Box";
import EditableCardContentArea from "./EditableCardContentArea";

interface ScriptCardBodyProps {
  text: string;
  onTextChange?: (value: string) => void;
  editable?: boolean;
  onRequestEditBody?: () => void;
  onBodyBlur?: () => void;
}

const ScriptCardBody: React.FC<ScriptCardBodyProps> = ({
  text,
  editable,
  onTextChange,
  onRequestEditBody,
  onBodyBlur,
  ...rest
}) => (
  <Box sx={{ pt: 2, pb: 2 }}>
    <EditableCardContentArea
      value={text}
      editable={!!editable}
      onChange={onTextChange}
      onRequestEdit={onRequestEditBody}
      onBlur={onBodyBlur}
      minHeight={60}
      {...rest}
    />
  </Box>
);

export default ScriptCardBody;
