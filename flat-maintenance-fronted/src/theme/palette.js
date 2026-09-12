// =====================  THEME COLOR PALETTES (APPENDIX §A.1)  ===============

/**
 * Exact Design System Tokens from Appendix §A.1
 */
export const DESIGN_TOKENS = Object.freeze({
  ink: {
    900: "#14213D", // Deep indigo-navy: Sidebar, headers, primary buttons, primary text
    700: "#28345A", // Hover/active state of ink surfaces
  },
  evergreen: {
    600: "#2E7D5B", // Secondary brand color: community/growth, resolved/paid/active, active nav
    400: "#48A87E", // Dark mode tint
  },
  brass: {
    500: "#C08A3E", // Tertiary accent: premium highlight only (max 1 per screen)
    400: "#E2AC5E", // Dark mode tint
  },
  paper: {
    50: "#F6F4EF", // App background: warm off-white
    0: "#FFFFFF", // Card/surface background
  },
  line: {
    200: "#E4E0D6", // Hairline borders and dividers: warm-toned
  },
  text: {
    primary: "#1B1F27",
    secondary: "#5B5F6B",
  },
  semantic: {
    danger: "#B3261E",
    warning: "#B7791F",
    info: "#2E5C8A",
  },
});

export const lightPalette = {
  mode: "light",
  primary: {
    main: DESIGN_TOKENS.ink[900], // #14213D
    light: DESIGN_TOKENS.ink[700], // #28345A
    dark: "#0C1527",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: DESIGN_TOKENS.evergreen[600], // #2E7D5B
    light: "#3B946E",
    dark: "#1E583F",
    contrastText: "#FFFFFF",
  },
  accent: {
    main: DESIGN_TOKENS.brass[500], // #C08A3E
    light: "#D8A256",
    dark: "#9E6D29",
    contrastText: "#FFFFFF",
  },
  background: {
    default: DESIGN_TOKENS.paper[50], // #F6F4EF - warm off-white
    paper: DESIGN_TOKENS.paper[0], // #FFFFFF - card surface
  },
  text: {
    primary: DESIGN_TOKENS.text.primary, // #1B1F27
    secondary: DESIGN_TOKENS.text.secondary, // #5B5F6B
    disabled: "#8C919D",
  },
  divider: DESIGN_TOKENS.line[200], // #E4E0D6 - warm hairline
  success: {
    main: DESIGN_TOKENS.evergreen[600], // #2E7D5B
    light: "#E4EFE8",
    dark: "#1E583F",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: DESIGN_TOKENS.semantic.warning, // #B7791F
    light: "#F6EEDF",
    dark: "#8C5810",
    contrastText: "#FFFFFF",
  },
  error: {
    main: DESIGN_TOKENS.semantic.danger, // #B3261E
    light: "#F6E7E5",
    dark: "#8B1B15",
    contrastText: "#FFFFFF",
  },
  info: {
    main: DESIGN_TOKENS.semantic.info, // #2E5C8A
    light: "#E7EEF6",
    dark: "#1B3B5C",
    contrastText: "#FFFFFF",
  },
};

export const darkPalette = {
  mode: "dark",
  primary: {
    main: "#7B96D4",
    light: "#A0B5E5",
    dark: "#5570B2",
    contrastText: "#0B1322",
  },
  secondary: {
    main: DESIGN_TOKENS.evergreen[400], // #48A87E
    light: "#6FC29D",
    dark: "#2E7D5B",
    contrastText: "#0B1322",
  },
  accent: {
    main: DESIGN_TOKENS.brass[400], // #E2AC5E
    light: "#F0C484",
    dark: "#C08A3E",
    contrastText: "#0B1322",
  },
  background: {
    default: "#0B1322", // Deepest ink
    paper: DESIGN_TOKENS.ink[900], // #14213D
  },
  text: {
    primary: "#F6F4EF", // Near white warm text
    secondary: "#A2A8B6",
    disabled: "#656C7C",
  },
  divider: "#28345A", // Warm dark line
  success: {
    main: "#81C995",
    light: "#A6DCB6",
    dark: "#48A87E",
    contrastText: "#0B1322",
  },
  warning: {
    main: "#FDD663",
    light: "#FEE28B",
    dark: "#E2AC5E",
    contrastText: "#0B1322",
  },
  error: {
    main: "#F28B82",
    light: "#F6AEA8",
    dark: "#D9534F",
    contrastText: "#0B1322",
  },
  info: {
    main: "#8AB4F8",
    light: "#ADC8FA",
    dark: "#5C8FD6",
    contrastText: "#0B1322",
  },
};
