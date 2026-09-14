// =====================  MUI COMPONENT OVERRIDES (APPENDIX §A.3)  =============

export const componentOverrides = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: "#F8FAFC",
        color: "#0F172A",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#E2E8F0",
          borderRadius: "3px",
        },
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8, // 8px on buttons & inputs per Appendix §A.3
        padding: "8px 18px",
        fontWeight: 600,
        textTransform: "none",
        transition: "all 0.15s ease-in-out",
      },
      containedPrimary: {
        backgroundColor: "#4338CA", // brand.600
        "&:hover": {
          backgroundColor: "#3730A3", // brand.700
          boxShadow: "0 2px 8px rgba(67, 56, 202, 0.25)",
        },
      },
      outlined: {
        borderWidth: "1px",
        borderColor: "#E2E8F0",
        color: "#0F172A",
        "&:hover": {
          borderWidth: "1px",
          borderColor: "#CBD5E1",
          backgroundColor: "#F8FAFC",
        },
      },
      sizeSmall: {
        padding: "5px 12px",
        fontSize: "0.8125rem",
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 12, // 12px on cards per Appendix §A.3
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        backgroundColor: "#FFFFFF",
        backgroundImage: "none",
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        "&:last-child": {
          paddingBottom: 24,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
      rounded: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        border: "1px solid #E2E8F0",
      },
      elevation3: {
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
        border: "1px solid #E2E8F0",
      },
      elevation8: {
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
        border: "1px solid #E2E8F0",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.1)",
        border: "1px solid #E2E8F0",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12, // 12px on modals per Appendix §A.3
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
        border: "1px solid #E2E8F0",
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: "13px 16px",
        borderBottom: "1px solid #E2E8F0",
        fontSize: "0.875rem",
        color: "#0F172A",
      },
      head: {
        fontWeight: 600,
        backgroundColor: "#F8FAFC",
        color: "#475569",
        borderBottom: "1px solid #E2E8F0",
        fontSize: "0.8125rem",
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: "background-color 0.1s ease",
        "&:hover": {
          backgroundColor: "#F8FAFC",
        },
        "&:last-child td, &:last-child th": {
          borderBottom: 0,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
        borderRadius: 999, // 999px (fully rounded) on status pills/badges per Appendix §A.3
        fontSize: "0.75rem",
        height: 24,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: "outlined",
      size: "small",
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8, // 8px on inputs per Appendix §A.3
        backgroundColor: "#FFFFFF",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#E2E8F0",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#94A3B8",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#4338CA",
          borderWidth: "1.5px",
        },
      },
    },
  },
};
