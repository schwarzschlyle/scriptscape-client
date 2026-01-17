import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CustomCardBody from "@components/CustomCardBody";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";
import ScriptIcon from "../../../../assets/script-icon.svg";
import SegmentIcon from "../../../../assets/segment-icon.svg";
import VisualDirectionIcon from "../../../../assets/visual-direction-icon.svg";
import SketchesIcon from "../../../../assets/sketches-icon.svg";

export interface ProjectCardProps {
  id?: string;
  name: string;
  description?: string;
  /** Optional aggregated counts for the row below the description. */
  counts?: {
    scripts?: number;
    segments?: number;
    visuals?: number;
    sketches?: number;
  };
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, description, counts, onClick }) => {
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

          <Box
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexWrap: "wrap",
              color: theme.palette.text.secondary,
              fontSize: 11,
            }}
          >
            {[{
              icon: ScriptIcon,
              label: "Scripts",
              value: counts?.scripts ?? 0,
            }, {
              icon: SegmentIcon,
              label: "Segments",
              value: counts?.segments ?? 0,
            }, {
              icon: VisualDirectionIcon,
              label: "Visuals",
              value: counts?.visuals ?? 0,
            }, {
              icon: SketchesIcon,
              label: "Sketches",
              value: counts?.sketches ?? 0,
            }].map((item) => (
              <Box key={item.label} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <img src={item.icon} alt={item.label} style={{ width: 14, height: 14, display: "block", opacity: 0.9 }} />
                <span>{item.value}</span>
              </Box>
            ))}
          </Box>
        </Box>
      }
      minHeight={150}
    />
  );
};

export default ProjectCard;
