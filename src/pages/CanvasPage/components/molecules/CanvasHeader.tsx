import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import CanvasTitle from "../atoms/CanvasTitle";
import OrgName from "../atoms/OrgName";
import ProjectName from "../atoms/ProjectName";
import LogoutButton from "../atoms/LogoutButton";

interface CanvasHeaderProps {
  orgName?: string;
  projectName?: string;
  onLogout: () => void;
}

const CanvasHeader = ({ orgName, projectName, onLogout }: CanvasHeaderProps) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      zIndex: 1100,
      px: { xs: 1, sm: 2 },
      py: { xs: 1, sm: 2 },
      pr: {xs: 4, sm: 8 },
      pl: {xs: 4, sm: 8 },
      bgcolor: "background.paper",
      borderBottom: "1px solid #eee",
      boxShadow: 1,
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          minWidth: 0,
          overflow: "hidden",
          flexShrink: 1,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        <CanvasTitle>ScriptScape Canvas</CanvasTitle>
        <OrgName name={orgName} />
        <ProjectName name={projectName} />
      </Stack>
      <Box sx={{ flexShrink: 0 }}>
        <LogoutButton onClick={onLogout} />
      </Box>
    </Stack>
  </Box>
);

export default CanvasHeader;
