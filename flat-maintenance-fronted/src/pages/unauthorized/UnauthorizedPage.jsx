// =====================  UNAUTHORIZED 403 PAGE  ===============
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export const UnauthorizedPage = () => {
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
          bgcolor: "error.lighter",
          color: "error.main",
          mb: 3,
        }}
      >
        <SecurityOutlinedIcon sx={{ fontSize: 44 }} />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Access Denied
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460, mb: 4 }}>
        You do not have the required role or permissions to view this resource. If you believe this
        is an error, please contact your building administrator.
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

export default UnauthorizedPage;
