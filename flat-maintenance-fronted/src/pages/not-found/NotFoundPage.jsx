// =====================  NOT FOUND 404 PAGE  ==================
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: 12,
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: "action.hover",
          color: "text.secondary",
          mb: 3,
        }}
      >
        <SearchOffOutlinedIcon sx={{ fontSize: 44 }} />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Page Not Found
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460, mb: 4 }}>
        The page you are looking for does not exist or may have been moved.
      </Typography>

      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
      >
        Return to Dashboard
      </Button>
    </Box>
  );
};

export default NotFoundPage;
