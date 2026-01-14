import React from "react";
import { ThemeProvider } from "@mui/material";
import { createAppTheme } from "../theme";

/**
 * Forces a dark MUI theme for the wrapped subtree.
 *
 * Use this for pages we want to always be dark (Login/Register/Projects)
 * even if the user toggles the Canvas theme to light.
 */
export default function DarkPage({ children }: { children: React.ReactNode }) {
  const darkTheme = React.useMemo(() => createAppTheme("dark"), []);
  return <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>;
}

