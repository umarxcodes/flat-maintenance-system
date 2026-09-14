// =====================  ROLE-AWARE DASHBOARD (SUPER-CLEAN FIGMA SPEC)  ===========
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import BuildIcon from "@mui/icons-material/Build";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../providers/auth-context.js";
import { ROLES, ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { useMaintenanceRequestsList } from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useInvoicesList } from "../../features/invoices/hooks/use-invoices.js";
import { useNoticesList } from "../../features/notices/hooks/use-notices.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useVisitorsList } from "../../features/visitors/hooks/use-visitors.js";
import { TrendChart } from "../../components/common/TrendChart.jsx";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

export const DashboardPage = () => {
  const { user, activeBuildingId } = useAuth();
  const role = user?.role || ROLES.TENANT;

  // Real-time server queries
  const { data: maintenanceData, isLoading: loadingMaintenance } = useMaintenanceRequestsList({
    buildingId: activeBuildingId,
    limit: 6,
  });
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoicesList({
    buildingId: activeBuildingId,
    limit: 10,
  });
  const { data: noticesData } = useNoticesList({
    buildingId: activeBuildingId,
    limit: 4,
  });
  const { data: flatsData } = useFlatsList({
    buildingId: activeBuildingId,
    limit: 100,
  });
  const { data: visitorsData } = useVisitorsList({
    buildingId: activeBuildingId,
    limit: 8,
  });

  const requests =
    maintenanceData?.requests || (Array.isArray(maintenanceData) ? maintenanceData : []);
  const invoices = invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []);
  const notices = noticesData?.notices || (Array.isArray(noticesData) ? noticesData : []);
  const flats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);
  const visitors = visitorsData?.visitors || (Array.isArray(visitorsData) ? visitorsData : []);

  // Compute live operational metrics
  const openRequests = requests.filter((r) => r.status === "OPEN" || r.status === "TRIAGED");
  const occupiedFlats = flats.filter((f) => f.status === "OCCUPIED").length;
  const vacantFlats = flats.filter((f) => f.status === "VACANT").length;
  const totalFlats = flats.length || 1;
  const occupancyPct = Math.round((occupiedFlats / totalFlats) * 100);

  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");
  const totalOverdueAmount = overdueInvoices.reduce(
    (acc, curr) => acc + (curr.dueAmount || curr.totalAmount || 0),
    0
  );
  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const collectionRate =
    invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 100;

  // Expected visitors count for security staff
  const expectedVisitors = visitors.filter((v) => v.status === "EXPECTED");
  const checkedInVisitors = visitors.filter((v) => v.status === "CHECKED_IN");

  return (
    <Box sx={{ width: "100%" }}>
      {/* Page Header */}
      <PageHeader
        title={`Good day, ${user?.firstName || "Resident"}`}
        subtitle={`${ROLE_LABELS[role] || role} • Digital Lobby & Operations`}
        breadcrumbs={[{ label: "Overview" }]}
        action={
          (role === ROLES.OWNER || role === ROLES.TENANT) && (
            <Stack direction="row" spacing={1.5}>
              <Button
                component={RouterLink}
                to="/maintenance-requests"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Submit Work Order
              </Button>
              <Button
                component={RouterLink}
                to="/visitors"
                variant="outlined"
                sx={{
                  borderColor: DESIGN_TOKENS.line[200],
                  fontWeight: 600,
                  color: DESIGN_TOKENS.text.primary,
                  "&:hover": {
                    borderColor: DESIGN_TOKENS.line[300],
                    bgcolor: DESIGN_TOKENS.surface[50],
                  },
                }}
              >
                Create Guest Pass
              </Button>
            </Stack>
          )
        }
      />

      {/* =========================================================================
          ROLE-SPECIFIC STATCARD ROWS (SUPER CLEAN & AIRY)
          ========================================================================= */}
      <Box
        sx={{
          mb: 4,
          animation: "fadeInUp 0.35s ease-out both",
          "@keyframes fadeInUp": {
            "0%": { opacity: 0, transform: "translateY(6px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      >
        {/* 1. SUPER_ADMIN / BUILDING_ADMIN */}
        {(role === ROLES.SUPER_ADMIN || role === ROLES.BUILDING_ADMIN) && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`${occupancyPct}%`}
                label="Occupancy Rate"
                delta={`${occupiedFlats} occupied, ${vacantFlats} vacant units`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={openRequests.length}
                label="Active Work Orders"
                delta={`${openRequests.length} awaiting dispatch`}
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={`${collectionRate}%`}
                label="Maintenance Collections"
                delta={`${paidInvoices.length} of ${invoices.length} invoices settled`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={overdueInvoices.length}
                label="Overdue Invoices"
                delta={
                  totalOverdueAmount > 0
                    ? `₨${totalOverdueAmount.toLocaleString()} outstanding`
                    : "All accounts clear"
                }
              />
            </Grid>
          </Grid>
        )}

        {/* 2. MANAGER */}
        {role === ROLES.MANAGER && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={openRequests.length}
                label="Tickets Needing Triage"
                delta="Actionable priority tickets"
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={requests.filter((r) => r.status === "IN_PROGRESS").length}
                label="Tickets In Progress"
                delta="Assigned to on-duty specialists"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={notices.length}
                label="Active Community Notices"
                delta="Broadcasted across building"
              />
            </Grid>
          </Grid>
        )}

        {/* 3. ACCOUNTANT */}
        {role === ROLES.ACCOUNTANT && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="Collection Efficiency"
                delta={`${paidInvoices.length} settled this billing period`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={overdueInvoices.length}
                label="Overdue Accounts"
                delta={
                  totalOverdueAmount > 0
                    ? `₨${totalOverdueAmount.toLocaleString()} total pending`
                    : "Zero overdue dues"
                }
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={invoices.length}
                label="Total Invoices Issued"
                delta="Click through to billing registry"
              />
            </Grid>
          </Grid>
        )}

        {/* 4. MAINTENANCE_STAFF */}
        {role === ROLES.MAINTENANCE_STAFF && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={requests.length}
                label="Assigned Work Orders"
                delta="Prioritized duty schedule"
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={
                  requests.filter((r) => r.priority === "EMERGENCY" || r.priority === "HIGH").length
                }
                label="High / Emergency Urgency"
                delta="Requires immediate dispatch"
              />
            </Grid>
          </Grid>
        )}

        {/* 5. SECURITY_STAFF */}
        {role === ROLES.SECURITY_STAFF && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={expectedVisitors.length}
                label="Expected Arrivals Today"
                delta="Pre-approved resident passes"
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={checkedInVisitors.length}
                label="Currently Inside Premises"
                delta="Active visitor passes"
              />
            </Grid>
          </Grid>
        )}

        {/* 6. OWNER & TENANT RESIDENTS */}
        {(role === ROLES.OWNER || role === ROLES.TENANT) && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={
                  overdueInvoices.length > 0 ? `₨${totalOverdueAmount.toLocaleString()}` : "₨0"
                }
                label="Dues Status"
                delta={
                  overdueInvoices.length > 0
                    ? "Maintenance fee overdue"
                    : "All maintenance dues settled"
                }
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={requests.length}
                label="My Service Requests"
                delta="Active tickets in your flat"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                value={notices.length}
                label="Building Bulletins"
                delta="Latest announcements from management"
              />
            </Grid>
          </Grid>
        )}
      </Box>

      {/* =========================================================================
          PRIMARY OPERATIONAL PANELS (SUPER CLEAN CARDS & DIVIDED LISTS)
          ========================================================================= */}

      {/* 1. SECURITY STAFF: ONE-TAP GATE TERMINAL LAUNCHER */}
      {role === ROLES.SECURITY_STAFF && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3.5, sm: 5 },
            textAlign: "center",
            borderRadius: "14px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[600],
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.375rem",
              fontWeight: 700,
              color: DESIGN_TOKENS.text.primary,
              letterSpacing: "-0.015em",
              mb: 1,
            }}
          >
            Gate Security Terminal
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: DESIGN_TOKENS.text.secondary,
              mb: 3.5,
              maxWidth: 460,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Verify arriving visitor QR passes, register incoming guests, and log departures with
            spacious, responsive controls.
          </Typography>
          <Button
            component={RouterLink}
            to="/visitors/verify"
            variant="contained"
            size="large"
            startIcon={<QrCodeScannerIcon />}
            sx={{
              minHeight: 46,
              px: 3.5,
              fontSize: "0.9375rem",
              fontWeight: 600,
              borderRadius: "8px",
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": {
                bgcolor: DESIGN_TOKENS.brand[700],
              },
            }}
          >
            Open Verification Terminal
          </Button>
        </Paper>
      )}

      {/* 2. MANAGER / ADMINS: ACTIONABLE QUEUE & CHARTS (TWO-COLUMN SPLIT) */}
      {(role === ROLES.MANAGER || role === ROLES.SUPER_ADMIN || role === ROLES.BUILDING_ADMIN) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={7}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "14px",
                borderColor: DESIGN_TOKENS.line[200],
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        color: DESIGN_TOKENS.text.primary,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Actionable Work Orders
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                    >
                      Requires immediate triage and technician assignment
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to="/maintenance-requests"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: DESIGN_TOKENS.brand[600],
                    }}
                  >
                    View All
                  </Button>
                </Box>

                {loadingMaintenance ? (
                  <TableLoadingSkeleton rows={4} />
                ) : requests.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                    >
                      All clear — no pending work orders awaiting attention.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {requests.slice(0, 5).map((req) => (
                      <Box
                        key={req._id}
                        component={RouterLink}
                        to="/maintenance-requests"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.75,
                          borderRadius: "10px",
                          border: "1px solid #F1F5F9",
                          bgcolor: "#FFFFFF",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: DESIGN_TOKENS.line[200],
                            bgcolor: DESIGN_TOKENS.surface[50],
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.75,
                            minWidth: 0,
                            mr: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "8px",
                              bgcolor:
                                req.priority === "EMERGENCY"
                                  ? "#FEE2E2"
                                  : DESIGN_TOKENS.surface[100],
                              color:
                                req.priority === "EMERGENCY"
                                  ? DESIGN_TOKENS.danger[600]
                                  : DESIGN_TOKENS.brand[600],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <BuildIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: DESIGN_TOKENS.text.primary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {req.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: DESIGN_TOKENS.text.secondary,
                                fontSize: "0.75rem",
                                display: "block",
                              }}
                            >
                              #{req.requestNumber || req._id?.slice(-6)} • {req.category}
                            </Typography>
                          </Box>
                        </Box>

                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", flexShrink: 0 }}
                        >
                          <Chip
                            label={req.priority}
                            size="small"
                            sx={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              height: 22,
                              borderRadius: "999px",
                              bgcolor:
                                req.priority === "EMERGENCY"
                                  ? "#FEE2E2"
                                  : DESIGN_TOKENS.surface[100],
                              color:
                                req.priority === "EMERGENCY"
                                  ? DESIGN_TOKENS.danger[600]
                                  : DESIGN_TOKENS.text.secondary,
                            }}
                          />
                          <StatusChip status={req.status} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* SIDE PANEL: TREND CHART & LATEST NOTICES */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <TrendChart
                title="Collections & Invoicing Trend"
                subtitle="Monthly operational collection rate"
                metric={`${collectionRate}% Paid`}
                color={DESIGN_TOKENS.brand[600]}
                data={[68, 72, 79, 82, 86, collectionRate]}
                labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Current"]}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: "14px",
                  borderColor: DESIGN_TOKENS.line[200],
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        color: DESIGN_TOKENS.text.primary,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Community Bulletins
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                    >
                      Official building broadcast announcements
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to="/notices"
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: DESIGN_TOKENS.brand[600],
                    }}
                  >
                    All Notices
                  </Button>
                </Box>

                {notices.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                    >
                      No published announcements at this moment.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {notices.slice(0, 2).map((notice) => (
                      <Box
                        key={notice._id}
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          bgcolor: DESIGN_TOKENS.surface[50],
                          border: "1px solid #F1F5F9",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: DESIGN_TOKENS.line[200],
                            bgcolor: "#FFFFFF",
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.75,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              color: DESIGN_TOKENS.text.primary,
                            }}
                          >
                            {notice.title}
                          </Typography>
                          <Chip
                            label={notice.priority}
                            size="small"
                            sx={{
                              fontSize: "0.6875rem",
                              height: 20,
                              borderRadius: "999px",
                              bgcolor:
                                notice.priority === "URGENT_EMERGENCY"
                                  ? "#FEE2E2"
                                  : DESIGN_TOKENS.surface[100],
                              color:
                                notice.priority === "URGENT_EMERGENCY"
                                  ? DESIGN_TOKENS.danger[600]
                                  : DESIGN_TOKENS.text.secondary,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: DESIGN_TOKENS.text.secondary,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.8125rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {notice.content}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* 3. ACCOUNTANT: RANKED OVERDUE LIST & RECONCILIATION CHART */}
      {(role === ROLES.ACCOUNTANT || role === ROLES.SUPER_ADMIN) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={7}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "14px",
                borderColor: DESIGN_TOKENS.line[200],
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_UI,
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      color: DESIGN_TOKENS.text.primary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Accounts Requiring Follow-up
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                  >
                    Ranked by outstanding dues • Click any row to inspect flat ledger
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to="/invoices"
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: DESIGN_TOKENS.brand[600],
                  }}
                >
                  Billing Registry
                </Button>
              </Box>

              {loadingInvoices ? (
                <TableLoadingSkeleton rows={4} />
              ) : overdueInvoices.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                  >
                    Outstanding balance is zero. All resident accounts are settled.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {overdueInvoices.slice(0, 5).map((inv) => (
                    <Box
                      key={inv._id}
                      component={RouterLink}
                      to={`/invoices/${inv._id}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.75,
                        borderRadius: "10px",
                        border: "1px solid #F1F5F9",
                        bgcolor: "#FFFFFF",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.line[200],
                          bgcolor: DESIGN_TOKENS.surface[50],
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}
                        >
                          Invoice #{inv.invoiceNumber}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}
                        >
                          Period: {inv.periodMonth}/{inv.periodYear} • Due:{" "}
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Typography
                          sx={{
                            fontFamily: FONT_UI,
                            fontSize: "1.0625rem",
                            fontWeight: 700,
                            color: DESIGN_TOKENS.danger[600],
                            letterSpacing: "-0.01em",
                          }}
                        >
                          ₨{(inv.dueAmount || inv.totalAmount || 0).toLocaleString()}
                        </Typography>
                        <StatusChip status={inv.status} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
            <TrendChart
              title="Settlement & Ledger Efficiency"
              subtitle="6-month cumulative recovery trajectory"
              metric={`${collectionRate}% Cleared`}
              color={DESIGN_TOKENS.accent.green}
              data={[58, 64, 72, 79, 86, collectionRate]}
              labels={["Sep", "Oct", "Nov", "Dec", "Jan", "Current"]}
            />
          </Grid>
        </Grid>
      )}

      {/* 4. MAINTENANCE STAFF: ACTION LIST */}
      {role === ROLES.MAINTENANCE_STAFF && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "14px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            mb: 4,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
                letterSpacing: "-0.01em",
              }}
            >
              Today's Work Schedule
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
            >
              Ordered by urgency and appointment time. Tap any card to update job status.
            </Typography>
          </Box>

          <Stack spacing={1.25}>
            {requests.map((req) => (
              <Box
                key={req._id}
                component={RouterLink}
                to="/maintenance-requests"
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: 2,
                  p: 2,
                  minHeight: 52,
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: req.priority === "EMERGENCY" ? "#FECACA" : "#F1F5F9",
                  bgcolor: req.priority === "EMERGENCY" ? "#FEF2F2" : "#FFFFFF",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor:
                      req.priority === "EMERGENCY"
                        ? DESIGN_TOKENS.danger[600]
                        : DESIGN_TOKENS.line[200],
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  },
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: DESIGN_TOKENS.text.primary,
                      fontSize: "0.9375rem",
                    }}
                  >
                    {req.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: DESIGN_TOKENS.text.secondary,
                      fontSize: "0.8125rem",
                      mt: 0.25,
                      display: "block",
                    }}
                  >
                    Unit: {req.flatId?.flatNumber || "Assigned Unit"} • Category: {req.category}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <Chip
                    label={req.priority}
                    size="small"
                    sx={{
                      borderRadius: "999px",
                      fontWeight: 600,
                      bgcolor:
                        req.priority === "EMERGENCY" ? "#FEE2E2" : DESIGN_TOKENS.surface[100],
                      color:
                        req.priority === "EMERGENCY"
                          ? DESIGN_TOKENS.danger[600]
                          : DESIGN_TOKENS.text.secondary,
                    }}
                  />
                  <StatusChip status={req.status} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* 5. RESIDENT (OWNER / TENANT): DUES OVERVIEW & QUICK ACTIONS */}
      {(role === ROLES.OWNER || role === ROLES.TENANT) && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "14px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            mb: 4,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
                letterSpacing: "-0.01em",
              }}
            >
              My Residence Ledger
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
            >
              Official monthly flat maintenance charges and receipts
            </Typography>
          </Box>

          {invoices.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
              >
                No invoices issued yet for your residence.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {invoices.slice(0, 3).map((inv) => (
                <Box
                  key={inv._id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: "10px",
                    border: "1px solid #F1F5F9",
                    bgcolor: "#FFFFFF",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: DESIGN_TOKENS.line[200],
                      bgcolor: DESIGN_TOKENS.surface[50],
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    },
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}
                    >
                      Invoice #{inv.invoiceNumber}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}
                    >
                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontWeight: 700,
                        fontSize: "1.0625rem",
                        color: DESIGN_TOKENS.text.primary,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ₨{(inv.totalAmount || 0).toLocaleString()}
                    </Typography>
                    <StatusChip status={inv.status} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPage;
