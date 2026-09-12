// =====================  AUTH CENTRIC LAYOUT  =================
import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        {/* Brand Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 3,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              mb: 1.5,
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)",
            }}
          >
            <ApartmentIcon fontSize="large" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Flat Maintenance Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise Residential Operations Management
          </Typography>
        </Box>

        {/* Auth Content Card */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
