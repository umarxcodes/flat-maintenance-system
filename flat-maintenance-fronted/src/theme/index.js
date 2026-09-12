// =====================  THEME FACTORY  =======================
import { createTheme } from "@mui/material/styles";
import { lightPalette, darkPalette } from "./palette.js";
import { typography } from "./typography.js";
import { componentOverrides } from "./components.js";

export const createAppTheme = (mode = "light") => {
  return createTheme({
    palette: mode === "light" ? lightPalette : darkPalette,
    typography,
    shape: {
      borderRadius: 8,
    },
    components: componentOverrides,
  });
};

export default createAppTheme;
