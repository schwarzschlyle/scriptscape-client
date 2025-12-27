import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
      background: "rgba(47,51,47,0.35)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
      minHeight: 64,
      maxHeight: 64,
      height: 64,
      display: "flex",
      alignItems: "center",
    }}
  >
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 2,
      }}
    >
      {/* Project Name (left) */}
      <Box sx={{ flex: "0 0 auto", minWidth: 0 }}>
        <ProjectName name={projectName} />
      </Box>

      {/* Organization Name (right of project name) */}
      {orgName && (
        <Box
          sx={{
            ml: 2,
            px: 2,
            py: 0.5,
            bgcolor: "#E5E7EB",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            height: 32,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: "#4B5563",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {orgName}
          </Typography>
        </Box>
      )}

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Spinner and Logout */}
      <Box
        sx={{
          flex: "0 0 auto",
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
