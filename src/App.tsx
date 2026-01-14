import './App.css'
import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@routes/index";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "./theme";
import { ThemeModeProvider, useThemeMode } from "./theme/ThemeModeContext";

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  // Global theme is driven by the user's chosen mode.
  // Specific pages (Login/Register/Projects) can override with a nested ThemeProvider.
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

function App() {
  return (
    <ThemeModeProvider>
      <AppThemeProvider>
        <CssBaseline />
        <RouterProvider router={router} />
      </AppThemeProvider>
    </ThemeModeProvider>
  );
}

export default App
