import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import CardFooter from "@components/CardFooter";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";

export function ProjectsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default",
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 20% 15%, ${alpha(theme.palette.success.main, 0.08)} 0%, transparent 40%),
               radial-gradient(circle at 80% 85%, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 45%)`
            : `radial-gradient(circle at 20% 15%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 40%),
               radial-gradient(circle at 80% 85%, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 45%)`,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 980 }}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(17,24,39,0.10)",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.52) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderBottom:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(17,24,39,0.08)",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <CardTypography variant="cardType" style={{ fontWeight: 750, fontSize: 16 }}>
                {title}
              </CardTypography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            <CardStatusDot status="active" size={10} />
          </Box>

          <Box sx={{ px: 2, pt: 2, pb: 2 }}>{children}</Box>

          <CardFooter left={null} center={null} right={null} height={34} />
        </Box>
      </Box>
    </Box>
  );
}
