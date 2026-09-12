// =====================  EMPTY STATE COMPONENT  ===============
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

export const EmptyState = ({
  icon,
  title = "No records found",
  description = "There are currently no items matching your criteria.",
  action = null,
}) => {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          color: "text.disabled",
          mb: 2,
          display: "flex",
          "& > svg": { fontSize: 54 },
        }}
      >
        {icon || <InboxOutlinedIcon />}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5, mb: action ? 3 : 0, maxWidth: 420 }}
      >
        {description}
      </Typography>

      {action && <Box>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
