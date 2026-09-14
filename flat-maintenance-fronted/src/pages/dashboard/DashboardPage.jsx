// =====================  ROLE-AWARE DASHBOARD (SECTION 39, 39.1 & APPENDIX §A.4/§A.5)  ===========
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
      {/* Page Header (Fraunces Display font per Appendix A.2) */}
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
              >
                Submit Work Order
              </Button>
              <Button component={RouterLink} to="/visitors" variant="outlined">
                Create Guest Pass
              </Button>
            </Stack>
          )
        }
      />

      {/* =========================================================================
          ROLE-SPECIFIC STATCARD ROWS (APPENDIX §A.4 & §A.6 DELIBERATE LOAD-IN MOTION)
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
                delta={`${occupiedFlats} occupied, ${vacantFlats} vacant`}
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
                delta={`${paidInvoices.length} of ${invoices.length} invoices paid`}
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
                delta="Direct action queue below"
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
                delta="Click through to ledger"
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
          PRIMARY ROLE-TAILORED CONTENT (SECTION 39.1 CRAFT NOTES)
          ========================================================================= */}

      {/* 1. SECURITY STAFF: ONE-TAP GATE TERMINAL LAUNCHER */}
      {role === ROLES.SECURITY_STAFF && (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "12px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            mb: 4,
          }}
        >
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
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 480, mx: "auto" }}
          >
            Verify arriving guest passes, check in delivery drivers, and log visitor departures with
            large 44px tap targets.
          </Typography>
          <Button
            component={RouterLink}
            to="/visitors/verify"
            variant="contained"
            size="large"
            startIcon={<QrCodeScannerIcon />}
            sx={{
              minHeight: 48,
              px: 4,
              fontSize: "1rem",
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

      {/* 2. MANAGER / ADMINS: TRIAGE QUEUE & CHARTS (TWO-COLUMN SPLIT) */}
      {(role === ROLES.MANAGER || role === ROLES.SUPER_ADMIN || role === ROLES.BUILDING_ADMIN) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={7}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: "12px",
                borderColor: DESIGN_TOKENS.line[200],
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                height: "100%",
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
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: DESIGN_TOKENS.text.primary,
                    }}
                  >
                    Actionable Work Orders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires immediate triage and technician assignment
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to="/maintenance-requests"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>

              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : requests.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 3, textAlign: "center" }}
                >
                  All clear — no work orders awaiting attention at this moment.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {requests.slice(0, 5).map((req) => (
                    <Box
                      key={req._id}
                      component={RouterLink}
                      to="/maintenance-requests"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: DESIGN_TOKENS.line[200],
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.ink[900],
                          bgcolor: "rgba(20, 33, 61, 0.02)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "8px",
                            bgcolor:
                              req.priority === "EMERGENCY"
                                ? DESIGN_TOKENS.paper[50]
                                : "action.hover",
                            color:
                              req.priority === "EMERGENCY"
                                ? DESIGN_TOKENS.danger[600]
                                : DESIGN_TOKENS.ink[900],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BuildIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {req.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ticket #{req.requestNumber || req._id?.slice(-6)} • Category:{" "}
                            {req.category}
                          </Typography>
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Chip
                          label={req.priority}
                          size="small"
                          sx={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            height: 22,
                            borderRadius: "4px",
                            bgcolor: req.priority === "EMERGENCY" ? "#F6E7E5" : "#F6F4EF",
                            color: req.priority === "EMERGENCY" ? "#B3261E" : "#5B5F6B",
                          }}
                        />
                        <StatusChip status={req.status} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* SIDE PANEL: TREND CHART & LATEST NOTICES (SECTION 8.2 & APPENDIX §A.5) */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={2.5}>
              <TrendChart
                title="Collections & Invoicing Trend"
                subtitle="Monthly operational collection rate"
                metric={`${collectionRate}% Paid`}
                color={DESIGN_TOKENS.accent.blue}
                data={[68, 72, 79, 82, 86, collectionRate]}
                labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Current"]}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "12px",
                  borderColor: DESIGN_TOKENS.line[200],
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: DESIGN_TOKENS.text.primary,
                      }}
                    >
                      Community Bulletins
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Official building notices
                    </Typography>
                  </Box>
                  <Button component={RouterLink} to="/notices" size="small">
                    All Notices
                  </Button>
                </Box>

                {notices.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: "center" }}
                  >
                    No published notices.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {notices.slice(0, 2).map((notice) => (
                      <Box
                        key={notice._id}
                        sx={{
                          p: 2,
                          borderRadius: "8px",
                          bgcolor: DESIGN_TOKENS.surface[50],
                          border: "1px solid",
                          borderColor: DESIGN_TOKENS.line[200],
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, fontSize: "0.875rem" }}
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
                                  : "text.secondary",
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.8125rem",
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

      {/* 3. ACCOUNTANT: RANKED OVERDUE LIST & RECONCILIATION CHART (SECTION 8.2 & 8.5) */}
      {(role === ROLES.ACCOUNTANT || role === ROLES.SUPER_ADMIN) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={7}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: "12px",
                borderColor: DESIGN_TOKENS.line[200],
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: FONT_UI,
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: DESIGN_TOKENS.text.primary,
                    }}
                  >
                    Accounts Requiring Follow-up
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ranked by outstanding dues • Click any row to inspect flat ledger
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to="/invoices"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  Billing Registry
                </Button>
              </Box>

              {loadingInvoices ? (
                <TableLoadingSkeleton rows={4} />
              ) : overdueInvoices.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 3, textAlign: "center" }}
                >
                  Outstanding balance is zero. All tenant and owner accounts are settled!
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {overdueInvoices.slice(0, 5).map((inv) => (
                    <Box
                      key={inv._id}
                      component={RouterLink}
                      to={`/invoices/${inv._id}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: DESIGN_TOKENS.line[200],
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.brand[600],
                          bgcolor: DESIGN_TOKENS.surface[50],
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Invoice #{inv.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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

      {/* 4. MAINTENANCE STAFF: MOBILE-FIRST ACTION LIST (LARGE TAP TARGETS >= 44PX) */}
      {role === ROLES.MAINTENANCE_STAFF && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "12px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            mb: 4,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
              }}
            >
              Today's Work Schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ordered by urgency and appointment time. Tap any card to update job status.
            </Typography>
          </Box>

          <Stack spacing={2}>
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
                  p: 2.5,
                  minHeight: 52, // >= 44px tap target per Section 50 & Appendix A.8
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor:
                    req.priority === "EMERGENCY"
                      ? DESIGN_TOKENS.danger[600]
                      : DESIGN_TOKENS.line[200],
                  bgcolor: req.priority === "EMERGENCY" ? "#FEF2F2" : "#FFFFFF",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: DESIGN_TOKENS.brand[600],
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {req.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Location: Flat {req.flatId?.flatNumber || "Assigned Unit"} • Category:{" "}
                    {req.category}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Chip
                    label={req.priority}
                    size="small"
                    sx={{
                      borderRadius: "999px",
                      fontWeight: 600,
                      bgcolor:
                        req.priority === "EMERGENCY" ? "#FEE2E2" : DESIGN_TOKENS.surface[100],
                      color:
                        req.priority === "EMERGENCY" ? DESIGN_TOKENS.danger[600] : "text.secondary",
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
            p: 3,
            borderRadius: "12px",
            borderColor: DESIGN_TOKENS.line[200],
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            mb: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "1.125rem",
              fontWeight: 700,
              color: DESIGN_TOKENS.text.primary,
              mb: 0.5,
            }}
          >
            My Residence Ledger
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 3 }}>
            Review official monthly maintenance dues and download receipts
          </Typography>

          {invoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No invoices issued yet for your flat.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {invoices.slice(0, 3).map((inv) => (
                <Box
                  key={inv._id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: DESIGN_TOKENS.line[200],
                    bgcolor: DESIGN_TOKENS.surface[50],
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Invoice #{inv.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1rem" }}>
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
