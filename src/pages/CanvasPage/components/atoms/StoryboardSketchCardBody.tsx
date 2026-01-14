import React from "react";
import Box from "@mui/material/Box";
import EditableCardContentArea from "./EditableCardContentArea";
import LoadingSpinner from "@components/LoadingSpinner";
import { useTheme, alpha } from "@mui/material/styles";

export interface StoryboardSketchCardBodyProps {
  sketches: { id?: string; name?: string; image_url: string; meta?: Record<string, any> }[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  extraBottomPadding?: boolean;
  /** Compact gallery mode: smaller images, no captions. */
  compact?: boolean;
}

const StoryboardSketchCardBody: React.FC<StoryboardSketchCardBodyProps> = ({
  sketches,
  isSaving = false,
  deleting = false,
  error = null,
  extraBottomPadding = false,
  compact = false,
}) => {
  const theme = useTheme();
  const columns = Math.max(1, Math.min(3, sketches.length || 1));
  const textBoxHeight = 66;

  const formatIndex = (idx: number) => String(idx + 1).padStart(2, "0");

  return (
    <Box sx={{ pt: 2, pb: extraBottomPadding ? 8 : 2, px: 2 }}>
      {/* Simple responsive-ish grid inside fixed-width card */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {sketches.map((s, idx) => {
          const src = s.image_url || "";
          const segmentText =
            (s as any)?.meta?.segmentText ||
            (s as any)?.meta?.segment_text ||
            (s as any)?.meta?.segment ||
            "";
          return (
            <Box
              key={s.id || idx}
              sx={{
                borderRadius: 1,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.15)"
                    : "rgba(17,24,39,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
              title={s.name || `Sketch ${idx + 1}`}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: compact ? "16 / 10" : "4 / 3",
                  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.03),
                }}
              >
                {/* Order badge (01, 02, 03, ...) */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    zIndex: 2,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.75,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(0,0,0,0.55)"
                        : "rgba(255,255,255,0.80)",
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    fontSize: 11,
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    lineHeight: 1,
                    pointerEvents: "none",
                    backdropFilter: "blur(2px)",
                  }}
                  aria-label={`Sketch ${idx + 1}`}
                >
                  {formatIndex(idx)}
                </Box>
                {!src ? (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LoadingSpinner size={20} label="" sx={{ minHeight: 0, width: "auto", py: 0 }} />
                  </Box>
                ) : (
                  <img
                    src={src}
                    alt={s.name || `Sketch ${idx + 1}`}
                    loading="lazy"
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: deleting ? 0.5 : 1,
                      filter: isSaving ? "grayscale(0.1)" : "none",
                      userSelect: "none",
                    }}
                  />
                )}
              </Box>

              {!compact && !!segmentText && (
                <Box sx={{ width: "100%", px: 1, pb: 1, pt: 1 }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: textBoxHeight,
                      overflow: "hidden",
                    }}
                    title={segmentText}
                  >
                    <div className="canvas-scrollbar" style={{ height: textBoxHeight, overflowY: "auto" }}>
                      <EditableCardContentArea value={segmentText} editable={false} minHeight={textBoxHeight} />
                    </div>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {error && (
        <Box sx={{ mt: 1 }}>
          <span style={{ color: theme.palette.error.main, fontSize: 13 }}>{error}</span>
        </Box>
      )}
    </Box>
  );
};

export default StoryboardSketchCardBody;
