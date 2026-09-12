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

      <Typography
        variant="h3"
        sx={{
          fontSize: "1.25rem",
          fontWeight: 500,
          color: "text.primary",
          mb: 0.5,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 0.5, mb: action ? 3 : 0, maxWidth: 440 }}
      >
        {description}
      </Typography>

      {action && <Box>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
