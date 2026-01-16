import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "center",
        px: 2,
        py: { xs: 3, sm: 4 },
        overflowY: "auto",
        bgcolor: "background.default",
        // Subtle background texture so auth pages feel more "designed".
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.success.main, 0.12)} 0%, transparent 35%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.success.main, 0.10)} 0%, transparent 40%)`
            : `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 35%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 40%)`,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          filter:
            theme.palette.mode === "dark"
              ? "drop-shadow(0 18px 50px rgba(0,0,0,0.55))"
              : "drop-shadow(0 18px 50px rgba(0,0,0,0.18))",
        }}
      >
        <CustomCard
          sx={{
            // Glass effect consistent with the new canvas modals.
            backgroundImage:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.62) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(17,24,39,0.10)",
          }}
          header={
            <CustomCardHeader
              editable={false}
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2, paddingBottom: 2 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      background:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(17,24,39,0.06)",
                    }}
                  >
                    <img
                      src="/scriptscape-favicon.svg"
                      alt="ScriptScape"
                      style={{ width: 16, height: 16, display: "block" }}
                    />
                  </span>
                  <CardTypography variant="cardType" style={{ fontWeight: 750, fontSize: 16 }}>
                    {title}
                  </CardTypography>
                </span>
              }
              actions={
                <Box sx={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                  <CardStatusDot status="active" size={10} />
                </Box>
              }
            />
          }
          body={
            <Box sx={{ px: 2, pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left" }}>
                  {subtitle}
                </Typography>
              ) : null}
              {children}
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
