// =====================  THEME & COLOR MODE PROVIDER  =========
import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "../theme/index.js";

const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("flat_mgt_theme_mode");
      if (savedMode === "dark" || savedMode === "light") {
        setMode(savedMode);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setMode("dark");
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

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
