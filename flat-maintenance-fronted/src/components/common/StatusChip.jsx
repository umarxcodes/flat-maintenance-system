// =====================  STATUS CHIP COMPONENT  ===============
import React from "react";
import Chip from "@mui/material/Chip";
import { STATUS_COLOR_MAP } from "../../lib/constants/statuses.js";

/**
 * Enterprise status chip with uniform casing and semantic palette mapping
 */
export const StatusChip = ({ status, size = "small", variant = "filled" }) => {
  if (!status) return null;

  const color = STATUS_COLOR_MAP[status] || "default";

  // Format status string: "UNDER_MAINTENANCE" -> "Under Maintenance"
  const formattedLabel = String(status)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <Chip
      label={formattedLabel}
      color={color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.8125rem",
      }}
    />
  );
};

export default StatusChip;
