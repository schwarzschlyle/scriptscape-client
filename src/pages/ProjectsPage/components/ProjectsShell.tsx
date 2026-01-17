import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
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
        <CustomCard
          sx={{
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
                <CardTypography variant="cardType" style={{ fontWeight: 750, fontSize: 16 }}>
                  {title}
                </CardTypography>
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
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
