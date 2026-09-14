// =====================  AUTH CENTRIC LAYOUT (FIGMA LOGIN-DESKTOP REFERENCE)  =================
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { Outlet } from "react-router-dom";
import { DESIGN_TOKENS } from "../../theme/palette.js";

const HIGHLIGHTS = [
  {
    icon: <BoltRoundedIcon sx={{ fontSize: 18, color: "#818CF8" }} />,
    text: "Real-time maintenance triage & technician dispatch",
  },
  {
    icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: "#34D399" }} />,
    text: "Automated billing, invoicing & transparent ledgers",
  },
  {
    icon: <ShieldOutlinedIcon sx={{ fontSize: 18, color: "#60A5FA" }} />,
    text: "Gate terminal verification & digital visitor passes",
  },
];

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#FFFFFF",
      }}
    >
      {/* Left Brand Panel — Hidden on xs/sm, visible on md+ (Figma login-desktop) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: { md: "42%", lg: "45%" },
          maxWidth: 540,
          bgcolor: DESIGN_TOKENS.brand[900], // #1E1B4B
          background: "linear-gradient(155deg, #1E1B4B 0%, #15133C 60%, #0F0E2A 100%)",
          color: "#FFFFFF",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 5, lg: 6 },
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Subtle Background Glow */}
        <Box
          sx={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(67, 56, 202, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Brand Logo & Name */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                bgcolor: DESIGN_TOKENS.brand[600], // #4338CA
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(67, 56, 202, 0.4)",
              }}
            >
              <ApartmentRoundedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                Flat Maintenance
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.02em",
                }}
              >
                Residential Operations Platform
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Core Value Proposition */}
        <Box sx={{ position: "relative", zIndex: 1, my: "auto", py: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: "#818CF8",
              fontWeight: 600,
              letterSpacing: "0.08em",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              display: "block",
              mb: 1.5,
            }}
          >
            Digital Lobby & Society Suite
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { md: "1.875rem", lg: "2.125rem" },
              lineHeight: 1.25,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              mb: 2.5,
            }}
          >
            Smart community management, made effortless.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.72)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            A unified operations workspace for residents, building administrators, maintenance
            crews, and security teams.
          </Typography>

          <Stack spacing={2}>
            {HIGHLIGHTS.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "6px",
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {item.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Footer Security Badge */}
        <Box sx={{ position: "relative", zIndex: 1, pt: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "0.75rem" }}
          >
            © {new Date().getFullYear()} Flat Maintenance Management System • Multi-tenant Secure
          </Typography>
        </Box>
      </Box>

      {/* Right Form Area — Clean, Airy, Super Clear */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#F8FAFC",
          p: { xs: 2.5, sm: 4, md: 6 },
          position: "relative",
        }}
      >
        {/* Mobile-only Brand Header */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              bgcolor: DESIGN_TOKENS.brand[600],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <ApartmentRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Flat Maintenance
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Residential Portal
            </Typography>
          </Box>
        </Box>

        {/* Clean Form Card */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            bgcolor: "#FFFFFF",
            p: { xs: 3, sm: 4.5 },
            borderRadius: "14px",
            border: "1px solid",
            borderColor: DESIGN_TOKENS.line[200],
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
