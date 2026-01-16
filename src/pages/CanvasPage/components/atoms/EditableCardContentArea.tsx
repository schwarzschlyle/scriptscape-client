import React from "react";
import CustomCardBody from "../../../../components/CustomCardBody";
import Box from "@mui/material/Box";
import CardTypography from "../molecules/CardTypography";
import { useTheme } from "@mui/material/styles";

interface EditableCardContentAreaProps {
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  onRequestEdit?: () => void;
  onBlur?: () => void;
  minHeight?: number;
  /**
   * Override the rendered height (px). Used to equalize heights across multiple boxes
   * (e.g. storyboard sketch captions).
   */
  fixedHeightPx?: number;
}

const EditableCardContentArea: React.FC<EditableCardContentAreaProps> = ({
  value,
  editable,
  onChange,
  onRequestEdit,
  onBlur,
  minHeight = 60,
  fixedHeightPx,
}) => {
  const theme = useTheme();

  // Prevent collapsing when toggling edit mode:
  // lock the height to whatever was rendered just before switching to editable.
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [lockedHeightPx, setLockedHeightPx] = React.useState<number | null>(null);

  // Keep track of the maximum height we've ever rendered for this field.
  // This prevents “collapse” when switching view <-> edit, and also preserves
  // height if the user edits content to be shorter.
  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    const h = Math.ceil(containerRef.current.getBoundingClientRect().height);
    if (!h || !isFinite(h)) return;
    setLockedHeightPx((prev) => {
      const prevVal = prev ?? 0;
      return Math.max(prevVal, h);
    });
  }, [value, editable]);

  const effectiveMinHeight = Math.max(minHeight, lockedHeightPx ?? 0, fixedHeightPx ?? 0);

  return (
    <CustomCardBody
      ref={containerRef}
      onDoubleClick={() => {
        if (!editable && onRequestEdit) onRequestEdit();
      }}
      style={{ minHeight: effectiveMinHeight, ...(fixedHeightPx ? { height: fixedHeightPx } : null) }}
    >
      {editable && onChange ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            minHeight: effectiveMinHeight,
            display: "block",
          }}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            style={{
              width: "100%",
              minHeight: effectiveMinHeight,
              height: "100%",
              background: "transparent",
              color: theme.palette.text.primary,
              border: "none",
              outline: "none",
              // Keeping this from resizing helps preserve equalized heights and avoids jitter.
              resize: "none",
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
            minHeight: effectiveMinHeight,
            textAlign: "justify",
            ...(fixedHeightPx ? { overflow: "hidden" } : null),
          }}
        >
          <CardTypography variant="cardBody">{value}</CardTypography>
        </Box>
      )}
    </CustomCardBody>
  );
};

export default EditableCardContentArea;
