// =====================  THE LIVING BUILDING  =====================
// Signature Interactive Isometric Residential Complex SVG Illustration
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { motion, AnimatePresence } from "framer-motion";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShieldIcon from "@mui/icons-material/Shield";
import CampaignIcon from "@mui/icons-material/Campaign";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { DESIGN_TOKENS } from "../../../theme/palette.js";
import { FONT_UI } from "../../../theme/typography.js";

/**
 * The Living Building:
 * Handcrafted isometric vector residential apartment complex that brings the product story
 * to life across 5 interactive scroll beats.
 *
 * @param {number} activeStage - Current scroll beat (0: Rest/Hero, 1: Work Orders, 2: Billing, 3: Security, 4: Notices, 5: Fully Lit)
 * @param {function} [onSelectStage] - Optional callback if user clicks an interactive preview tab
 */
export const LivingBuilding = ({ activeStage = 0, onSelectStage }) => {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // When reduced motion is preferred, render stage 5 (fully alive & steady)
  const stage = prefersReducedMotion ? 5 : activeStage;

  const stageLabels = [
    { id: 0, label: "Overview", icon: DoneAllIcon, tag: "128 Flats Managed" },
    { id: 1, label: "Work Orders", icon: BuildIcon, tag: "Rapid SLA Dispatch" },
    { id: 2, label: "Billing", icon: ReceiptLongIcon, tag: "Automated Ledgers" },
    { id: 3, label: "Security", icon: ShieldIcon, tag: "Gate Verification" },
    { id: 4, label: "Notices", icon: CampaignIcon, tag: "Instant Broadcast" },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 560,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Interactive Stage Indicator Pills (Clickable or Scroll-Synced) */}
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          mb: 2,
          p: 0.75,
          borderRadius: "100px",
          bgcolor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          zIndex: 10,
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        {stageLabels.map((item) => {
          const isActive = (stage === 5 && item.id === 0) || stage === item.id;
          const Icon = item.icon;
          return (
            <Chip
              key={item.id}
              icon={<Icon sx={{ fontSize: 15 }} />}
              label={item.label}
              size="small"
              onClick={() => onSelectStage && onSelectStage(item.id)}
              sx={{
                fontFamily: FONT_UI,
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: onSelectStage ? "pointer" : "default",
                bgcolor: isActive ? DESIGN_TOKENS.brand[600] : "transparent",
                color: isActive ? "#FFFFFF" : "#64748B",
                borderColor: isActive ? DESIGN_TOKENS.brand[600] : "transparent",
                transition: "all 0.2s ease",
                "& .MuiChip-icon": {
                  color: isActive ? "#FFFFFF" : DESIGN_TOKENS.brand[500],
                },
                "&:hover": {
                  bgcolor: isActive ? DESIGN_TOKENS.brand[700] : "rgba(238, 242, 255, 0.7)",
                },
              }}
            />
          );
        })}
      </Stack>

      {/* SVG Canvas Container with Ambient Glow Background */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: "24px",
          p: { xs: 1.5, sm: 2 },
          bgcolor: "#FFFFFF",
          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
          boxShadow:
            "0 20px 45px -10px rgba(79, 70, 229, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          overflow: "hidden",
        }}
      >
        {/* Soft Background Sky Gradient */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 20%, rgba(238, 242, 255, 0.75) 0%, rgba(248, 250, 252, 0.95) 70%)",
            zIndex: 0,
          }}
        />

        {/* Isometric Building SVG */}
        <svg
          viewBox="0 0 540 640"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            position: "relative",
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          <defs>
            {/* Window Glow Filter */}
            <filter id="windowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Balcony Shadow */}
            <linearGradient id="wallShadow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>

            <linearGradient id="facadeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EEF2FF" />
            </linearGradient>

            <linearGradient id="groundLawn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* ==================== 1. GROUND PLATFORM & DRIVEWAY ==================== */}
          <g id="ground">
            {/* Isometric Ground Slab */}
            <polygon
              points="270,440 500,530 270,620 40,530"
              fill="url(#groundLawn)"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Slab depth thickness */}
            <polygon
              points="40,530 270,620 270,632 40,542"
              fill="#94A3B8"
            />
            <polygon
              points="270,620 500,530 500,542 270,632"
              fill="#CBD5E1"
            />

            {/* Front Entrance Walkway / Driveway */}
            <polygon
              points="240,490 380,545 350,575 210,520"
              fill="#E0E7FF"
              stroke="#C7D2FE"
              strokeWidth="1"
            />

            {/* Street Line Markings */}
            <line x1="280" y1="520" x2="310" y2="532" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 3" />
            <line x1="330" y1="540" x2="360" y2="552" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 3" />

            {/* Street Trees / Planters */}
            <circle cx="80" cy="510" r="14" fill="#10B981" opacity="0.85" />
            <circle cx="110" cy="525" r="12" fill="#059669" opacity="0.85" />
            <circle cx="450" cy="515" r="14" fill="#10B981" opacity="0.85" />
          </g>

          {/* ==================== 2. RESIDENTIAL BUILDING BLOCK ==================== */}
          <g id="mainBuilding">
            {/* Left Wall (Deep Shaded Perspective) */}
            <polygon
              points="140,240 270,300 270,510 140,450"
              fill="url(#wallShadow)"
              stroke="#1E1B4B"
              strokeWidth="1"
            />

            {/* Front / Right Facade (Light Reflective) */}
            <polygon
              points="270,300 420,240 420,450 270,510"
              fill="url(#facadeGradient)"
              stroke="#C7D2FE"
              strokeWidth="1"
            />

            {/* Roof Slab */}
            <polygon
              points="270,120 420,180 270,240 120,180"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            <polygon
              points="120,180 270,240 270,248 120,188"
              fill="#6366F1"
            />
            <polygon
              points="270,240 420,180 420,188 270,248"
              fill="#818CF8"
            />

            {/* Rooftop Water Tank & Elevator Machine Room */}
            <polygon points="230,135 280,155 280,180 230,160" fill="#4338CA" />
            <polygon points="280,155 330,135 330,160 280,180" fill="#6366F1" />
            <polygon points="230,135 280,115 330,135 280,155" fill="#EEF2FF" stroke="#C7D2FE" />
            {/* Rooftop Solar Panels */}
            <polygon points="170,165 210,180 195,190 155,175" fill="#1E3A8A" stroke="#38BDF8" strokeWidth="0.8" />
            <polygon points="350,165 390,180 375,190 335,175" fill="#1E3A8A" stroke="#38BDF8" strokeWidth="0.8" />

            {/* External Stairwell / Glass Elevator Shaft (Left Facade) */}
            <rect x="180" y="275" width="28" height="155" rx="3" fill="#1E1B4B" opacity="0.6" />
            <line x1="180" y1="315" x2="208" y2="315" stroke="#6366F1" strokeWidth="1" opacity="0.6" />
            <line x1="180" y1="355" x2="208" y2="355" stroke="#6366F1" strokeWidth="1" opacity="0.6" />
            <line x1="180" y1="395" x2="208" y2="395" stroke="#6366F1" strokeWidth="1" opacity="0.6" />

            {/* Floor Separation Dividing Lines (Front Facade) */}
            <line x1="270" y1="355" x2="420" y2="295" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="270" y1="410" x2="420" y2="350" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="270" y1="465" x2="420" y2="405" stroke="#E2E8F0" strokeWidth="1.5" />
          </g>

          {/* ==================== 3. FLATS & WINDOWS (ANIMATED LIGHTS) ==================== */}
          <g id="windowsAndBalconies">
            {/* Floor 4: Penthouse / Flats 401 & 402 */}
            <rect
              x="290"
              y="265"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 1 ? "#FEF08A" : "#334155"}
              filter={stage >= 1 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="330"
              y="250"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 4 ? "#FEF08A" : "#334155"}
              filter={stage >= 4 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="370"
              y="235"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 2 ? "#FEF08A" : "#334155"}
              filter={stage >= 2 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />

            {/* Floor 3: Flats 301 & 302 (Billing Target) */}
            <rect
              x="290"
              y="320"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 2 ? "#FDE047" : "#334155"}
              filter={stage >= 2 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="330"
              y="305"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 3 ? "#FEF08A" : "#334155"}
              filter={stage >= 3 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="370"
              y="290"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 1 ? "#FEF08A" : "#334155"}
              filter={stage >= 1 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />

            {/* Floor 2: Flats 201 & 202 (Maintenance Target) */}
            <rect
              x="290"
              y="375"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 1 ? "#FDE047" : "#334155"}
              filter={stage >= 1 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            {/* Flat 201 Balcony Railing */}
            <polygon points="285,398 320,384 320,396 285,410" fill="#6366F1" opacity="0.3" stroke="#4F46E5" />
            <line x1="295" y1="394" x2="295" y2="405" stroke="#4F46E5" strokeWidth="1" />
            <line x1="305" y1="390" x2="305" y2="401" stroke="#4F46E5" strokeWidth="1" />
            <line x1="315" y1="386" x2="315" y2="397" stroke="#4F46E5" strokeWidth="1" />

            <rect
              x="330"
              y="360"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 3 ? "#FEF08A" : "#334155"}
              filter={stage >= 3 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="370"
              y="345"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 5 ? "#FEF08A" : "#334155"}
              filter={stage >= 5 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />

            {/* Floor 1: Flats 101 & 102 */}
            <rect
              x="290"
              y="430"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 4 ? "#FEF08A" : "#334155"}
              filter={stage >= 4 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
            <rect
              x="370"
              y="400"
              width="24"
              height="20"
              rx="2"
              fill={stage >= 2 ? "#FEF08A" : "#334155"}
              filter={stage >= 2 ? "url(#windowGlow)" : "none"}
              stroke="#CBD5E1"
            />
          </g>

          {/* ==================== 4. GROUND LOBBY & NOTICE BOARD ==================== */}
          <g id="lobbyAndNotice">
            {/* Double Glass Entrance Doors */}
            <rect x="330" y="445" width="32" height="36" rx="2" fill="#1E293B" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="346" y1="445" x2="346" y2="481" stroke="#818CF8" strokeWidth="1" />
            <rect x="334" y="452" width="9" height="24" fill="#93C5FD" opacity="0.6" />
            <rect x="349" y="452" width="9" height="24" fill="#93C5FD" opacity="0.6" />

            {/* Digital Community Notice Board on Facade */}
            <rect
              x="380"
              y="435"
              width="28"
              height="22"
              rx="2"
              fill={stage === 4 ? "#0284C7" : "#1E293B"}
              stroke="#38BDF8"
              strokeWidth="1.2"
            />
            {/* Notice Board Lines */}
            <line x1="384" y1="441" x2="404" y2="441" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="384" y1="446" x2="400" y2="446" stroke="#BAE6FD" strokeWidth="1" />
            <line x1="384" y1="450" x2="396" y2="450" stroke="#BAE6FD" strokeWidth="1" />
          </g>

          {/* ==================== 5. SECURITY BOOM BARRIER & GUARD GATE ==================== */}
          <g id="securityGate">
            {/* Guard Booth / Kiosk */}
            <polygon points="200,480 230,492 230,520 200,508" fill="#1E1B4B" />
            <polygon points="230,492 250,484 250,512 230,520" fill="#312E81" />
            <polygon points="200,480 220,472 250,484 230,492" fill="#4338CA" />
            {/* Booth Window */}
            <polygon points="208,490 224,497 224,507 208,500" fill="#93C5FD" opacity="0.8" />

            {/* Boom Barrier Pivot Post */}
            <rect x="238" y="508" width="6" height="18" fill="#F97316" rx="1" />

            {/* Boom Barrier Arm (Rotates up when stage === 3 or stage === 5) */}
            <motion.line
              x1="240"
              y1="512"
              x2="285"
              y2="530"
              stroke="#EF4444"
              strokeWidth="3.5"
              strokeDasharray="6 3"
              animate={{
                transformOrigin: "240px 512px",
                rotate: stage === 3 || stage === 5 ? -55 : 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </g>

          {/* ==================== 6. DYNAMIC FEATURE STORY ANIMATIONS ==================== */}

          {/* BEAT 1: Work Orders (Technician Climbs to Flat 201 + Resolution Badge) */}
          {(stage === 1 || stage === 5) && (
            <g id="workOrderStory">
              {/* Technician Moving Along Stairwell to Flat 201 */}
              <motion.g
                initial={{ x: 195, y: 440, opacity: 0 }}
                animate={{ x: 260, y: 385, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                {/* Technician Figure */}
                <circle cx="0" cy="-10" r="5" fill="#F97316" />
                <rect x="-4" y="-5" width="8" height="12" rx="2" fill="#EA580C" />
                <line x1="-3" y1="7" x2="-3" y2="14" stroke="#1E293B" strokeWidth="2" />
                <line x1="3" y1="7" x2="3" y2="14" stroke="#1E293B" strokeWidth="2" />
              </motion.g>
            </g>
          )}

          {/* BEAT 2: Billing & Ledgers (Invoice Token Drops from Flat 301 to Ledger) */}
          {(stage === 2 || stage === 5) && (
            <g id="billingStory">
              <motion.circle
                initial={{ cx: 302, cy: 330, opacity: 0, scale: 0.6 }}
                animate={{ cx: 346, cy: 470, opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: "easeIn" }}
                r="7"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                x="346"
                y="473"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="7"
                fontWeight="bold"
              >
                ₨
              </motion.text>
            </g>
          )}

          {/* BEAT 3: Security & Gate (Visitor Walks Through Open Gate) */}
          {(stage === 3 || stage === 5) && (
            <g id="securityStory">
              <motion.g
                initial={{ x: 295, y: 550, opacity: 0 }}
                animate={{ x: 255, y: 515, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Visitor Figure */}
                <circle cx="0" cy="-10" r="4.5" fill="#0284C7" />
                <rect x="-3.5" y="-5" width="7" height="11" rx="2" fill="#0369A1" />
                <line x1="-2.5" y1="6" x2="-2.5" y2="12" stroke="#0F172A" strokeWidth="1.8" />
                <line x1="2.5" y1="6" x2="2.5" y2="12" stroke="#0F172A" strokeWidth="1.8" />
              </motion.g>
            </g>
          )}

          {/* BEAT 4: Notices (Notice Ping Effect on Board) */}
          {(stage === 4 || stage === 5) && (
            <g id="noticesStory">
              <motion.circle
                cx="394"
                cy="446"
                r="16"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                initial={{ scale: 0.6, opacity: 1 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              />
            </g>
          )}
        </svg>

        {/* ==================== FLOATING DYNAMIC STORY BADGES ==================== */}
        <AnimatePresence mode="wait">
          {/* Stage 0: Overview / Occupancy Badge */}
          {(stage === 0 || stage === 5) && (
            <motion.div
              key="badge-overview"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                top: 24,
                left: 20,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#10B981",
                      boxShadow: "0 0 10px #10B981",
                    }}
                  />
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.78rem" }}>
                    128 Flats Managed • 98.4% Occupancy
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.6875rem", display: "block", mt: 0.25 }}>
                  Al-Raziq Royal Heights • Automated Operations Active
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Stage 1: Work Order Resolved Badge */}
          {stage === 1 && (
            <motion.div
              key="badge-workorder"
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute",
                top: 90,
                right: 20,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#FFFFFF",
                  border: `1px solid #FED7AA`,
                  boxShadow: "0 10px 25px rgba(249, 115, 22, 0.2)",
                  maxWidth: 220,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: "#FFEDD5",
                      color: "#EA580C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 15, color: "#16A34A" }} />
                  </Box>
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.78rem", color: "#0F172A" }}>
                    Ticket #104 Resolved
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.3, display: "block" }}>
                  Flat 201 plumbing leak dispatched & verified within 18 minutes.
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Stage 2: Billing & Recovery Badge */}
          {stage === 2 && (
            <motion.div
              key="badge-billing"
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute",
                bottom: 50,
                left: 20,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#FFFFFF",
                  border: `1px solid #C7D2FE`,
                  boxShadow: "0 10px 25px rgba(79, 70, 229, 0.2)",
                  maxWidth: 240,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: "#EEF2FF",
                      color: DESIGN_TOKENS.brand[600],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ReceiptLongIcon sx={{ fontSize: 15 }} />
                  </Box>
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.78rem", color: "#0F172A" }}>
                    ₨ 1,240,000 Collected
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.3, display: "block" }}>
                  Auto-reconciliation for Flat 301. 96.4% on-time recovery rate.
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Stage 3: Gate Pass Verified Badge */}
          {stage === 3 && (
            <motion.div
              key="badge-security"
              initial={{ opacity: 0, x: -15, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute",
                bottom: 60,
                right: 20,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#FFFFFF",
                  border: `1px solid #A7F3D0`,
                  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.2)",
                  maxWidth: 230,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 15 }} />
                  </Box>
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.78rem", color: "#0F172A" }}>
                    Pass #482910 Verified
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.3, display: "block" }}>
                  Guest check-in timestamp logged at Main Gate terminal.
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Stage 4: Notice Broadcast Badge */}
          {stage === 4 && (
            <motion.div
              key="badge-notices"
              initial={{ opacity: 0, y: -15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute",
                top: 70,
                left: 30,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#FFFFFF",
                  border: `1px solid #BAE6FD`,
                  boxShadow: "0 10px 25px rgba(2, 132, 199, 0.2)",
                  maxWidth: 240,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: "#E0F2FE",
                      color: "#0284C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CampaignIcon sx={{ fontSize: 15 }} />
                  </Box>
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.78rem", color: "#0F172A" }}>
                    Notice Broadcasted
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.3, display: "block" }}>
                  Water tank sanitization scheduled for Friday • Sent to all 128 units.
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default LivingBuilding;
