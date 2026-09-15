// =====================  THEME TYPOGRAPHY (APPENDIX §A.2)  ===================

export const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const FONT_DISPLAY = FONT_UI; // Appendix §A.2: Single clean modern sans-serif family throughout

export const typography = {
  fontFamily: FONT_UI,
  // Clean Modern Type Scale (Desktop: 28px title, 18px card heading, 14px body, 13px meta)
  h1: {
    fontFamily: FONT_UI,
    fontSize: "1.75rem", // 28px
    lineHeight: "2.25rem", // 36px
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily: FONT_UI,
    fontSize: "1.5rem", // 24px
    lineHeight: "2rem", // 32px
    fontWeight: 700,
    letterSpacing: "-0.015em",
  },
  h3: {
    fontFamily: FONT_UI,
    fontSize: "1.25rem", // 20px
    lineHeight: "1.75rem", // 28px
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  h4: {
    fontFamily: FONT_UI,
    fontSize: "1.125rem", // 18px
    lineHeight: "1.625rem", // 26px
    fontWeight: 600,
  },
  h5: {
    fontFamily: FONT_UI,
    fontSize: "1rem", // 16px
    lineHeight: "1.5rem", // 24px
    fontWeight: 600,
  },
  h6: {
    fontFamily: FONT_UI,
    fontSize: "0.875rem", // 14px
    lineHeight: "1.25rem", // 20px
    fontWeight: 600,
  },
  subtitle1: {
    fontFamily: FONT_UI,
    fontSize: "1rem",
    lineHeight: "1.5rem",
    fontWeight: 500,
  },
  subtitle2: {
    fontFamily: FONT_UI,
    fontSize: "0.875rem", // 14px
    lineHeight: "1.375rem", // 22px
    fontWeight: 600,
  },
  body1: {
    fontFamily: FONT_UI,
    fontSize: "0.875rem", // 14px
    lineHeight: "1.375rem", // 22px
    fontWeight: 400,
  },
  body2: {
    fontFamily: FONT_UI,
    fontSize: "0.8125rem", // 13px
    lineHeight: "1.125rem", // 18px
    fontWeight: 400,
  },
  button: {
    fontFamily: FONT_UI,
    textTransform: "none", // Never ALL CAPS per Appendix §A.2
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  caption: {
    fontFamily: FONT_UI,
    fontSize: "0.75rem", // 12px
    lineHeight: "1rem", // 16px
    fontWeight: 500,
  },
  overline: {
    fontFamily: FONT_UI,
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "none", // Never ALL CAPS per Appendix §A.2
  },
};
