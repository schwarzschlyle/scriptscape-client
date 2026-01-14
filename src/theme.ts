import { createTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

declare module "@mui/material/styles" {
  interface Palette {
    canvas: {
      background: string;
      gridMinorDot: string;
      gridMajorDot: string;
      connectorStroke: string;
      connectorShadow: string;
      headerPillBg: string;
    };
    card: {
      background: string;
      divider: string;
      outlineActive: string;
      headerBg: string;
      headerBorder: string;
      headerBorderBottom: string;
      titleText: string;
      bodyBg: string;
      bodyBorder: string;
      footerBg: string;
      footerBorder: string;
      statusDot: {
        idle: string;
        active: string;
        saving: string;
        pendingStart: string;
        pendingEnd: string;
        generatingStart: string;
        generatingEnd: string;
        border: string;
      };
    };
  }

  // allow configuration using `createTheme`
  interface PaletteOptions {
    canvas?: Partial<Palette["canvas"]>;
    card?: Partial<Palette["card"]>;
  }
}

export function createAppTheme(mode: ThemeMode) {
  const isDark = mode === "dark";

  // Brand accents (currently hardcoded across canvas)
  // Canvas accent should adapt to theme mode:
  // - dark mode: brand green
  // - light mode: neutral dark gray (less visually aggressive on light backgrounds)
  const accent = isDark ? "#abf43e" : "#374151";
  const cardType = "#73A32C";

  return createTheme({
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
      mode,
      primary: {
        // Keep primary neutral-ish for non-canvas pages. Canvas uses `palette.card/canvas` tokens.
        main: isDark ? "#ffffff" : "#111827",
      },
      secondary: {
        main: isDark ? "#111827" : "#ffffff",
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
        main: accent,
      },
      background: {
        default: isDark ? "#0b0c0b" : "#f5f5f5",
        paper: isDark ? "#171817" : "#ffffff",
      },
      text: {
        primary: isDark ? "#ffffff" : "#111827",
        secondary: isDark ? alpha("#ffffff", 0.72) : alpha("#111827", 0.72),
      },
      divider: isDark ? alpha("#ffffff", 0.12) : alpha("#111827", 0.12),
      canvas: {
        background: isDark ? "#111211" : "#f3f4f6",
        gridMinorDot: isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(17, 24, 39, 0.18)",
        gridMajorDot: isDark ? "rgba(255, 255, 255, 0.50)" : "rgba(17, 24, 39, 0.25)",
        connectorStroke: isDark ? alpha("#ffffff", 0.92) : alpha("#111827", 0.55),
        connectorShadow: isDark
          ? "drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
          : "drop-shadow(0 1px 2px rgba(0,0,0,0.18))",
        headerPillBg: isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.08)",
      },
      card: {
        background: isDark ? "#272927" : "#ffffff",
        divider: isDark ? "#1f211f" : alpha("#111827", 0.10),
        outlineActive: accent,
        headerBg: isDark ? "rgba(47,51,47,0.35)" : "#ffffff",
        headerBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.10)",
        headerBorderBottom: isDark ? "#1f211f" : alpha("#111827", 0.08),
        // In light mode, card headers should be neutral dark gray (not green)
        titleText: isDark ? cardType : "#374151",
        bodyBg: isDark ? "#2F312F" : "#f9fafb",
        bodyBorder: isDark ? "#1f211f" : alpha("#111827", 0.10),
        footerBg: isDark ? "rgba(47,51,47,0.28)" : "rgba(255,255,255,0.78)",
        footerBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.10)",
        statusDot: {
          idle: isDark ? "#6a6967" : alpha("#111827", 0.35),
          active: accent,
          saving: "#ff9800",
          pendingStart: "#2196f3",
          pendingEnd: "#21cbf3",
          generatingStart: "#ff9800",
          generatingEnd: "#ffc107",
          border: isDark ? "#232523" : alpha("#111827", 0.25),
        },
      },
    },
  });
}

// Backwards-compatible default export (previously a single theme)
const theme = createAppTheme("dark");
export default theme;
