// =====================  MUI COMPONENT OVERRIDES  =============
export const componentOverrides = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: "8px 16px",
        fontWeight: 600,
        transition: "all 0.2s ease-in-out",
      },
      contained: {
        "&:hover": {
          transform: "translateY(-1px)",
        },
      },
      outlined: {
        borderWidth: "1.5px",
        "&:hover": {
          borderWidth: "1.5px",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: "none",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
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
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 600,
        backgroundColor: "inherit",
      },
      root: {
        padding: "12px 16px",
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        "&:last-child td, &:last-child th": {
          border: 0,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 6,
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
        borderRadius: 8,
      },
    },
  },
};
