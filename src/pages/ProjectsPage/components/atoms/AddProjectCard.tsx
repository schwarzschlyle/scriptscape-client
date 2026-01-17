import React from "react";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CustomCardBody from "@components/CustomCardBody";
import CardStatusDot from "@pages/CanvasPage/components/atoms/CardStatusDot";
import CardTypography from "@pages/CanvasPage/components/molecules/CardTypography";

export interface AddProjectCardProps {
  onClick?: () => void;
}

const AddProjectCard: React.FC<AddProjectCardProps> = ({ onClick }) => {
  const theme = useTheme();
  return (
    <CustomCard
      onClick={onClick}
      sx={{
        cursor: "pointer",
        transition: "transform 140ms ease, outline 140ms ease",
        "&:hover": { transform: "translateY(-2px)" },
        // Dashed look, but keep the rest consistent with canvas cards.
        border: `1.5px dashed ${alpha(theme.palette.text.primary, 0.18)}`,
      }}
      header={
        <CustomCardHeader
          editable={false}
          title={
            <CardTypography variant="cardType" style={{ fontWeight: 750, fontSize: 15 }}>
              New project
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
        <Box sx={{ px: 2, pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          <CustomCardBody editable={false} style={{ cursor: "pointer" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.success.main, 0.14),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
                  flex: "0 0 auto",
                }}
              >
                <AddIcon sx={{ fontSize: 22, color: theme.palette.success.main }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Create a canvas workspace
              </Typography>
            </Box>
          </CustomCardBody>
        </Box>
      }
      minHeight={150}
    />
  );
};

export default AddProjectCard;
