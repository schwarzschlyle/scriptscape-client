import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";

export interface AddProjectCardProps {
  onClick?: () => void;
}

const AddProjectCard: React.FC<AddProjectCardProps> = ({ onClick }) => (
  <Card
    sx={{
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      bgcolor: "#fafafa",
      color: "#000",
      border: "2px dashed #222",
      borderRadius: 2,
      boxShadow: "none",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: 2, bgcolor: "#f0f0f0" },
    }}
  >
    <CardActionArea onClick={onClick} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <AddIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body1" fontWeight={600}>
          Add New Project
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default AddProjectCard;
