// =====================  THEME & COLOR MODE PROVIDER  =========
import React, { useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { ColorModeContext } from "./theme-context.js";
import { createAppTheme } from "../theme/index.js";

const getInitialColorMode = () => {
  try {
    const savedMode = localStorage.getItem("flat_mgt_theme_mode");
    if (savedMode === "dark" || savedMode === "light") {
      return savedMode;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  } catch {
    // Ignore localStorage access issues
  }
  return "light";
};

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialColorMode);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === "light" ? "dark" : "light";
          try {
            localStorage.setItem("flat_mgt_theme_mode", nextMode);
          } catch {
            // Ignore
          }
          return nextMode;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default AppThemeProvider;
