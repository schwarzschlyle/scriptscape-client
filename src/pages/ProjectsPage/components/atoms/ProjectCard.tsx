import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CustomCardBody from "@components/CustomCardBody";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";

export interface ProjectCardProps {
  id?: string;
  name: string;
  description?: string;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, description, onClick }) => {
  const theme = useTheme();

  return (
    <CustomCard
      onClick={onClick}
      sx={{
        cursor: "pointer",
        transition: "transform 140ms ease, outline 140ms ease",
        "&:hover": { transform: "translateY(-2px)" },
        "&:focus-within": { outline: `1.5px solid ${theme.palette.success.main}` },
      }}
      header={
        <CustomCardHeader
          editable={false}
          title={
            <CardTypography variant="cardType" style={{ fontWeight: 650, fontSize: 14 }}>
              {name}
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
        <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
          <CustomCardBody editable={false} style={{ cursor: "pointer" }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 12,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description && description.trim() !== "" ? description : "No description"}
            </Typography>
          </CustomCardBody>
        </Box>
      }
      minHeight={150}
    />
  );
};

export default ProjectCard;
