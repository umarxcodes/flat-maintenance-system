// =====================  HOW IT WORKS WORKFLOW  =====================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { motion } from "framer-motion";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { DESIGN_TOKENS } from "../../../theme/palette.js";
import { FONT_UI } from "../../../theme/typography.js";

export const HowItWorksWorkflow = () => {
  const steps = [
    {
      step: "01",
      title: "Add your building",
      subtitle: "Register towers, floors, and units in minutes",
      description:
        "Define your society's physical hierarchy with automated unit numbering, square-footage maintenance formulas, and owner-occupancy tagging.",
      icon: ApartmentOutlinedIcon,
      badge: "Structure Setup",
    },
    {
      step: "02",
      title: "Invite residents & staff",
      subtitle: "Secure single-use cryptographic invitation tokens",
      description:
        "Onboard flat owners, lease tenants, accountants, and security guards with role-scoped authority. Dispatches instant activation emails with zero hassle.",
      icon: GroupAddOutlinedIcon,
      badge: "Community Onboarding",
    },
    {
      step: "03",
      title: "Everything runs from one dashboard",
      subtitle: "Automated collections, SLAs, and gate security",
      description:
        "Real-time visibility over dues recovery, automated 72-hour work order escalation, 6-digit visitor passes, and immutable audit logs.",
      icon: SpeedOutlinedIcon,
      badge: "Operational Calm",
    },
  ];

  return (
    <Box sx={{ width: "100%", py: { xs: 8, md: 14 }, bgcolor: "#FFFFFF" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: { xs: 6, md: 10 } }}>
          <Chip
            label="Seamless Deployment"
            size="small"
            sx={{
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
              fontFamily: FONT_UI,
              fontWeight: 700,
              fontSize: "0.75rem",
              mb: 2,
              border: `1px solid ${DESIGN_TOKENS.brand[100]}`,
            }}
          />
          <Typography
            component="h2"
            sx={{
              fontFamily: FONT_UI,
              fontWeight: 800,
              fontSize: { xs: "1.875rem", sm: "2.5rem" },
              color: "#0F172A",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              mb: 2,
            }}
          >
            How it works in three calm steps
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            Designed for non-technical society committees. Go from paper chaos to live digital operations within an afternoon.
          </Typography>
        </Box>

        {/* Steps Grid with Connecting Line */}
        <Box sx={{ position: "relative" }}>
          {/* Subtle connecting line across desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: "72px",
              left: "12%",
              right: "12%",
              height: "2px",
              background: `linear-gradient(90deg, ${DESIGN_TOKENS.brand[200]} 0%, ${DESIGN_TOKENS.brand[500]} 50%, ${DESIGN_TOKENS.brand[200]} 100%)`,
              zIndex: 0,
            }}
          />

          <Grid container spacing={4}>
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Grid item xs={12} md={4} key={item.step}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: { xs: 3.5, sm: 4 },
                        borderRadius: "20px",
                        borderColor: DESIGN_TOKENS.line[200],
                        bgcolor: "#FFFFFF",
                        position: "relative",
                        zIndex: 1,
                        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 30px rgba(79, 70, 229, 0.1)",
                          borderColor: DESIGN_TOKENS.brand[300],
                        },
                      }}
                    >
                      {/* Step Number Circle */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "14px",
                            bgcolor: DESIGN_TOKENS.brand[600],
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)",
                          }}
                        >
                          <Icon sx={{ fontSize: 26 }} />
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontWeight: 900,
                            fontSize: "2rem",
                            color: DESIGN_TOKENS.brand[100],
                            letterSpacing: "-0.04em",
                          }}
                        >
                          {item.step}
                        </Typography>
                      </Stack>

                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          bgcolor: "#F1F5F9",
                          color: "#475569",
                          fontFamily: FONT_UI,
                          fontWeight: 700,
                          fontSize: "0.6875rem",
                          mb: 1.5,
                        }}
                      />

                      <Typography
                        sx={{
                          fontFamily: FONT_UI,
                          fontWeight: 800,
                          fontSize: "1.25rem",
                          color: "#0F172A",
                          mb: 0.5,
                        }}
                      >
                        {item.title}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: DESIGN_TOKENS.brand[600],
                          fontWeight: 600,
                          display: "block",
                          mb: 2,
                        }}
                      >
                        {item.subtitle}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748B",
                          lineHeight: 1.6,
                          fontSize: "0.875rem",
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default HowItWorksWorkflow;
