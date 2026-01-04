import React from "react";
import Box from "@mui/material/Box";
import EditableCardContentArea from "./EditableCardContentArea";

export interface StoryboardSketchCardBodyProps {
  sketches: { id?: string; name?: string; image_base64: string; meta?: Record<string, any> }[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  extraBottomPadding?: boolean;
}

const StoryboardSketchCardBody: React.FC<StoryboardSketchCardBodyProps> = ({
  sketches,
  isSaving = false,
  deleting = false,
  error = null,
  extraBottomPadding = false,
}) => {
  const columns = Math.max(1, Math.min(3, sketches.length || 1));
  // Caption is fixed-height to keep the grid consistent.
  // Give it a bit more room than strict 3 lines so nothing gets visually clipped.
  const textBoxHeight = 66;

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
          const rawSrc = s.image_base64 || "";
          // NOTE: after refresh, we load from IndexedDB as Blob and convert to a blob: URL.
          // Avoid wrapping blob: URLs with `data:image/png;base64,`.
          const src =
            rawSrc.startsWith("data:") || rawSrc.startsWith("blob:") || rawSrc.startsWith("http")
              ? rawSrc
              : `data:image/png;base64,${rawSrc}`;
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
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.15)",
                // Allow the caption area to be visible (don't lock the container to a square)
                // while keeping the image itself square.
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
              title={s.name || `Sketch ${idx + 1}`}
            >
              <img
                src={src}
                alt={s.name || `Sketch ${idx + 1}`}
                style={{
                  width: "100%",
                  // Keep tiles compact (not too tall) while leaving room for captions.
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  display: "block",
                  opacity: deleting ? 0.5 : 1,
                  filter: isSaving ? "grayscale(0.1)" : "none",
                }}
              />
              {!!segmentText && (
                <Box sx={{ width: "100%", px: 1, pb: 1, pt: 1 }}>
                  {/* Use the exact same container component styling as other cards */}
                  <Box
                    sx={{
                      width: "100%",
                      height: textBoxHeight,
                      overflow: "hidden",
                    }}
                    title={segmentText}
                  >
                    <EditableCardContentArea
                      value={segmentText}
                      editable={false}
                      minHeight={textBoxHeight}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {error && (
        <Box sx={{ mt: 1 }}>
          <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
        </Box>
      )}
    </Box>
  );
};

export default StoryboardSketchCardBody;
