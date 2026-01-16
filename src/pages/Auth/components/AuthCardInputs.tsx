import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export interface AuthCardTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  required?: boolean;
}

export const AuthCardTextInput: React.FC<AuthCardTextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ fontSize: 12, fontWeight: 650, color: theme.palette.text.secondary }}>{label}</Box>
      <Box
        sx={{
          background: theme.palette.card.bodyBg,
          border: `1.5px solid ${theme.palette.card.bodyBorder}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          required={required}
          style={{
            width: "100%",
            display: "block",
            background: "transparent",
            border: "none",
            outline: "none",
            color: theme.palette.text.primary,
            padding: "10px 12px",
            fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
            fontSize: 14,
            lineHeight: 1.4,
            boxSizing: "border-box",
          }}
        />
      </Box>
    </Box>
  );
};

