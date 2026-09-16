// =====================  ROLES SHOWCASE TABS  =====================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import { motion, AnimatePresence } from "framer-motion";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { DESIGN_TOKENS } from "../../../theme/palette.js";
import { FONT_UI } from "../../../theme/typography.js";
import { StatusChip } from "../../../components/common/StatusChip.jsx";

export const RolesShowcaseTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  const rolesData = [
    {
      role: "Building Admins",
      tabLabel: "For Admins",
      icon: SupervisorAccountIcon,
      badge: "Total Building Governance",
      headline: "Executive Oversight of All Flats, Dues & On-Duty Crew",
      description:
        "Govern occupancy, monitor cross-tower outstanding balances, broadcast emergency notifications, and supervise maintenance resolution times from a single high-density cockpit.",
      bullets: [
        "Real-time occupancy metrics and verified unit directory",
        "Automatic 72-hour management escalation on pending work orders",
        "1-click broadcast of digital society notices to all residents",
      ],
      mockupData: {
        stat1: { title: "Total Occupancy", value: "98.4%", subtitle: "126 of 128 units occupied" },
        stat2: { title: "Open Work Orders", value: "4 Tickets", subtitle: "Average SLA: 2.4 hours" },
        stat3: { title: "Collections Pace", value: "₨ 1.84M", subtitle: "+14% vs. previous cycle" },
        cardTitle: "Recent Society Activity",
        rows: [
          { label: "Flat 402 - Water Heater Replacement", status: "IN_PROGRESS", tag: "Plumbing" },
          { label: "Notice: Annual General Meeting Scheduled", status: "ACTIVE", tag: "Broadcast" },
          { label: "Flat 101 - Monthly Maintenance Dues Paid", status: "COMPLETED", tag: "Finance" },
        ],
      },
    },
    {
      role: "Accountants",
      tabLabel: "For Accountants",
      icon: AccountBalanceWalletIcon,
      badge: "Financial Control & Ledger Integrity",
      headline: "Zero-Leakage Dues Collection & Automated Reconciliation",
      description:
        "Issue monthly maintenance assessments with automated billing calculations, reconcile verified Pakistani Rupee bank transfers, track overdue units, and generate audit-ready statements.",
      bullets: [
        "Overdue account rankings with calculated late penalty rules",
        "Expense voucher management with multi-tier approvals",
        "1-click exportable Excel and CSV audit statements",
      ],
      mockupData: {
        stat1: { title: "Dues Recovered", value: "₨ 2.45M", subtitle: "96.4% on-time settlement" },
        stat2: { title: "Overdue Balance", value: "₨ 84,000", subtitle: "3 flats flagged" },
        stat3: { title: "Approved Expenses", value: "₨ 412,000", subtitle: "Security, Generator, Sanitation" },
        cardTitle: "Latest Financial Vouchers",
        rows: [
          { label: "Voucher #V-894 - Diesel for Backup Generator", status: "APPROVED", tag: "Expense" },
          { label: "Flat 204 - Monthly Dues Assessment", status: "PAID", tag: "Assessment" },
          { label: "Voucher #V-895 - Lift Maintenance Contract", status: "PENDING", tag: "Expense" },
        ],
      },
    },
    {
      role: "Residents (Owners & Tenants)",
      tabLabel: "For Residents",
      icon: PersonIcon,
      badge: "Frictionless Resident Experience",
      headline: "A Premium Self-Service Portal for Invoices, Tickets & Passes",
      description:
        "Residents can view itemized billing breakdowns, download settlement vouchers, track maintenance repair technician status, and generate digital gate passes for visitors.",
      bullets: [
        "Instant digital invoice downloads and payment histories",
        "Photo-attached maintenance complaint submissions with SLA tracking",
        "6-digit temporary visitor gate entry codes for friends and couriers",
      ],
      mockupData: {
        stat1: { title: "Current Bill", value: "₨ 8,500", subtitle: "Due on Sep 25, 2026" },
        stat2: { title: "Active Tickets", value: "1 Active", subtitle: "A/C Drainage Inspection" },
        stat3: { title: "Visitor Passes", value: "2 Active", subtitle: "Valid until 11:00 PM" },
        cardTitle: "My Flat Dashboard (Flat 301)",
        rows: [
          { label: "Visitor Pass #9401 - Courier Delivery", status: "ACTIVE", tag: "Gate Pass" },
          { label: "Maintenance Ticket #104 - A/C Inspection", status: "ASSIGNED", tag: "Work Order" },
          { label: "August Maintenance Dues - ₨ 8,500", status: "PAID", tag: "Settlement" },
        ],
      },
    },
    {
      role: "Security Staff",
      tabLabel: "For Security Crew",
      icon: SecurityIcon,
      badge: "Gate Integrity & Perimeter Defense",
      headline: "Rapid Gate Check-In & Digital Visitor Logs",
      description:
        "Guard booth personnel verify visitor entry codes on mobile or tablet terminals in under five seconds, maintaining digital vehicle license logs without messy paper registers.",
      bullets: [
        "Sub-second verification of 6-digit visitor PINs",
        "Vehicle number plate and delivery vendor logging",
        "Direct intercom contact with residents for unannounced visitors",
      ],
      mockupData: {
        stat1: { title: "Guests Logged Today", value: "68 Visitors", subtitle: "Peak: 5:00 PM - 8:00 PM" },
        stat2: { title: "Expected Arrivals", value: "12 Passes", subtitle: "Pre-authorized by residents" },
        stat3: { title: "Active Vehicles", value: "44 Parked", subtitle: "Designated visitor bays" },
        cardTitle: "Live Gate Check-In Terminal",
        rows: [
          { label: "Pass #482910 - Tariq Qureshi (Flat 201)", status: "VERIFIED", tag: "Guest" },
          { label: "Pass #482911 - Foodpanda Delivery (Flat 402)", status: "VERIFIED", tag: "Vendor" },
          { label: "Pass #482912 - Electrician Crew", status: "CHECKED_IN", tag: "Contractor" },
        ],
      },
    },
  ];

  const currentRole = rolesData[activeTab];

  return (
    <Box sx={{ width: "100%", py: { xs: 8, md: 14 }, bgcolor: "#F8FAFC" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 7 } }}>
          <Chip
            label="Tailored Experiences"
            size="small"
            sx={{
              bgcolor: "rgba(79, 70, 229, 0.08)",
              color: DESIGN_TOKENS.brand[600],
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
            Built for every stakeholder in the community
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.0625rem",
              color: "#64748B",
              lineHeight: 1.6,
            }}
          >
            No one-size-fits-all confusion. Each platform role experiences a tailored, dedicated workflow with strict
            permission guardrails.
          </Typography>
        </Box>

        {/* Tab Selector */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 4, md: 6 } }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: "#FFFFFF",
              p: 0.75,
              borderRadius: "14px",
              border: `1px solid ${DESIGN_TOKENS.line[200]}`,
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              "& .MuiTabs-indicator": {
                bgcolor: DESIGN_TOKENS.brand[600],
                height: "100%",
                borderRadius: "10px",
                zIndex: 0,
              },
            }}
          >
            {rolesData.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeTab === idx;
              return (
                <Tab
                  key={item.role}
                  icon={<Icon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={item.tabLabel}
                  sx={{
                    fontFamily: FONT_UI,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    textTransform: "none",
                    minHeight: 44,
                    px: { xs: 2, sm: 3 },
                    borderRadius: "10px",
                    zIndex: 1,
                    color: isSelected ? "#FFFFFF !important" : "#64748B",
                    transition: "color 0.2s ease",
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Tab Content Cross-Fade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Grid container spacing={4} alignItems="center">
              {/* Left Side: Copy and Bullets */}
              <Grid item xs={12} md={6}>
                <Chip
                  label={currentRole.badge}
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
                    fontSize: { xs: "1.5rem", sm: "1.875rem" },
                    color: "#0F172A",
                    lineHeight: 1.25,
                    mb: 2,
                  }}
                >
                  {currentRole.headline}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontSize: "1rem",
                    color: "#475569",
                    lineHeight: 1.6,
                    mb: 3.5,
                  }}
                >
                  {currentRole.description}
                </Typography>

                <Stack spacing={1.75}>
                  {currentRole.bullets.map((bullet, bIdx) => (
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" key={bIdx}>
                      <CheckCircleIcon sx={{ fontSize: 20, color: DESIGN_TOKENS.brand[600], mt: 0.25, flexShrink: 0 }} />
                      <Typography sx={{ fontFamily: FONT_UI, fontSize: "0.9375rem", color: "#1E293B", fontWeight: 600 }}>
                        {bullet}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>

              {/* Right Side: Realistic UI Dashboard Card Mockup */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: "20px",
                    bgcolor: "#FFFFFF",
                    borderColor: DESIGN_TOKENS.line[200],
                    boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  {/* Top 3 Stat Cards Mini-Grid */}
                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    {Object.values(currentRole.mockupData)
                      .slice(0, 3)
                      .map((stat, sIdx) => (
                        <Grid item xs={4} key={sIdx}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: "12px",
                              bgcolor: "#F8FAFC",
                              border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.6875rem", display: "block" }}>
                              {stat.title}
                            </Typography>
                            <Typography sx={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: "1.125rem", color: "#0F172A", my: 0.25 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.brand[600], fontSize: "0.65rem", display: "block", fontWeight: 600 }}>
                              {stat.subtitle}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>

                  {/* Activity Feed Mockup */}
                  <Typography variant="subtitle2" sx={{ fontFamily: FONT_UI, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
                    {currentRole.mockupData.cardTitle}
                  </Typography>

                  <Stack spacing={1}>
                    {currentRole.mockupData.rows.map((row, rIdx) => (
                      <Box
                        key={rIdx}
                        sx={{
                          p: 1.25,
                          borderRadius: "10px",
                          bgcolor: "#FFFFFF",
                          border: `1px solid ${DESIGN_TOKENS.line[200]}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "background 0.15s ease",
                          "&:hover": { bgcolor: "#F8FAFC" },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                          <Chip
                            label={row.tag}
                            size="small"
                            sx={{
                              fontSize: "0.65rem",
                              height: 20,
                              fontWeight: 700,
                              bgcolor: "#EEF2FF",
                              color: DESIGN_TOKENS.brand[600],
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: FONT_UI,
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: "#0F172A",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.label}
                          </Typography>
                        </Stack>
                        <StatusChip status={row.status} size="small" />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default RolesShowcaseTabs;
