import React from "react";
import Box from "@mui/material/Box";

export interface StoryboardSketchCardBodyProps {
  sketches: { id?: string; name?: string; image_base64: string }[];
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
  return (
    <Box sx={{ pt: 2, pb: extraBottomPadding ? 8 : 2, px: 2 }}>
      {/* Simple responsive-ish grid inside fixed-width card */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
        }}
      >
        {sketches.map((s, idx) => {
          const base64 = s.image_base64 || "";
          const src = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
          return (
            <Box
              key={s.id || idx}
              sx={{
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.15)",
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={s.name || `Sketch ${idx + 1}`}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
              <img
                src={src}
                alt={s.name || `Sketch ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: deleting ? 0.5 : 1,
                  filter: isSaving ? "grayscale(0.1)" : "none",
                }}
              />
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

