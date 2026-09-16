// =====================  THE OLD WAY VS THE NEW WAY  =====================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { motion } from "framer-motion";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VerifiedIcon from "@mui/icons-material/Verified";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { DESIGN_TOKENS } from "../../../theme/palette.js";
import { FONT_UI } from "../../../theme/typography.js";
import { StatusChip } from "../../../components/common/StatusChip.jsx";

export const OldVsNewComparison = () => {
  return (
    <Box sx={{ width: "100%", py: { xs: 8, md: 12 }, bgcolor: "#F8FAFC" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 6, md: 8 } }}>
          <Chip
            label="Real Emotional Contrast"
            size="small"
            sx={{
              bgcolor: "rgba(100, 116, 139, 0.12)",
              color: "#475569",
              fontFamily: FONT_UI,
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
              letterSpacing: "-0.03em",
              mb: 2,
            }}
          >
            How residential societies operate:{" "}
            <Box
              component="span"
              sx={{
                color: "#64748B",
                textDecoration: "line-through",
                fontWeight: 700,
              }}
            >
              Chaos
            </Box>{" "}
            vs. Calm Order
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            A calm, predictable community starts when you replace fragmented chat threads and lost paper logs with
            centralized digital accountability.
          </Typography>
        </Box>

        {/* Comparison Grid */}
        <Grid container spacing={4} alignItems="stretch">
          {/* THE OLD WAY (CHAOTIC & FRAGMENTED) */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              style={{ height: "100%" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, sm: 4 },
                  height: "100%",
                  borderRadius: "20px",
                  borderColor: "#E2E8F0",
                  bgcolor: "#F1F5F9",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header Tag */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      bgcolor: "#CBD5E1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748B",
                    }}
                  >
                    <CancelOutlinedIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.125rem", color: "#334155" }}>
                      The Fragmented Way
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                      Paper registers, lost WhatsApp chats & cash friction
                    </Typography>
                  </Box>
                </Stack>

                {/* Visual Chaos Mockup (Slightly overlapping, desaturated artifacts) */}
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    minHeight: 280,
                    p: 2,
                    mb: 3,
                    borderRadius: "14px",
                    bgcolor: "rgba(226, 232, 240, 0.5)",
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  {/* Faded Paper Register Note */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      width: 220,
                      p: 2,
                      borderRadius: "10px",
                      bgcolor: "#FEF9C3",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      transform: "rotate(-2deg)",
                      border: "1px solid #FDE047",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#854D0E", display: "block" }}>
                      Handwritten Maintenance Log (Sep)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#A16207", fontSize: "0.6875rem", display: "block", mt: 0.5 }}>
                      • Flat 402 paid ₨ 8,500 (slip lost?)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#A16207", fontSize: "0.6875rem", display: "block" }}>
                      • Flat 301 motor repair pending 5 days
                    </Typography>
                  </Box>

                  {/* Chaotic WhatsApp Bubble Cluster */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 20,
                      right: 16,
                      width: 240,
                      p: 2,
                      borderRadius: "12px",
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
                      transform: "rotate(2deg)",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                      <WhatsAppIcon sx={{ fontSize: 16, color: "#22C55E" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A" }}>
                        Society Group (248 members)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                      "Who authorized the elevator mechanic today? Water pressure is zero on the 3rd floor!!"
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.65rem", display: "block", textAlign: "right", mt: 0.5 }}>
                      94 unread messages
                    </Typography>
                  </Box>
                </Box>

                {/* Friction Points List */}
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CancelOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.875rem" }}>
                      Unreconciled bank slips with zero immutable audit trails.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CancelOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.875rem" }}>
                      Unassigned maintenance complaints lost in message threads.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CancelOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.875rem" }}>
                      Paper gate visitor registers with illegible phone numbers.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>

          {/* THE NEW WAY (CALM ORDER WITH FLAT-MAINTENANCE PORTAL) */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ height: "100%" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, sm: 4 },
                  height: "100%",
                  borderRadius: "20px",
                  borderColor: DESIGN_TOKENS.brand[200],
                  bgcolor: "#FFFFFF",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 12px 36px rgba(79, 70, 229, 0.08)",
                }}
              >
                {/* Header Tag */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      bgcolor: DESIGN_TOKENS.brand[50],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: DESIGN_TOKENS.brand[600],
                    }}
                  >
                    <VerifiedIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.125rem", color: "#0F172A" }}>
                      The Calm Operating System
                    </Typography>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.brand[600], fontSize: "0.75rem", fontWeight: 600 }}>
                      Automated Dues, Verified SLAs & 1-Click Gate Passes
                    </Typography>
                  </Box>
                </Stack>

                {/* Structured UI Cards Mockup */}
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    minHeight: 280,
                    p: 2,
                    mb: 3,
                    borderRadius: "14px",
                    bgcolor: "#F8FAFC",
                    border: `1px solid ${DESIGN_TOKENS.brand[100]}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 1.5,
                  }}
                >
                  {/* Digital Voucher Item */}
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: "10px",
                      bgcolor: "#FFFFFF",
                      border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <ReceiptLongIcon sx={{ color: DESIGN_TOKENS.brand[600], fontSize: 20 }} />
                      <Box>
                        <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>
                          Invoice #2026-09-F402
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem" }}>
                          Flat 402 • Maintenance Assessment (₨ 8,500)
                        </Typography>
                      </Box>
                    </Stack>
                    <StatusChip status="PAID" size="small" />
                  </Box>

                  {/* Dispatched Ticket Item */}
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: "10px",
                      bgcolor: "#FFFFFF",
                      border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                      <Box>
                        <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A" }}>
                          Work Request #WR-104
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem" }}>
                          Assigned to Tariq Mehmood (Electrician) • SLA: 2h
                        </Typography>
                      </Box>
                    </Stack>
                    <StatusChip status="IN_PROGRESS" size="small" />
                  </Box>
                </Box>

                {/* Calm System Guarantees List */}
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#1E293B", fontSize: "0.875rem", fontWeight: 600 }}>
                      Automatic reconciliation in Pakistani Rupees with digital audit trails.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#1E293B", fontSize: "0.875rem", fontWeight: 600 }}>
                      Enforced 72-hour work order SLA escalation to building committee.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleIcon sx={{ fontSize: 18, color: "#16A34A", mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: "#1E293B", fontSize: "0.875rem", fontWeight: 600 }}>
                      6-digit digital visitor entry verification at the guard terminal.
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default OldVsNewComparison;
