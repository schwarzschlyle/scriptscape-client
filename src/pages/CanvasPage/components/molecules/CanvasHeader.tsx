import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ProjectName from "../atoms/ProjectName";
import LogoutButton from "../atoms/LogoutButton";
import LoadingSpinner from "@components/LoadingSpinner";

interface CanvasHeaderProps {
  orgName?: string;
  projectName?: string;
  projectDescription?: string;
  onLogout: () => void;
  syncing?: boolean;
}

const SPINNER_WIDTH = 40;

const CanvasHeader = ({ orgName, projectName, projectDescription, onLogout, syncing }: CanvasHeaderProps) => (
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
      background: "transparent",
      minHeight: 64,
      maxHeight: 64,
      height: 64,
      display: "flex",
      alignItems: "center",
      transform: "none !important",
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

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0, flexGrow: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-end", minWidth: 0 }}>
          <ProjectName name={projectName} />
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
                flexShrink: 0,
                minWidth: 0,
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
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orgName}
              </Typography>
            </Box>
          )}
        </Box>
        {projectDescription && (
          <Typography
            variant="body2"
            sx={{
              color: "#374151",
              fontWeight: 400,
              fontSize: 13,
              mt: 0.5,
              maxWidth: 320,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginLeft: 0,
            }}
            title={projectDescription}
          >
            {projectDescription}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

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
