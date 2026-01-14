import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { alpha, useTheme } from "@mui/material/styles";

export interface ProjectCardProps {
  id?: string;
  name: string;
  description?: string;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, description, onClick }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 150,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.common.white, 0.10)}`,
        background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.05)} 0%, ${alpha(
          theme.palette.common.white,
          0.02
        )} 100%)`,
        overflow: "hidden",
        transition: "transform 140ms ease, border-color 140ms ease, background 140ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(theme.palette.success.main, 0.45),
        },
      }}
    >
      {/* Subtle top accent bar */}
      <Box
        sx={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 2,
          bgcolor: alpha(theme.palette.success.main, 0.35),
        }}
      />

      <CardActionArea
        onClick={onClick}
        sx={{
          height: "100%",
          alignItems: "stretch",
          p: 0,
          "&:focus-visible": {
            outline: `2px solid ${alpha(theme.palette.success.main, 0.9)}`,
            outlineOffset: "2px",
            borderRadius: 2,
          },
        }}
      >
        <CardContent sx={{ p: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  color: theme.palette.text.primary,
                }}
                noWrap
              >
                {name}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  color: theme.palette.text.secondary,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description && description.trim() !== "" ? description : "No description"}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: "0 0 auto",
                width: 34,
                height: 34,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.success.main, 0.15),
                border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
              }}
            >
              <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProjectCard;
