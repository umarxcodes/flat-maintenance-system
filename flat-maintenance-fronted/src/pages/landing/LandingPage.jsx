// =====================  ENTERPRISE PRODUCT LANDING PAGE  =====================
// The Ultimate Landing Page featuring "The Living Building"
import React, { useState, useEffect, useRef } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import { motion, useInView } from "framer-motion";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShieldIcon from "@mui/icons-material/Shield";
import DoorSlidingIcon from "@mui/icons-material/DoorSliding";
import CampaignIcon from "@mui/icons-material/Campaign";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ApartmentIcon from "@mui/icons-material/Apartment";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";

import { BrandLogo } from "../../components/common/BrandLogo.jsx";
import { useAuth } from "../../providers/auth-context.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

// Signature Landing Page Components
import { ScrollProgressBar } from "./components/ScrollProgressBar.jsx";
import { LivingBuilding } from "./components/LivingBuilding.jsx";
import { OldVsNewComparison } from "./components/OldVsNewComparison.jsx";
import { HowItWorksWorkflow } from "./components/HowItWorksWorkflow.jsx";
import { RolesShowcaseTabs } from "./components/RolesShowcaseTabs.jsx";

// =========================================================================
// STAT COUNTER (Animated once into viewport)
// =========================================================================
const AnimatedStatCounter = ({ targetNumber, prefix = "", suffix = "", label, subtext }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const isInView = useInView(elementRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setCount(targetNumber);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * targetNumber));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [isInView, targetNumber]);

  return (
    <Box ref={elementRef} sx={{ textAlign: { xs: "center", md: "left" } }}>
      <Typography
        sx={{
          fontFamily: FONT_UI,
          fontWeight: 800,
          fontSize: { xs: "2rem", sm: "2.5rem", md: "2.75rem" },
          color: "#0F172A",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
        }}
      >
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONT_UI,
          fontWeight: 700,
          fontSize: "0.9375rem",
          color: DESIGN_TOKENS.brand[600],
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "#64748B",
          fontSize: "0.8125rem",
          display: "block",
          mt: 0.25,
        }}
      >
        {subtext}
      </Typography>
    </Box>
  );
};

// =========================================================================
// FEATURE BEAT ITEM (Syncs with Pinned Living Building Stage)
// =========================================================================
const FeatureBeatItem = ({ stageId, title, kicker, description, icon: Icon, bullets, onInView }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });

  useEffect(() => {
    if (isInView && onInView) {
      onInView(stageId);
    }
  }, [isInView, stageId, onInView]);

  return (
    <Box
      ref={ref}
      sx={{
        minHeight: { xs: "auto", md: "60vh" },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: "20px",
          bgcolor: "#FFFFFF",
          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
          <Chip
            label={kicker}
            size="small"
            sx={{
              bgcolor: "rgba(79, 70, 229, 0.08)",
              color: DESIGN_TOKENS.brand[600],
              fontWeight: 700,
              fontSize: "0.72rem",
            }}
          />
        </Stack>

        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontWeight: 800,
            fontSize: { xs: "1.375rem", sm: "1.75rem" },
            color: "#0F172A",
            lineHeight: 1.25,
            mb: 1.5,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.9375rem",
            color: "#64748B",
            lineHeight: 1.6,
            mb: 2.5,
          }}
        >
          {description}
        </Typography>

        <Stack spacing={1}>
          {bullets.map((b, idx) => (
            <Stack direction="row" spacing={1.25} alignItems="center" key={idx}>
              <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A", flexShrink: 0 }} />
              <Typography sx={{ fontFamily: FONT_UI, fontSize: "0.875rem", fontWeight: 600, color: "#1E293B" }}>
                {b}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

// =========================================================================
// MAIN LANDING PAGE COMPONENT
// =========================================================================
export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [buildingStage, setBuildingStage] = useState(1);

  // Scroll listener for sticky navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "#FFFFFF", overflowX: "hidden" }}>
      {/* 2.5px Top Viewport Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* =========================================================================
          2.1 NAVIGATION BAR (Sticky, transparent over hero -> solid on scroll)
          ========================================================================= */}
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          py: scrolled ? 1.5 : 2.5,
          px: { xs: 2.5, sm: 4, md: 6 },
          transition: "all 0.25s ease",
          bgcolor: scrolled ? "rgba(255, 255, 255, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${DESIGN_TOKENS.line[200]}` : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 20px rgba(15, 23, 42, 0.05)" : "none",
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand Logo */}
          <BrandLogo theme="light" variant="full" size={34} href="/" />

          {/* Desktop Navigation Links */}
          <Stack
            direction="row"
            spacing={3.5}
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Typography
              component="button"
              onClick={() => scrollToSection("living-building")}
              sx={{
                bgcolor: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_UI,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#475569",
                transition: "color 0.15s ease",
                "&:hover": { color: DESIGN_TOKENS.brand[600] },
              }}
            >
              The Living Building
            </Typography>
            <Typography
              component="button"
              onClick={() => scrollToSection("how-it-works")}
              sx={{
                bgcolor: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_UI,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#475569",
                transition: "color 0.15s ease",
                "&:hover": { color: DESIGN_TOKENS.brand[600] },
              }}
            >
              How It Works
            </Typography>
            <Typography
              component="button"
              onClick={() => scrollToSection("roles")}
              sx={{
                bgcolor: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_UI,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#475569",
                transition: "color 0.15s ease",
                "&:hover": { color: DESIGN_TOKENS.brand[600] },
              }}
            >
              Role Solutions
            </Typography>
          </Stack>

          {/* Navigation Action Buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {user ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  color: "#FFFFFF",
                  fontFamily: FONT_UI,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.5,
                  py: 0.85,
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                  "&:hover": {
                    bgcolor: DESIGN_TOKENS.brand[700],
                    boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)",
                  },
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    textTransform: "none",
                    px: 2,
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: DESIGN_TOKENS.brand[600],
                    color: "#FFFFFF",
                    fontFamily: FONT_UI,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 2.5,
                    py: 0.85,
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                    "&:hover": {
                      bgcolor: DESIGN_TOKENS.brand[700],
                      boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)",
                    },
                  }}
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: "flex", md: "none" }, color: "#0F172A" }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Mobile Slide-In Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: 290, p: 3, bgcolor: "#FFFFFF" },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <BrandLogo theme="light" variant="full" size={32} href="/" />
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          <Typography
            component="button"
            onClick={() => scrollToSection("living-building")}
            sx={{
              textAlign: "left",
              bgcolor: "transparent",
              border: "none",
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "#0F172A",
              py: 1,
            }}
          >
            The Living Building
          </Typography>
          <Typography
            component="button"
            onClick={() => scrollToSection("how-it-works")}
            sx={{
              textAlign: "left",
              bgcolor: "transparent",
              border: "none",
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "#0F172A",
              py: 1,
            }}
          >
            How It Works
          </Typography>
          <Typography
            component="button"
            onClick={() => scrollToSection("roles")}
            sx={{
              textAlign: "left",
              bgcolor: "transparent",
              border: "none",
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              fontWeight: 600,
              color: "#0F172A",
              py: 1,
            }}
          >
            Role Solutions
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              borderRadius: "10px",
              py: 1.25,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            {user ? "Open Dashboard" : "Get Started Now"}
          </Button>
        </Stack>
      </Drawer>

      {/* =========================================================================
          2.2 HERO SECTION WITH SIGNATURE HEADLINE & LIVING BUILDING INTRO
          ========================================================================= */}
      <Box
        sx={{
          position: "relative",
          pt: { xs: 15, sm: 18, md: 22 },
          pb: { xs: 8, md: 14 },
          background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
          overflow: "hidden",
        }}
      >
        {/* Soft Brand Gradient Wash Behind Hero */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: { xs: 500, md: 950 },
            height: { xs: 450, md: 650 },
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.05) 50%, transparent 75%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 }, position: "relative", zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            {/* Left Column: Copy and CTAs */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Chip
                  icon={<ApartmentIcon sx={{ "&&": { fontSize: 14, color: DESIGN_TOKENS.brand[600] } }} />}
                  label="Enterprise Flat & Society Maintenance"
                  sx={{
                    bgcolor: DESIGN_TOKENS.brand[50],
                    color: DESIGN_TOKENS.brand[600],
                    fontFamily: FONT_UI,
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    height: 28,
                    mb: 2.5,
                    border: `1px solid ${DESIGN_TOKENS.brand[100]}`,
                    px: 0.5,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: { xs: "2.35rem", sm: "3.25rem", md: "3.75rem" },
                    color: "#0F172A",
                    lineHeight: 1.12,
                    letterSpacing: "-0.035em",
                    mb: 2.5,
                  }}
                >
                  Run your building like it{" "}
                  <Box
                    component="span"
                    sx={{
                      background: "linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #0284C7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    runs itself.
                  </Box>
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
              >
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontSize: { xs: "1.0625rem", sm: "1.1875rem" },
                    color: "#475569",
                    lineHeight: 1.65,
                    maxWidth: 580,
                    mb: 4,
                  }}
                >
                  Every flat, every invoice, every visitor — one calm dashboard. The unified operating platform
                  replacing lost paper registers, chaotic WhatsApp groups, and spreadsheets for modern residential societies.
                </Typography>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.24 }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 6 }}>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: DESIGN_TOKENS.brand[600],
                      color: "#FFFFFF",
                      fontFamily: FONT_UI,
                      fontWeight: 700,
                      fontSize: "1rem",
                      textTransform: "none",
                      borderRadius: "12px",
                      px: 3.5,
                      py: 1.5,
                      boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.35)",
                      "&:hover": {
                        bgcolor: DESIGN_TOKENS.brand[700],
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => scrollToSection("living-building")}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: DESIGN_TOKENS.line[200],
                      color: "#0F172A",
                      fontFamily: FONT_UI,
                      fontWeight: 600,
                      fontSize: "1rem",
                      textTransform: "none",
                      borderRadius: "12px",
                      px: 3.5,
                      py: 1.5,
                      bgcolor: "#FFFFFF",
                      "&:hover": {
                        bgcolor: "#F8FAFC",
                        borderColor: "#CBD5E1",
                      },
                    }}
                  >
                    See It in Action
                  </Button>
                </Stack>
              </motion.div>
            </Grid>

            {/* Right Column: Hero Living Building Preview */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <LivingBuilding activeStage={0} />
              </motion.div>
            </Grid>
          </Grid>

          {/* Animated Trust Stats Counter Row */}
          <Box
            sx={{
              mt: { xs: 6, md: 10 },
              pt: { xs: 4, md: 6 },
              borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`,
            }}
          >
            <Grid container spacing={4} justifyContent="space-between">
              <Grid item xs={6} md={3}>
                <AnimatedStatCounter targetNumber={120} suffix="+" label="Towers Managed" subtext="Residential societies" />
              </Grid>
              <Grid item xs={6} md={3}>
                <AnimatedStatCounter targetNumber={14500} suffix="+" label="Residents Served" subtext="Owners and tenants" />
              </Grid>
              <Grid item xs={6} md={3}>
                <AnimatedStatCounter targetNumber={99} suffix=".98%" label="System Uptime" subtext="Zero downtime SLA" />
              </Grid>
              <Grid item xs={6} md={3}>
                <AnimatedStatCounter prefix="₨ " targetNumber={45} suffix="M+" label="Dues Reconciled" subtext="Annual settlements" />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* =========================================================================
          2.3 "THE OLD WAY VS. THE NEW WAY" (Problem Framing)
          ========================================================================= */}
      <OldVsNewComparison />

      {/* =========================================================================
          2.4 THE LIVING BUILDING FEATURE BEATS (Scroll-Linked Choreography)
          ========================================================================= */}
      <Box
        id="living-building"
        sx={{
          py: { xs: 8, md: 14 },
          bgcolor: "#FFFFFF",
          position: "relative",
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: "center", maxWidth: 740, mx: "auto", mb: { xs: 6, md: 10 } }}>
            <Chip
              label="Signature Interactive Story"
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
              Watch the residential complex run itself
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                color: "#64748B",
                lineHeight: 1.6,
              }}
            >
              Scroll through the four core operational rhythms of a well-run community. Every beat animates live on the
              isometric building alongside the workflow.
            </Typography>
          </Box>

          {/* Pinned Desktop Layout / Sequential Mobile Layout */}
          <Grid container spacing={6} alignItems="flex-start">
            {/* Left Column: The 4 Feature Beats */}
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <FeatureBeatItem
                  stageId={1}
                  kicker="Beat 01 • Work Orders"
                  title="Submit a request. Watch it get handled."
                  description="Residents snap a photo of a plumbing leak or electrical issue. The system assigns the on-duty technician, tracks completion, and automatically escalates tickets if unresolved within 72 hours."
                  icon={BuildIcon}
                  bullets={[
                    "Real-time ticket logging with photo attachments",
                    "Emergency priority tags & technician mobile dispatch",
                    "Strict 72-hour management escalation guardrails",
                  ]}
                  onInView={setBuildingStage}
                />

                <FeatureBeatItem
                  stageId={2}
                  kicker="Beat 02 • Billing & Ledgers"
                  title="Invoices that collect themselves."
                  description="Monthly maintenance assessments generate automatically on the 1st of every month in Pakistani Rupees (₨). Payments reconcile against bank deposits, and overdue accounts are ranked with transparent ledgers."
                  icon={ReceiptLongIcon}
                  bullets={[
                    "Automated recurring maintenance demands",
                    "Direct digital receipt generation upon settlement",
                    "Ranked overdue accounts by tower and floor",
                  ]}
                  onInView={setBuildingStage}
                />

                <FeatureBeatItem
                  stageId={3}
                  kicker="Beat 03 • Gate Security"
                  title="Every visitor, logged and approved."
                  description="Residents issue single-use 6-digit PIN gate passes for guests, couriers, and contractors. Guards verify entry on the guard booth terminal in under 5 seconds with zero paper registers."
                  icon={DoorSlidingIcon}
                  bullets={[
                    "Sub-second verification of guest PINs and QR passes",
                    "Automatic digital timestamping of visitor check-in/out",
                    "Zero lost handwritten logbooks at the gate",
                  ]}
                  onInView={setBuildingStage}
                />

                <FeatureBeatItem
                  stageId={4}
                  kicker="Beat 04 • Digital Bulletins"
                  title="The noticeboard your residents actually read."
                  description="Ditch printed elevator flyers. Broadcast official society notices for water tank sanitization, generator maintenance, or annual meetings directly to residents' mobile screens."
                  icon={CampaignIcon}
                  bullets={[
                    "Push notification broadcasts across all units",
                    "Targeted notices by building complex or tenant category",
                    "Emergency society alerts with read receipts",
                  ]}
                  onInView={setBuildingStage}
                />
              </Stack>
            </Grid>

            {/* Right Column: Pinned Living Building Illustration */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                position: { xs: "relative", md: "sticky" },
                top: { md: "110px" },
              }}
            >
              <LivingBuilding activeStage={buildingStage} onSelectStage={(s) => setBuildingStage(s)} />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* =========================================================================
          2.5 "HOW IT WORKS" (Sequential Workflow)
          ========================================================================= */}
      <Box id="how-it-works">
        <HowItWorksWorkflow />
      </Box>

      {/* =========================================================================
          2.6 ROLES SHOWCASE (Tabbed Role Previews)
          ========================================================================= */}
      <Box id="roles">
        <RolesShowcaseTabs />
      </Box>

      {/* =========================================================================
          2.7 TRUST / SOCIAL PROOF & SECURITY GUARANTEES
          ========================================================================= */}
      <Box sx={{ width: "100%", py: { xs: 8, md: 12 }, bgcolor: "#FFFFFF" }}>
        <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2.5, sm: 4 }, textAlign: "center" }}>
          <Chip
            icon={<LockOutlinedIcon sx={{ "&&": { fontSize: 14, color: DESIGN_TOKENS.brand[600] } }} />}
            label="Enterprise Trust & Integrity"
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
            sx={{
              fontFamily: FONT_UI,
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.25rem" },
              color: "#0F172A",
              lineHeight: 1.3,
              maxWidth: 800,
              mx: "auto",
              mb: 2,
            }}
          >
            Built for residential communities of every size
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              color: "#64748B",
              lineHeight: 1.6,
              maxWidth: 680,
              mx: "auto",
              mb: 6,
            }}
          >
            From single 12-flat complexes to multi-tower gated societies across Pakistan. Every transaction, gate pass, and
            work order is backed by bank-grade security guarantees.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  borderColor: DESIGN_TOKENS.line[200],
                  bgcolor: "#F8FAFC",
                  textAlign: "center",
                }}
              >
                <VerifiedUserOutlinedIcon sx={{ fontSize: 32, color: DESIGN_TOKENS.brand[600], mb: 1 }} />
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1rem", color: "#0F172A", mb: 0.5 }}>
                  Bank-Grade Encryption
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  Bcrypt password hashing, rotated JWT refresh families, and encrypted session cookies.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  borderColor: DESIGN_TOKENS.line[200],
                  bgcolor: "#F8FAFC",
                  textAlign: "center",
                }}
              >
                <HistoryEduOutlinedIcon sx={{ fontSize: 32, color: DESIGN_TOKENS.brand[600], mb: 1 }} />
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1rem", color: "#0F172A", mb: 0.5 }}>
                  Forensic Audit Logs
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  Immutable, append-only logs recording every status change, financial transaction, and gate entry.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  borderColor: DESIGN_TOKENS.line[200],
                  bgcolor: "#F8FAFC",
                  textAlign: "center",
                }}
              >
                <ShieldIcon sx={{ fontSize: 32, color: DESIGN_TOKENS.brand[600], mb: 1 }} />
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1rem", color: "#0F172A", mb: 0.5 }}>
                  Granular RBAC Guardrails
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  8 distinct authority levels ensuring personnel only view and operate within authorized building boundaries.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* =========================================================================
          2.8 FINAL CTA (Full-Width Dark Band with Living Building Miniature)
          ========================================================================= */}
      <Box
        sx={{
          bgcolor: "#0B132B",
          color: "#FFFFFF",
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2.5, sm: 4 }, position: "relative", zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Chip
                label="Ready for Calm Operations?"
                size="small"
                sx={{
                  bgcolor: "rgba(99, 102, 241, 0.2)",
                  color: "#A5B4FC",
                  fontFamily: FONT_UI,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  mb: 2.5,
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              />
              <Typography
                component="h2"
                sx={{
                  fontFamily: FONT_UI,
                  fontWeight: 900,
                  fontSize: { xs: "2rem", sm: "2.75rem" },
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  mb: 2,
                }}
              >
                Run your residential complex like it runs itself.
              </Typography>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1.0625rem",
                  color: "#94A3B8",
                  lineHeight: 1.6,
                  maxWidth: 560,
                  mb: 4,
                }}
              >
                Join modern societies upgrading from paper registers and WhatsApp groups to one calm, centralized platform.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: DESIGN_TOKENS.brand[600],
                    color: "#FFFFFF",
                    fontFamily: FONT_UI,
                    fontWeight: 700,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderRadius: "12px",
                    px: 3.5,
                    py: 1.5,
                    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
                    "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                  }}
                >
                  Get Started Today
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontFamily: FONT_UI,
                    fontWeight: 600,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderRadius: "12px",
                    px: 3.5,
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#FFFFFF",
                      bgcolor: "rgba(255, 255, 255, 0.06)",
                    },
                  }}
                >
                  Sign In to Portal
                </Button>
              </Stack>
            </Grid>

            {/* Right Column: Mini Living Building Preview in Fully Lit State */}
            <Grid item xs={12} md={5} sx={{ display: { xs: "none", md: "block" } }}>
              <Box sx={{ maxWidth: 360, mx: "auto", opacity: 0.95 }}>
                <LivingBuilding activeStage={5} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* =========================================================================
          2.9 FOOTER (Calm, Informative, Accessible)
          ========================================================================= */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#070D1E",
          color: "#94A3B8",
          py: 6,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          <Grid container spacing={4} justifyContent="space-between" sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <BrandLogo theme="dark" variant="full" size={32} href="/" />
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  color: "#64748B",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  maxWidth: 320,
                }}
              >
                The enterprise operating system for building administrators, society committees, accountants, and residents.
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Platform
              </Typography>
              <Stack spacing={1.25}>
                <Typography
                  component="button"
                  onClick={() => scrollToSection("living-building")}
                  sx={{
                    bgcolor: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: "#64748B",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    p: 0,
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  The Living Building
                </Typography>
                <Typography
                  component="button"
                  onClick={() => scrollToSection("how-it-works")}
                  sx={{
                    bgcolor: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: "#64748B",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    p: 0,
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  How It Works
                </Typography>
                <Typography
                  component="button"
                  onClick={() => scrollToSection("roles")}
                  sx={{
                    bgcolor: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: "#64748B",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    p: 0,
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  Role Solutions
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Security & Specs
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Role-Based Access Control
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Forensic Audit Trails
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Cloudinary Object Storage
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Zero-Knowledge Sessions
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Access
              </Typography>
              <Stack spacing={1.25}>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    justifyContent: "flex-start",
                    p: 0,
                    color: "#64748B",
                    fontSize: "0.8125rem",
                    textTransform: "none",
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    justifyContent: "flex-start",
                    p: 0,
                    color: "#64748B",
                    fontSize: "0.8125rem",
                    textTransform: "none",
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  Reset Password
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)", mb: 4 }} />

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.75rem" }}>
              © {new Date().getFullYear()} Flat Maintenance Management System. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.75rem" }}>
              Engineered with Enterprise Architecture • Powered by Vite, React 19 & Express
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
