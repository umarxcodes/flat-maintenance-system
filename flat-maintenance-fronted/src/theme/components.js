// =====================  MUI COMPONENT OVERRIDES (APPENDIX §A.3)  =============

export const componentOverrides = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#E4E0D6",
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
        borderRadius: 8, // 8px on buttons and pills
        padding: "8px 18px",
        fontWeight: 600,
        textTransform: "none",
        transition: "all 0.15s ease-in-out",
      },
      contained: {
        "&:hover": {
          filter: "brightness(1.05)",
        },
      },
      outlined: {
        borderWidth: "1px",
        borderColor: "#E4E0D6",
        "&:hover": {
          borderWidth: "1px",
          borderColor: "#14213D",
          backgroundColor: "rgba(20, 33, 61, 0.04)",
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
      elevation: 0, // No drop shadow on in-flow cards per Appendix §A.3
    },
    styleOverrides: {
      root: {
        borderRadius: 10, // 10px on cards
        border: "1px solid",
        borderColor: "#E4E0D6",
        boxShadow: "none", // 1px hairline border instead of drop shadow
        backgroundImage: "none",
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24, // 24px card padding per Appendix §A.3
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
        borderRadius: 10,
      },
      elevation1: {
        // Floating/overlay elements only get soft shadow per Appendix §A.3
        boxShadow: "0 1px 2px rgba(20, 33, 61, 0.06)",
        border: "1px solid #E4E0D6",
      },
      elevation8: {
        boxShadow: "0 4px 12px rgba(20, 33, 61, 0.08)",
        border: "1px solid #E4E0D6",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(20, 33, 61, 0.08)",
        border: "1px solid #E4E0D6",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(20, 33, 61, 0.12)",
        border: "1px solid #E4E0D6",
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: "14px 16px",
        borderBottom: "1px solid #E4E0D6", // Warm hairline row divider
        fontSize: "0.875rem",
      },
      head: {
        fontWeight: 600,
        backgroundColor: "#F6F4EF",
        color: "#1B1F27",
        borderBottom: "1px solid #E4E0D6",
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: "background-color 0.1s ease",
        "&:hover": {
          backgroundColor: "rgba(20, 33, 61, 0.02)",
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
        fontWeight: 600,
        borderRadius: 4, // 4px on small inline chips per Appendix §A.3
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
        borderRadius: 10, // 10px on inputs
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#E4E0D6",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#14213D",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#14213D",
          borderWidth: "1.5px",
        },
      },
    },
  },
};
