import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export interface ProjectCardProps {
  name: string;
  description?: string;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, description, onClick }) => (
  <Card
    sx={{
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      bgcolor: "#fff",
      color: "#000",
      border: "1px solid #222",
      borderRadius: 2,
      boxShadow: "none",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: 2 },
    }}
  >
    <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
          {name}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {description}
          </Typography>
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);

export default ProjectCard;
