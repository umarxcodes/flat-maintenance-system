// =====================  FILTER BAR COMPONENT  ================
import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";

export const FilterBar = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  children,
  onReset,
  hasActiveFilters = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        gap: 2,
        mb: 3,
      }}
    >
      {onSearchChange && (
        <TextField
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          size="small"
          sx={{ minWidth: { xs: "100%", md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {children && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            flex: 1,
          }}
        >
          {children}
        </Box>
      )}

      {onReset && hasActiveFilters && (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={onReset}
          startIcon={<FilterListOffIcon fontSize="small" />}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Reset Filters
        </Button>
      )}
    </Box>
  );
};

export default FilterBar;
