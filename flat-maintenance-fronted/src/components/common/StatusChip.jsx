// =====================  STATUS CHIP COMPONENT (SECTION 41 & APPENDIX §A.1)  ===============
import React from "react";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import {
  STATUS_TO_SEMANTIC_MAP,
  SEMANTIC_CATEGORIES,
  SEMANTIC_STYLES,
} from "../../lib/constants/status-map.js";

/**
 * Reusable StatusChip component driven by canonical 5-category semantic map (Appendix §A.1)
 * Guarantees color is never the only signal by always pairing with descriptive text label.
 */
export const StatusChip = ({ status, size = "small" }) => {
  const theme = useTheme();
  if (!status) return null;

  const mode = theme.palette.mode === "dark" ? "dark" : "light";
  const category = STATUS_TO_SEMANTIC_MAP[status] || SEMANTIC_CATEGORIES.NEUTRAL_PENDING;
  const style = SEMANTIC_STYLES[mode][category];

  // Format status string: "UNDER_MAINTENANCE" -> "Under Maintenance"
  const formattedLabel = String(status)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <Chip
      label={formattedLabel}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: "0.75rem",
        height: size === "small" ? 24 : 28,
        borderRadius: "999px", // 999px (fully rounded) on status pills/badges per Appendix §A.3
        color: style.color,
        backgroundColor: style.backgroundColor,
        border: style.border,
        "& .MuiChip-label": {
          px: 1.25,
          letterSpacing: "0.01em",
        },
      }}
    />
  );
};

export default StatusChip;
