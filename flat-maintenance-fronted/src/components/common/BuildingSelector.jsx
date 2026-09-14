// =====================  BUILDING SELECTOR COMPONENT  =========
import React from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { useAuth } from "../../providers/auth-context.js";
import { ROLES } from "../../lib/constants/roles.js";

export const BuildingSelector = ({ buildings = [] }) => {
  const { user, activeBuildingId, switchBuilding } = useAuth();

  // Show if user is SuperAdmin or has multiple assigned buildings
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const assignedIds = user?.assignedBuildingIds || [];

  if (!isSuperAdmin && assignedIds.length <= 1) {
    return null;
  }

  const handleChange = (event) => {
    const nextVal = event.target.value;
    switchBuilding(nextVal === "ALL" ? null : nextVal);
  };

  const selectValue = activeBuildingId || (isSuperAdmin ? "ALL" : "");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <ApartmentIcon fontSize="small" sx={{ color: "text.secondary" }} />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={selectValue}
          onChange={handleChange}
          displayEmpty
          sx={{
            fontSize: "0.8125rem",
            bgcolor: "background.paper",
            "& .MuiSelect-select": { py: 0.75 },
          }}
        >
          {isSuperAdmin && (
            <MenuItem value="ALL">
              <em>All Buildings</em>
            </MenuItem>
          )}
          {selectValue &&
            selectValue !== "ALL" &&
            !buildings.some((b) => (b.id || b._id) === selectValue) && (
              <MenuItem value={selectValue} disabled sx={{ display: "none" }}>
                Active Building
              </MenuItem>
            )}
          {buildings.map((b) => (
            <MenuItem key={b.id || b._id} value={b.id || b._id}>
              {b.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BuildingSelector;
