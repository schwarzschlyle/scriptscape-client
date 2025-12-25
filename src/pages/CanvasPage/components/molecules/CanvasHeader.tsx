import Box from "@mui/material/Box";
import CanvasTitle from "../atoms/CanvasTitle";
import ProjectName from "../atoms/ProjectName";
import LogoutButton from "../atoms/LogoutButton";
import LoadingSpinner from "@components/LoadingSpinner";

interface CanvasHeaderProps {
  orgName?: string;
  projectName?: string;
  onLogout: () => void;
  syncing?: boolean;
}

const SPINNER_WIDTH = 40;

const CanvasHeader = ({ orgName, projectName, onLogout, syncing }: CanvasHeaderProps) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      zIndex: 1100,
      px: { xs: 1, sm: 2 },
      py: { xs: 1, sm: 2 },
      pr: { xs: 4, sm: 8 },
      pl: { xs: 4, sm: 8 },
      bgcolor: "background.paper",
      borderBottom: "1px solid #eee",
      boxShadow: 1,
      minHeight: 64,
      maxHeight: 64,
      height: 64,
      display: "flex",
      alignItems: "center",
    }}
  >
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >

      <Box sx={{ flex: "0 0 auto", minWidth: 0 }}>
        <CanvasTitle sx={{ mb: 0 }}>{orgName}</CanvasTitle>
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "60%", sm: "40%" },
          pointerEvents: "none",
        }}
      >
        <ProjectName name={projectName} />
      </Box>

      <Box
        sx={{
          flex: "0 0 auto",
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: SPINNER_WIDTH,
            height: 64,
            minHeight: 64,
            maxHeight: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s",
          }}
        >
          {syncing ? (
            <LoadingSpinner
              size={20}
              label=""
              sx={{ minHeight: 0, width: "auto", py: 0, alignSelf: "center" }}
            />
          ) : (
            <Box sx={{ width: 20, height: 20, alignSelf: "center" }} />
          )}
        </Box>
        <LogoutButton onClick={onLogout} />
      </Box>
    </Box>
  </Box>
);

export default CanvasHeader;
