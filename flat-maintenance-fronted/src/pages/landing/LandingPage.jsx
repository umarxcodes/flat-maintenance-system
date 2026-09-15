// =====================  ENTERPRISE PRODUCT LANDING PAGE  =====================
import React, { useState, useEffect, useRef } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import { motion, AnimatePresence } from "framer-motion";

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
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ApartmentIcon from "@mui/icons-material/Apartment";

import { BrandLogo } from "../../components/common/BrandLogo.jsx";
import { useAuth } from "../../providers/auth-context.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

// =========================================================================
// LIGHTWEIGHT ANIMATED STAT COUNTER (Fires once on viewport entry)
// =========================================================================
const AnimatedStatCounter = ({ targetNumber, prefix = "", suffix = "", label, subtext }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Check prefers-reduced-motion
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (prefersReducedMotion) {
            setCount(targetNumber);
            return;
          }

          const duration = 1200; // ms
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(easeProgress * targetNumber));

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [targetNumber]);

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
// MAIN LANDING PAGE COMPONENT
// =========================================================================
export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState(0);

  // Scroll listener for sticky navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Feature Cards Definition (Domain-Specific)
  const features = [
    {
      icon: ReceiptLongIcon,
      title: "Automated Dues & Ledgers",
      description:
        "Generate monthly maintenance assessments, track verified bank payments in Pakistani Rupees (₨), and issue automated receipt vouchers.",
      color: "#4F46E5",
      bg: "#EEF2FF",
    },
    {
      icon: BuildIcon,
      title: "Work Order SLA Dispatch",
      description:
        "Field ticket logging with emergency priority tags, technician job assignment, and strict 72-hour management escalation rules.",
      color: "#EA580C",
      bg: "#FFEDD5",
    },
    {
      icon: DoorSlidingIcon,
      title: "Gate Pass & Visitor Security",
      description:
        "Residents generate 6-digit one-time visitor passes verified in real time at the guard terminal with digital check-in timestamps.",
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      icon: CampaignIcon,
      title: "Community Bulletins & Grievance Triage",
      description:
        "Broadcast urgent building notices to all occupants and resolve resident complaints with confidential category routing.",
      color: "#0284C7",
      bg: "#E0F2FE",
    },
    {
      icon: ShieldIcon,
      title: "Enterprise RBAC Security",
      description:
        "Strict authority boundaries across 8 distinct platform roles—from Super Admin governance to read-only Resident Portals.",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      icon: AssessmentIcon,
      title: "Financial Audits & 1-Click Exports",
      description:
        "Real-time collection trajectory trendlines, ranked overdue accounts, and immutable append-only forensic audit trails.",
      color: "#0F172A",
      bg: "#F8FAFC",
    },
  ];

  // Role Showcase Data
  const roleShowcase = [
    {
      role: "Building Admins",
      icon: SupervisorAccountIcon,
      headline: "Total Operational Control Over Properties & Personnel",
      description:
        "Govern occupancy status, monitor outstanding balances across towers, publish emergency building notices, and oversee on-duty maintenance crew velocity.",
      bullets: [
        "Interactive occupancy metrics & unit directory",
        "Staff duty schedule and resident satisfaction ratings",
        "Direct escalation triggers for unattended work tickets",
      ],
      badge: "Governance & Oversight",
      stats: { primary: "100%", label: "Asset Visibility" },
    },
    {
      role: "Accountants",
      icon: AccountBalanceWalletIcon,
      headline: "Frictionless Billing Cycles & Zero-Leakage Reconciliation",
      description:
        "Automate monthly maintenance demands, track overdue accounts in Pakistani Rupees (₨), approve operational expenses, and export compliance reports.",
      bullets: [
        "Ranked overdue accounts by flat and days overdue",
        "Expense voucher approvals with category tracking",
        "Exportable Excel and CSV financial audit statements",
      ],
      badge: "Financial Control",
      stats: { primary: "96%", label: "On-Time Recovery" },
    },
    {
      role: "Residents (Owners & Tenants)",
      icon: PersonIcon,
      headline: "A Premium Digital Portal for Every Unit Resident",
      description:
        "View itemized monthly bills, inspect past settlement receipts, submit maintenance repair tickets, and generate digital gate passes for guests.",
      bullets: [
        "1-tap work order submission with status progression",
        "Pre-approved 6-digit visitor access codes",
        "Instant access to society notices and billing history",
      ],
      badge: "Resident Experience",
      stats: { primary: "< 2 mins", label: "Pass Generation" },
    },
    {
      role: "Security & Field Staff",
      icon: SecurityIcon,
      headline: "Rapid Gate Verification & Mobile Field Dispatch",
      description:
        "Security guards verify guest codes on a dedicated terminal, while technicians receive prioritized repair jobs directly on their mobile queue.",
      bullets: [
        "Instant 6-digit pass code gate verification",
        "Priority-sorted technician dispatch queue",
        "Resident turnaround verification with star ratings",
      ],
      badge: "Field Operations",
      stats: { primary: "Instant", label: "Gate Verification" },
    },
  ];

  return (
    <Box sx={{ width: "100%", bgcolor: "#FFFFFF", overflowX: "hidden" }}>
      {/* =========================================================================
          1. STICKY TOP NAVIGATION BAR
          ========================================================================= */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: scrolled ? "rgba(255, 255, 255, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${DESIGN_TOKENS.line[200]}` : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 20px -4px rgba(15, 23, 42, 0.06)" : "none",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          py: scrolled ? 1.25 : 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 1240,
            mx: "auto",
            px: { xs: 2.5, sm: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <BrandLogo
            theme="light"
            variant="full"
            size={36}
            title="Flat Maintenance"
            subtitle="Enterprise Platform"
            href="/"
          />

          {/* Desktop Anchor Links */}
          <Stack
            direction="row"
            spacing={3.5}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
            }}
          >
            <Typography
              component="button"
              onClick={() => scrollToSection("features")}
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
              Features
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

          {/* Action Buttons */}
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
                  px: 2.25,
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
                    px: 2.25,
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

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            p: 3,
            bgcolor: "#FFFFFF",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <BrandLogo theme="light" variant="full" size={32} href="/" />
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2.5}>
          <Typography
            component="button"
            onClick={() => scrollToSection("features")}
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
            Features
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

          <Divider sx={{ my: 1 }} />

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
            {user ? "Open Dashboard" : "Sign In to Portal"}
          </Button>
        </Stack>
      </Drawer>

      {/* =========================================================================
          2. HERO SECTION WITH AMBIENT MOTION & 3D PRODUCT PREVIEW
          ========================================================================= */}
      <Box
        sx={{
          position: "relative",
          pt: { xs: 16, sm: 18, md: 22 },
          pb: { xs: 10, md: 16 },
          overflow: "hidden",
          background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
        }}
      >
        {/* Ambient Gradient Mesh Blobs (Pure CSS with Reduced-Motion Fallback) */}
        <Box
          sx={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: { xs: 500, md: 900 },
            height: { xs: 500, md: 700 },
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(129, 140, 248, 0.08) 50%, transparent 75%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
            animation: "ambientPulse 10s ease-in-out infinite alternate",
            "@keyframes ambientPulse": {
              "0%": { transform: "translateX(-50%) scale(0.95)" },
              "100%": { transform: "translateX(-50%) scale(1.15)" },
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        />

        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 }, position: "relative", zIndex: 1 }}>
          {/* Hero Header */}
          <Box sx={{ maxWidth: 860, mx: "auto", textAlign: "center", mb: { xs: 6, md: 9 } }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Chip
                icon={<ShieldIcon sx={{ "&&": { fontSize: 14, color: DESIGN_TOKENS.brand[600] } }} />}
                label="Enterprise Residential Facilities & Maintenance"
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[50],
                  color: DESIGN_TOKENS.brand[600],
                  fontFamily: FONT_UI,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 28,
                  mb: 3,
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
                  fontSize: { xs: "2.25rem", sm: "3.25rem", md: "4rem" },
                  color: "#0F172A",
                  lineHeight: 1.1,
                  letterSpacing: "-0.035em",
                  mb: 2.5,
                }}
              >
                Run your residential complex like it{" "}
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
                  fontSize: { xs: "1.0625rem", sm: "1.25rem" },
                  color: "#475569",
                  lineHeight: 1.6,
                  maxWidth: 760,
                  mx: "auto",
                  mb: 4.5,
                }}
              >
                The unified operating platform for building administrators, society committees, accountants, and
                residents. Automate maintenance assessments, field repair dispatch, visitor gate passes, and financial
                audits.
              </Typography>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
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
                    boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.4)",
                    "&:hover": {
                      bgcolor: DESIGN_TOKENS.brand[700],
                      boxShadow: "0 12px 28px -4px rgba(79, 70, 229, 0.5)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Access Platform Now
                </Button>
                <Button
                  onClick={() => scrollToSection("features")}
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
                  Explore Modules
                </Button>
              </Stack>
            </motion.div>
          </Box>

          {/* Product Visual Mockup (High-Fidelity UI composition) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Box
              sx={{
                position: "relative",
                maxWidth: 1040,
                mx: "auto",
                borderRadius: "20px",
                p: { xs: 1, sm: 1.5 },
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(226, 232, 240, 0.6) 100%)",
                boxShadow:
                  "0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8), 0 10px 30px rgba(79, 70, 229, 0.08)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    "0 30px 60px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(99, 102, 241, 0.3)",
                },
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "16px",
                  borderColor: DESIGN_TOKENS.line[200],
                  overflow: "hidden",
                  p: { xs: 2, sm: 3 },
                }}
              >
                {/* Mockup Top Window Bar */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 2,
                    mb: 2.5,
                    borderBottom: `1px solid ${DESIGN_TOKENS.line[200]}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#EF4444" }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10B981" }} />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1.5,
                        fontFamily: "monospace",
                        color: "#94A3B8",
                        fontSize: "0.72rem",
                        display: { xs: "none", sm: "inline-block" },
                      }}
                    >
                      app.flatmaintenance.pk/dashboard
                    </Typography>
                  </Stack>

                  <Chip
                    label="Live Production Environment"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      bgcolor: "#DCFCE7",
                      color: "#15803D",
                      border: "1px solid #BBF7D0",
                    }}
                  />
                </Box>

                {/* Mockup KPI Stat Cards (Real CSS Grid) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      md: "repeat(4, 1fr)",
                    },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#FFFFFF" }}>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Total Billed (PKR)</Typography>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.25rem", color: "#0F172A", mt: 0.5 }}>
                      ₨1,480,000
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 600 }}>+4% vs last cycle</Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#FFFFFF" }}>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Total Collected</Typography>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.25rem", color: "#16A34A", mt: 0.5 }}>
                      ₨1,392,000
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B" }}>Verified receipts</Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#FFFFFF" }}>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Recovery Efficiency</Typography>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.25rem", color: DESIGN_TOKENS.brand[600], mt: 0.5 }}>
                      94%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B" }}>Over 90% benchmark</Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#FFFFFF" }}>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Active Gate Passes</Typography>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.25rem", color: "#0F172A", mt: 0.5 }}>
                      14 Passes
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 600 }}>Terminal Active</Typography>
                  </Box>
                </Box>

                {/* Mockup Dual Split Section */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#F8FAFC" }}>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", mb: 1.5 }}>
                      Recent Priority Work Orders
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ p: 1.25, borderRadius: "8px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>
                            Main Water Pump Pressure Drop
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B" }}>
                            Tower B • General Facilities
                          </Typography>
                        </Box>
                        <Chip label="In Progress" size="small" sx={{ bgcolor: "#FEF3C7", color: "#B45309", fontWeight: 700, fontSize: "0.6875rem", height: 22 }} />
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: "8px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>
                            Basement Gate Access Sensor Check
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B" }}>
                            Security Gate 1 • Field Staff
                          </Typography>
                        </Box>
                        <Chip label="Resolved" size="small" sx={{ bgcolor: "#DCFCE7", color: "#15803D", fontWeight: 700, fontSize: "0.6875rem", height: 22 }} />
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${DESIGN_TOKENS.line[200]}`, bgcolor: "#F8FAFC" }}>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A", mb: 1.5 }}>
                      Gate Security Verification
                    </Typography>
                    <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                        Latest Guest Code
                      </Typography>
                      <Typography sx={{ fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 800, color: DESIGN_TOKENS.brand[600], my: 0.5, letterSpacing: "0.15em" }}>
                        849-210
                      </Typography>
                      <Chip label="Verified • Flat 402" size="small" sx={{ bgcolor: "#DCFCE7", color: "#15803D", fontWeight: 700, fontSize: "0.6875rem" }} />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </motion.div>

          {/* Animated Counter Stats Row */}
          <Box
            sx={{
              mt: { xs: 8, md: 12 },
              pt: { xs: 6, md: 8 },
              borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: { xs: 4, md: 3 },
            }}
          >
            <AnimatedStatCounter
              targetNumber={500}
              suffix="+"
              label="Residential Units"
              subtext="Managed across multi-story blocks"
            />
            <AnimatedStatCounter
              prefix="₨"
              targetNumber={45}
              suffix="M+"
              label="Collections Processed"
              subtext="Zero-leakage maintenance ledger"
            />
            <AnimatedStatCounter
              targetNumber={99}
              suffix=".4%"
              label="SLA Compliance"
              subtext="Resolved within designated velocity"
            />
            <AnimatedStatCounter
              targetNumber={24}
              suffix="/7"
              label="Gate Security Coverage"
              subtext="Real-time visitor passcode logging"
            />
          </Box>
        </Box>
      </Box>

      {/* =========================================================================
          3. CORE FEATURES SECTION (Real Domain Modules)
          ========================================================================= */}
      <Box
        id="features"
        sx={{
          py: { xs: 10, md: 16 },
          bgcolor: "#FFFFFF",
          borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`,
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: "center", maxWidth: 740, mx: "auto", mb: { xs: 6, md: 9 } }}>
            <Chip
              label="Core Capabilities"
              sx={{
                bgcolor: DESIGN_TOKENS.brand[50],
                color: DESIGN_TOKENS.brand[600],
                fontWeight: 700,
                fontSize: "0.75rem",
                mb: 2,
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
                letterSpacing: "-0.025em",
                mb: 2,
              }}
            >
              Engineered for complete residential property governance
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                color: "#64748B",
                lineHeight: 1.6,
              }}
            >
              Every capability is purpose-built to eliminate manual spreadsheets, cash confusion, and delayed repair
              escalations in modern residential societies.
            </Typography>
          </Box>

          {/* Features Grid (Staggered Reveals via Framer Motion) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {features.map((feature, idx) => {
              const IconComp = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3.5,
                      height: "100%",
                      borderRadius: "16px",
                      borderColor: DESIGN_TOKENS.line[200],
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: DESIGN_TOKENS.brand[600],
                        boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.08)",
                      },
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "12px",
                          bgcolor: feature.bg,
                          color: feature.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        <IconComp sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: FONT_UI,
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          color: "#0F172A",
                          lineHeight: 1.3,
                          mb: 1.25,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_UI,
                          fontSize: "0.875rem",
                          color: "#64748B",
                          lineHeight: 1.6,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* =========================================================================
          4. HOW IT WORKS SECTION (Sequential 3-Step Process)
          ========================================================================= */}
      <Box
        id="how-it-works"
        sx={{
          py: { xs: 10, md: 16 },
          bgcolor: "#F8FAFC",
          borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`,
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: { xs: 6, md: 9 } }}>
            <Chip
              label="Streamlined Implementation"
              sx={{
                bgcolor: DESIGN_TOKENS.brand[50],
                color: DESIGN_TOKENS.brand[600],
                fontWeight: 700,
                fontSize: "0.75rem",
                mb: 2,
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
                letterSpacing: "-0.025em",
                mb: 2,
              }}
            >
              How your property gets started in three steps
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                color: "#64748B",
                lineHeight: 1.6,
              }}
            >
              Transition your entire building from manual logbooks and fragmented WhatsApp groups into a unified digital
              standard.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3.5,
              position: "relative",
            }}
          >
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 3.5,
                  borderRadius: "16px",
                  bgcolor: "#FFFFFF",
                  borderColor: DESIGN_TOKENS.line[200],
                  height: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: "2.5rem",
                    color: DESIGN_TOKENS.brand[100],
                    lineHeight: 1,
                    mb: 2,
                  }}
                >
                  01
                </Typography>
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.125rem", color: "#0F172A", mb: 1 }}>
                  Map Property & Units
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6 }}>
                  Configure your residential complex architecture—including towers, blocks, floor plans, and individual
                  flat units with custom square footage and billing rates.
                </Typography>
              </Paper>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.12 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 3.5,
                  borderRadius: "16px",
                  bgcolor: "#FFFFFF",
                  borderColor: DESIGN_TOKENS.line[200],
                  height: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: "2.5rem",
                    color: DESIGN_TOKENS.brand[100],
                    lineHeight: 1,
                    mb: 2,
                  }}
                >
                  02
                </Typography>
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.125rem", color: "#0F172A", mb: 1 }}>
                  Onboard Residents & Staff
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6 }}>
                  Invite flat owners, current tenants, security guards, and maintenance crews with pre-configured
                  passcodes and role-governed operational privileges.
                </Typography>
              </Paper>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.24 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 3.5,
                  borderRadius: "16px",
                  bgcolor: "#FFFFFF",
                  borderColor: DESIGN_TOKENS.line[200],
                  height: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 900,
                    fontSize: "2.5rem",
                    color: DESIGN_TOKENS.brand[100],
                    lineHeight: 1,
                    mb: 2,
                  }}
                >
                  03
                </Typography>
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.125rem", color: "#0F172A", mb: 1 }}>
                  Automate Daily Operations
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6 }}>
                  Collect maintenance dues online, triage emergency work orders, verify visitor gate codes in seconds,
                  and export compliance audit statements effortlessly.
                </Typography>
              </Paper>
            </motion.div>
          </Box>
        </Box>
      </Box>

      {/* =========================================================================
          5. ROLE SOLUTIONS SHOWCASE SECTION (Tabbed Experience)
          ========================================================================= */}
      <Box
        id="roles"
        sx={{
          py: { xs: 10, md: 16 },
          bgcolor: "#FFFFFF",
          borderTop: `1px solid ${DESIGN_TOKENS.line[200]}`,
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          <Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 7 } }}>
            <Chip
              label="Tailored Workflows"
              sx={{
                bgcolor: DESIGN_TOKENS.brand[50],
                color: DESIGN_TOKENS.brand[600],
                fontWeight: 700,
                fontSize: "0.75rem",
                mb: 2,
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
                letterSpacing: "-0.025em",
                mb: 2,
              }}
            >
              Purpose-built interfaces for every stakeholder
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                color: "#64748B",
                lineHeight: 1.6,
              }}
            >
              Experience seamless role-based isolation designed specifically for the person using it.
            </Typography>
          </Box>

          {/* Role Navigation Tabs */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 5,
              borderBottom: `1px solid ${DESIGN_TOKENS.line[200]}`,
            }}
          >
            <Tabs
              value={selectedRoleTab}
              onChange={(_, val) => setSelectedRoleTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontFamily: FONT_UI,
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  px: 3,
                  py: 1.5,
                  color: "#64748B",
                  "&.Mui-selected": {
                    color: DESIGN_TOKENS.brand[600],
                    fontWeight: 700,
                  },
                },
                "& .MuiTabs-indicator": {
                  bgcolor: DESIGN_TOKENS.brand[600],
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              {roleShowcase.map((item, idx) => (
                <Tab key={item.role} label={item.role} />
              ))}
            </Tabs>
          </Box>

          {/* Active Role Showcase Card (Smooth Animated Transition) */}
          <AnimatePresence mode="wait">
            {roleShowcase.map((item, idx) => {
              if (idx !== selectedRoleTab) return null;
              const RoleIcon = item.icon;

              return (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 3, sm: 5 },
                      borderRadius: "20px",
                      borderColor: DESIGN_TOKENS.line[200],
                      bgcolor: "#F8FAFC",
                      boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.05)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1.35fr 1fr" },
                        gap: { xs: 4, lg: 6 },
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Chip
                          icon={<RoleIcon sx={{ "&&": { fontSize: 16, color: DESIGN_TOKENS.brand[600] } }} />}
                          label={item.badge}
                          size="small"
                          sx={{
                            bgcolor: "#FFFFFF",
                            color: DESIGN_TOKENS.brand[600],
                            border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            mb: 2.5,
                            px: 0.5,
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontWeight: 800,
                            fontSize: { xs: "1.5rem", sm: "1.875rem" },
                            color: "#0F172A",
                            lineHeight: 1.25,
                            letterSpacing: "-0.02em",
                            mb: 2,
                          }}
                        >
                          {item.headline}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "1rem",
                            color: "#64748B",
                            lineHeight: 1.6,
                            mb: 3,
                          }}
                        >
                          {item.description}
                        </Typography>

                        <Stack spacing={1.5} sx={{ mb: 4 }}>
                          {item.bullets.map((bullet) => (
                            <Stack direction="row" spacing={1.5} alignItems="center" key={bullet}>
                              <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A" }} />
                              <Typography
                                sx={{
                                  fontFamily: FONT_UI,
                                  fontSize: "0.9375rem",
                                  fontWeight: 600,
                                  color: "#1E293B",
                                }}
                              >
                                {bullet}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>

                        <Button
                          component={RouterLink}
                          to="/login"
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            bgcolor: DESIGN_TOKENS.brand[600],
                            fontWeight: 700,
                            borderRadius: "10px",
                            px: 3,
                            py: 1.2,
                            textTransform: "none",
                            "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                          }}
                        >
                          Experience {item.role} Portal
                        </Button>
                      </Box>

                      {/* Interactive Metric Preview Box */}
                      <Box
                        sx={{
                          p: { xs: 3, sm: 4 },
                          borderRadius: "16px",
                          bgcolor: "#FFFFFF",
                          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                          boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "16px",
                            bgcolor: DESIGN_TOKENS.brand[50],
                            color: DESIGN_TOKENS.brand[600],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 2,
                          }}
                        >
                          <RoleIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "2.5rem",
                            fontWeight: 900,
                            color: DESIGN_TOKENS.brand[600],
                            letterSpacing: "-0.02em",
                            lineHeight: 1,
                          }}
                        >
                          {item.stats.primary}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            color: "#0F172A",
                            mt: 0.75,
                          }}
                        >
                          {item.stats.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5 }}>
                          Guaranteed by verified RBAC authorization tokens
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Box>
      </Box>

      {/* =========================================================================
          6. FINAL BOLD CLOSING CTA BANNER (Deep Brand Canvas)
          ========================================================================= */}
      <Box
        sx={{
          py: { xs: 12, md: 16 },
          bgcolor: "#0B132B", // Deep Navy brand background
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radiant Glow Accent */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 350, md: 700 },
            height: { xs: 350, md: 500 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            maxWidth: 820,
            mx: "auto",
            px: { xs: 2.5, sm: 4 },
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            component="h2"
            sx={{
              fontFamily: FONT_UI,
              fontWeight: 900,
              fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" },
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              mb: 2.5,
            }}
          >
            Ready to upgrade your residential property operations?
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: { xs: "1rem", sm: "1.1875rem" },
              color: "#94A3B8",
              lineHeight: 1.6,
              mb: 5,
            }}
          >
            Eliminate cash disputes, delayed maintenance tickets, and gate security blind spots with an enterprise
            platform built for residential societies.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center">
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: "#6366F1",
                color: "#FFFFFF",
                fontFamily: FONT_UI,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                borderRadius: "12px",
                px: 4,
                py: 1.6,
                boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
                "&:hover": {
                  bgcolor: "#4F46E5",
                  boxShadow: "0 12px 30px rgba(99, 102, 241, 0.5)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Sign In to Platform
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
                py: 1.6,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                },
              }}
            >
              Request Access
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* =========================================================================
          7. FOOTER
          ========================================================================= */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#060A17", // Deeper dark footer
          color: "#94A3B8",
          py: { xs: 8, md: 10 },
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "2fr 1fr 1fr 1fr" },
              gap: { xs: 4, md: 6 },
              mb: 8,
            }}
          >
            {/* Column 1: Brand info */}
            <Box>
              <BrandLogo
                theme="dark"
                variant="full"
                size={34}
                title="Flat Maintenance"
                subtitle="Residential Operations"
                href="/"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6, maxWidth: 300, mt: 1.5 }}>
                Enterprise property facilities, automated maintenance collections, and gate security for multi-story
                complexes and residential towers.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700 }}>
                  All Platform Systems Operational
                </Typography>
              </Box>
            </Box>

            {/* Column 2: Platform */}
            <Box>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Platform Modules
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Maintenance Billing</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Field Work Orders</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Visitor Gate Passes</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Resident Bulletins</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Audit Compliance Log</Typography>
              </Stack>
            </Box>

            {/* Column 3: Roles */}
            <Box>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Stakeholders
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Building Admins</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Society Accountants</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Flat Owners & Tenants</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Security & Gate Crews</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Maintenance Staff</Typography>
              </Stack>
            </Box>

            {/* Column 4: Compliance */}
            <Box>
              <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.875rem", color: "#FFFFFF", mb: 2 }}>
                Security & Trust
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Enterprise RBAC Matrix</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Zero-Trust Auth Tokens</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Immutable Audit Trail</Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>Data Isolation Policies</Typography>
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 4 }} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              © {new Date().getFullYear()} Flat Maintenance Management System. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              High-Availability Residential Facilities Infrastructure
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
