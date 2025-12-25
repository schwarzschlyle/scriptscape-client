import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
}

const LoadingSpinner = ({ label = "Loading...", size = 48 }: LoadingSpinnerProps) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="30vh"
    width="100%"
    sx={{ py: 4 }}
  >
    <CircularProgress size={size} color="secondary" />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      {label}
    </Typography>
  </Box>
);

export default LoadingSpinner;
