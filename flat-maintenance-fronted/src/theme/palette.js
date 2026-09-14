// =====================  THEME COLOR PALETTES (APPENDIX §A.1)  ===============

/**
 * Exact Design System Tokens from Appendix §A.1 (Figma Reference)
 */
export const DESIGN_TOKENS = Object.freeze({
  brand: {
    900: "#1E1B4B", // Deep indigo/navy — sidebar background, brand banner
    800: "#2E2A72",
    700: "#3730A3",
    600: "#4338CA", // Primary interactive indigo — buttons, links, active nav item
    500: "#6366F1",
    100: "#E0E7FF", // Soft indigo tint — selected/hover nav background, badge background
    50: "#EEF2FF",
  },
  surface: {
    0: "#FFFFFF", // Primary dashboard canvas and card background
    50: "#F8FAFC", // App shell background behind cards, subtle section dividers
    100: "#F1F5F9",
  },
  line: {
    200: "#E2E8F0", // Card borders, table dividers, input borders — cool neutral grey
    300: "#CBD5E1",
  },
  text: {
    primary: "#0F172A", // Primary body/heading text on light surfaces
    secondary: "#64748B", // Secondary/meta text, table sub-labels, placeholder
    disabled: "#94A3B8",
    inverse: "#FFFFFF",
  },
  accent: {
    blue: "#3B82F6", // Primary chart/trend-line color and info highlights
    green: "#22C55E", // Positive/success semantic — paid, resolved, active
    amber: "#F59E0B", // Warning/attention semantic
  },
  danger: {
    600: "#DC2626", // Errors, destructive actions, rejected/overdue
    50: "#FEE2E2",
  },
  semantic: {
    danger: "#DC2626",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
  // Backward compatibility aliases for existing references
  ink: {
    900: "#1E1B4B",
    700: "#3730A3",
  },
  evergreen: {
    600: "#4338CA",
    400: "#6366F1",
  },
  brass: {
    500: "#F59E0B",
    400: "#FBBF24",
  },
  paper: {
    50: "#F8FAFC",
    0: "#FFFFFF",
  },
});

export const lightPalette = {
  mode: "light",
  primary: {
    main: DESIGN_TOKENS.brand[600], // #4338CA (Clean interactive indigo)
    light: DESIGN_TOKENS.brand[500], // #6366F1
    dark: DESIGN_TOKENS.brand[900], // #1E1B4B
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: DESIGN_TOKENS.brand[900], // #1E1B4B
    light: DESIGN_TOKENS.brand[700],
    dark: "#131033",
    contrastText: "#FFFFFF",
  },
  accent: {
    main: DESIGN_TOKENS.accent.blue, // #3B82F6
    light: "#60A5FA",
    dark: "#1D4ED8",
    contrastText: "#FFFFFF",
  },
  background: {
    default: DESIGN_TOKENS.surface[50], // #F8FAFC - crisp light app canvas
    paper: DESIGN_TOKENS.surface[0], // #FFFFFF - crisp white card surface
  },
  text: {
    primary: DESIGN_TOKENS.text.primary, // #0F172A
    secondary: DESIGN_TOKENS.text.secondary, // #64748B
    disabled: DESIGN_TOKENS.text.disabled,
  },
  divider: DESIGN_TOKENS.line[200], // #E2E8F0 - crisp modern line
  success: {
    main: DESIGN_TOKENS.accent.green, // #22C55E
    light: "#DCFCE7",
    dark: "#15803D",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: DESIGN_TOKENS.accent.amber, // #F59E0B
    light: "#FEF3C7",
    dark: "#B45309",
    contrastText: "#FFFFFF",
  },
  error: {
    main: DESIGN_TOKENS.danger[600], // #DC2626
    light: "#FEE2E2",
    dark: "#991B1B",
    contrastText: "#FFFFFF",
  },
  info: {
    main: DESIGN_TOKENS.accent.blue, // #3B82F6
    light: "#DBEAFE",
    dark: "#1D4ED8",
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
