// =====================  AUTH CENTRIC LAYOUT (APPENDIX §A.1 & §A.2)  =================
import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { Outlet } from "react-router-dom";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_DISPLAY, FONT_UI } from "../../theme/typography.js";

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
              width: 48,
              height: 48,
              borderRadius: "10px",
              bgcolor: DESIGN_TOKENS.ink[900],
              color: "#FFFFFF",
              mb: 1.5,
              border: "1px solid",
              borderColor: DESIGN_TOKENS.line[200],
            }}
          >
            <ApartmentIcon />
          </Box>
          <Typography
            variant="h1"
            sx={{
              fontFamily: FONT_DISPLAY,
              fontSize: "1.5rem",
              fontWeight: 500,
              color: "text.primary",
              mb: 0.5,
            }}
          >
            Flat Maintenance
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: FONT_UI,
              color: "text.secondary",
            }}
          >
            Digital Lobby & Residential Operations
          </Typography>
        </Box>

        {/* Auth Content Card */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "10px", // 10px on cards per Appendix §A.3
            bgcolor: "background.paper",
            borderColor: DESIGN_TOKENS.line[200],
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
