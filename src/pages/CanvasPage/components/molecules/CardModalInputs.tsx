import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import CardTypography from "./CardTypography";

export interface CardModalTextareaProps {
  /** Optional label displayed above the field (kept subtle). */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  helperText?: string;
  readOnly?: boolean;
  /** Allow the textarea to scroll internally if content exceeds the box. */
  scrollable?: boolean;
}

export interface CardModalTextInputProps {
  /** Optional label displayed above the field (kept subtle). */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  type?: React.HTMLInputTypeAttribute;
  readOnly?: boolean;
}

/**
 * A canvas-card styled single-line input for modals.
 */
export const CardModalTextInput: React.FC<CardModalTextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  type = "text",
  readOnly = false,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {label ? (
        <CardTypography variant="cardType" style={{ fontSize: 12, opacity: 0.9 }}>
          {label}
        </CardTypography>
      ) : null}

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
          readOnly={readOnly}
          style={{
            width: "100%",
            display: "block",
            background: "transparent",
            border: "none",
            outline: "none",
            color: theme.palette.text.primary,
            padding: "10px 12px",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
      </Box>

      {helperText ? (
        <CardTypography
          variant="projectDescription"
          style={{
            fontSize: 12,
            opacity: 0.85,
            lineHeight: 1.35,
          }}
        >
          {helperText}
        </CardTypography>
      ) : null}
    </Box>
  );
};

/**
 * A canvas-card styled textarea for modals (matches CustomCardBody aesthetic).
 */
export const CardModalTextarea: React.FC<CardModalTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minRows = 10,
  helperText,
  readOnly = false,
  scrollable = true,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {label ? (
        <CardTypography variant="cardType" style={{ fontSize: 12, opacity: 0.9 }}>
          {label}
        </CardTypography>
      ) : null}
      <Box
        sx={{
          background: theme.palette.card.bodyBg,
          border: `1.5px solid ${theme.palette.card.bodyBorder}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          readOnly={readOnly}
          style={{
            width: "100%",
            display: "block",
            background: "transparent",
            border: "none",
            outline: "none",
            color: theme.palette.text.primary,
            padding: "12px",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.65,
            resize: "none",
            overflowY: scrollable ? "auto" : "hidden",
            boxSizing: "border-box",
          }}
        />
      </Box>
      {helperText ? (
        <CardTypography
          variant="projectDescription"
          style={{
            fontSize: 12,
            opacity: 0.85,
            lineHeight: 1.35,
          }}
        >
          {helperText}
        </CardTypography>
      ) : null}
    </Box>
  );
};
