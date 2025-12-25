import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontWeightRegular: 500,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 700, letterSpacing: 0.01 },
    h2: { fontWeight: 700, letterSpacing: 0.01 },
    h3: { fontWeight: 700, letterSpacing: 0.01 },
    h4: { fontWeight: 700, letterSpacing: 0.01 },
    h5: { fontWeight: 600, letterSpacing: 0.01 },
    h6: { fontWeight: 600, letterSpacing: 0.01 },
    body1: { fontWeight: 500, letterSpacing: 0.01 },
    body2: { fontWeight: 500, letterSpacing: 0.01 },
  },
  palette: {
    primary: {
      main: "#fff",
    },
    secondary: {
      main: "#000",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ed6c02",
    },
    info: {
      main: "#0288d1",
    },
    success: {
      main: "#2e7d32",
    },
    background: {
      default: "#f5f5f5",
      paper: "#fff",
    },
    text: {
      primary: "#222",
      secondary: "#555",
    },
  },
});

export default theme;
