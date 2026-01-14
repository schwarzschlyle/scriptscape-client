import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";

export interface AddProjectCardProps {
  onClick?: () => void;
}

const AddProjectCard: React.FC<AddProjectCardProps> = ({ onClick }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        minHeight: 150,
        borderRadius: 2,
        border: `1px dashed ${alpha(theme.palette.common.white, 0.22)}`,
        background: alpha(theme.palette.common.white, 0.02),
        transition: "transform 140ms ease, border-color 140ms ease, background 140ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(theme.palette.success.main, 0.55),
          background: alpha(theme.palette.success.main, 0.06),
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          "&:focus-visible": {
            outline: `2px solid ${alpha(theme.palette.success.main, 0.9)}`,
            outlineOffset: "2px",
            borderRadius: 2,
          },
        }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.success.main, 0.14),
              border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
            }}
          >
            <AddIcon sx={{ fontSize: 26, color: theme.palette.success.main }} />
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 1.25, fontWeight: 800, textAlign: "center" }}>
            New project
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, textAlign: "center" }}>
            Create a canvas workspace
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AddProjectCard;
