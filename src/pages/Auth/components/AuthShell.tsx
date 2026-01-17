import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CardFooter from "@components/CardFooter";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showHeaderStatusDot,
  hideHeader,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Keep for parity with canvas cards; default true. */
  showHeaderStatusDot?: boolean;
  /** If true, card header area is rendered but empty (no icon/title/actions). */
  hideHeader?: boolean;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // Use dynamic viewport units so mobile browsers (Safari/Chrome) don't
        // mis-center due to URL bars changing the visible viewport.
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 2, sm: 4 },
        boxSizing: "border-box",
        overflowY: "auto",
        bgcolor: "background.default",
        // Canvas-like dotted grid background + subtle radial accents.
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle, ${alpha(theme.palette.canvas.gridMinorDot, 0.18)} 0.5px, transparent 0.5px),
               radial-gradient(circle, ${alpha(theme.palette.canvas.gridMajorDot, 0.22)} 1px, transparent 1px),
               radial-gradient(circle at 15% 10%, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 40%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.success.main, 0.05)} 0%, transparent 48%)`
            : `radial-gradient(circle, ${alpha(theme.palette.canvas.gridMinorDot, 0.22)} 0.5px, transparent 0.5px),
               radial-gradient(circle, ${alpha(theme.palette.canvas.gridMajorDot, 0.26)} 1px, transparent 1px),
               radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 40%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 48%)`,
        backgroundSize: "26px 26px, 120px 120px, auto, auto",
        backgroundPosition: "0 0, 0 0, 0 0, 0 0",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          // Ensure the card stays centered while still allowing scroll
          // if the keyboard shrinks the viewport.
          my: { xs: 1.5, sm: 0 },
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
              title={hideHeader ? "" : title}
              actions={
                // keep status dot even when header is "empty" for auth pages
                showHeaderStatusDot === false ? null : (
                  <Box sx={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                    <CardStatusDot status="active" size={10} />
                  </Box>
                )
              }
            />
          }
          body={
            <>
              <Box sx={{ px: 2, pt: 2, pb: footer ? 1 : 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* If header is hidden, render the auth logo + title here instead. */}
                {hideHeader ? (
                  <>
                    <img
                      src="/scriptscape-favicon.svg"
                      alt="ScriptScape"
                      style={{ width: 36, height: 36, display: "block", marginLeft: "auto", marginRight: "auto" }}
                    />
                    <CardTypography
                      variant="cardType"
                      style={{ fontWeight: 850, fontSize: 18, textAlign: "center", marginTop: 10 }}
                    >
                      {title}
                    </CardTypography>
                  </>
                ) : null}
                {subtitle ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left" }}>
                    {subtitle}
                  </Typography>
                ) : null}
                {children}
              </Box>
              {footer ? (
                <CardFooter
                  left={null}
                  center={
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                      {footer}
                    </Typography>
                  }
                  right={null}
                  height={44}
                />
              ) : null}
            </>
          }
        />
      </Box>
    </Box>
  );
}
