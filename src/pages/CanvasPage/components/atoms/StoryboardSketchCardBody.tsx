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
  const measureRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [captionHeightPx, setCaptionHeightPx] = React.useState<number>(66);

  const formatIndex = (idx: number) => String(idx + 1).padStart(2, "0");

  // Equalize caption heights across all sketches in this card.
  // We measure the natural height of each caption (no scrollbars), then apply the max.
  React.useLayoutEffect(() => {
    if (compact) return; // captions not shown
    const els = measureRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    const heights = els.map((el) => Math.ceil(el.getBoundingClientRect().height));
    const max = Math.max(66, ...heights);
    if (isFinite(max) && max > 0 && max !== captionHeightPx) setCaptionHeightPx(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketches, compact, columns]);

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
                  {/* Hidden measurement node (same width/font) to find the tallest caption. */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <Box
                      ref={(el: HTMLDivElement | null) => {
                        measureRefs.current[idx] = el;
                      }}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        visibility: "hidden",
                        pointerEvents: "none",
                        // This matches the internal padding/typography of EditableCardContentArea.
                        border: "1px solid transparent",
                      }}
                    >
                      <EditableCardContentArea value={segmentText} editable={false} minHeight={66} />
                    </Box>

                    {/* Visible caption (equalized height, no scrollbars). */}
                    <Box title={segmentText} sx={{ width: "100%" }}>
                      <EditableCardContentArea
                        value={segmentText}
                        editable={false}
                        minHeight={captionHeightPx}
                        fixedHeightPx={captionHeightPx}
                      />
                    </Box>
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
