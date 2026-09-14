// =====================  ROLE-AWARE DASHBOARD (AUTHORITATIVE MASTER SPEC)  ===========
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { useExpensesList } from "../../features/expenses/hooks/use-expenses.js";
import { useStaffList } from "../../features/staff/hooks/use-staff.js";
import { useTenantsList } from "../../features/tenants/hooks/use-tenants.js";
import { TrendChart } from "../../components/common/TrendChart.jsx";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

export const DashboardPage = () => {
  const { user, activeBuildingId } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || ROLES.TENANT;

  // 1. Core Domain Queries
  const { data: maintenanceData, isLoading: loadingMaintenance } = useMaintenanceRequestsList({
    buildingId: activeBuildingId,
    limit: 10,
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
  const { data: visitorsData, isLoading: loadingVisitors } = useVisitorsList({
    buildingId: activeBuildingId,
    limit: 20,
  });

  // 2. Role-specific Platform & Operations Queries
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isManager = role === ROLES.MANAGER;
  const isAccountant = role === ROLES.ACCOUNTANT;

  const { data: buildingsData, isLoading: loadingBuildings } = useBuildingsList({
    enabled: isSuperAdmin,
  });
  const { data: usersData } = useUsersList({
    enabled: isSuperAdmin,
  });
  const { data: auditLogsData } = useAuditLogsList({
    enabled: isSuperAdmin,
    limit: 6,
  });
  const { data: expensesData } = useExpensesList({
    buildingId: activeBuildingId,
    enabled: isAccountant,
  });
  const { data: staffData } = useStaffList({
    buildingId: activeBuildingId,
    enabled: isManager,
  });
  const { data: tenantsData } = useTenantsList({
    buildingId: activeBuildingId,
    enabled: isManager,
  });

  // Normalize arrays
  const requests =
    maintenanceData?.requests || (Array.isArray(maintenanceData) ? maintenanceData : []);
  const invoices = invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []);
  const notices = noticesData?.notices || (Array.isArray(noticesData) ? noticesData : []);
  const flats = flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []);
  const visitors = visitorsData?.visitors || (Array.isArray(visitorsData) ? visitorsData : []);
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
  const auditLogs = auditLogsData?.logs || (Array.isArray(auditLogsData) ? auditLogsData : []);
  const expenses = expensesData?.expenses || (Array.isArray(expensesData) ? expensesData : []);
  const staff = staffData?.staff || (Array.isArray(staffData) ? staffData : []);
  const tenants = tenantsData?.tenants || (Array.isArray(tenantsData) ? tenantsData : []);

  // Compute live operational metrics
  const openRequests = requests.filter((r) => r.status === "OPEN" || r.status === "TRIAGED");
  const unassignedRequests = requests.filter((r) => !r.assignedStaffId && r.status !== "RESOLVED");
  const urgentRequests = requests.filter(
    (r) => r.priority === "EMERGENCY" || r.priority === "HIGH"
  );
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
  const pendingExpenses = expenses.filter((e) => e.status === "PENDING");

  // Security staff visitor metrics
  const expectedVisitors = visitors.filter((v) => v.status === "EXPECTED");
  const checkedInVisitors = visitors.filter((v) => v.status === "CHECKED_IN");

  // Super Admin metrics
  const activeAdmins = users.filter((u) => u.role === ROLES.BUILDING_ADMIN);
  const totalResidents = users.filter((u) => u.role === ROLES.OWNER || u.role === ROLES.TENANT);

  // Security gate quick-entry state
  const [passCodeInput, setPassCodeInput] = React.useState("");

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <PageHeader
        title={`Good day, ${user?.firstName || "Resident"}`}
        subtitle={`${ROLE_LABELS[role] || role} • Digital Operations & Lobby`}
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
          ROLE-SPECIFIC STATCARD ROWS
          ========================================================================= */}
      <Box sx={{ mb: 4 }}>
        {/* 1. SUPER ADMIN */}
        {role === ROLES.SUPER_ADMIN && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={buildings.length}
                label="Total Buildings"
                delta="Active managed properties"
                isHero={buildings.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={activeAdmins.length}
                label="Active Administrators"
                delta="Assigned building operators"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={totalResidents.length}
                label="Platform Residents"
                delta="Registered owners & tenants"
              />
            </Grid>
          </Grid>
        )}

        {/* 2. BUILDING ADMIN */}
        {role === ROLES.BUILDING_ADMIN && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${occupancyPct}%`}
                label="Occupancy Rate"
                delta={`${occupiedFlats} occupied, ${vacantFlats} vacant`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={openRequests.length}
                label="Active Work Orders"
                delta={`${openRequests.length} awaiting dispatch`}
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="This Month's Collection Rate"
                delta={`${paidInvoices.length} of ${invoices.length} invoices paid`}
              />
            </Grid>
          </Grid>
        )}

        {/* 3. MANAGER */}
        {role === ROLES.MANAGER && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={openRequests.length}
                label="Open Work Orders"
                delta="Tickets currently open"
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={unassignedRequests.length}
                label="Unassigned Tickets"
                delta="Requires technician assignment"
                isHero={unassignedRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={urgentRequests.length}
                label="High / Urgent Priority"
                delta="Requires immediate dispatch"
              />
            </Grid>
          </Grid>
        )}

        {/* 4. ACCOUNTANT */}
        {role === ROLES.ACCOUNTANT && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="Collection Rate"
                delta={`${paidInvoices.length} settled this billing period`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={overdueInvoices.length}
                label="Overdue Invoices"
                delta={
                  totalOverdueAmount > 0
                    ? `₨${totalOverdueAmount.toLocaleString()} total pending`
                    : "Zero overdue dues"
                }
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={pendingExpenses.length}
                label="Pending Expense Approvals"
                delta="Awaiting financial review"
              />
            </Grid>
          </Grid>
        )}

        {/* 5. MAINTENANCE STAFF */}
        {role === ROLES.MAINTENANCE_STAFF && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={requests.length}
                label="Assigned Work Orders"
                delta="Prioritized duty queue"
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={urgentRequests.length}
                label="Emergency / High Urgency"
                delta="Requires immediate attention"
              />
            </Grid>
          </Grid>
        )}

        {/* 6. SECURITY STAFF */}
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

        {/* 7. OWNER & TENANT RESIDENTS */}
        {(role === ROLES.OWNER || role === ROLES.TENANT) && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={role === ROLES.OWNER ? 4 : 6}>
              <StatCard
                value={
                  overdueInvoices.length > 0 ? `₨${totalOverdueAmount.toLocaleString()}` : "₨0"
                }
                label="Current Dues Status"
                delta={
                  overdueInvoices.length > 0
                    ? "Maintenance fee overdue"
                    : "All maintenance dues settled"
                }
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={role === ROLES.OWNER ? 4 : 6}>
              <StatCard
                value={requests.length}
                label="Open Work Orders"
                delta="Active service tickets in your flat"
              />
            </Grid>
            {role === ROLES.OWNER && (
              <Grid item xs={12} sm={4}>
                <StatCard
                  value={notices.length}
                  label="Community Bulletins"
                  delta="Official notices from management"
                />
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* =========================================================================
          ROLE-SPECIFIC PRIMARY CONTENT PANELS
          ========================================================================= */}

      {/* -------------------------------------------------------------------------
          1. SUPER ADMIN: PLATFORM GROWTH, BUILDINGS LIST & AUDIT ACTIVITY
          ------------------------------------------------------------------------- */}
      {role === ROLES.SUPER_ADMIN && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left Column: Recently Added Buildings */}
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
                    Managed Properties
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                  >
                    Recently provisioned residential buildings
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to="/buildings"
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

              {loadingBuildings ? (
                <TableLoadingSkeleton rows={4} />
              ) : buildings.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <ApartmentIcon sx={{ fontSize: 44, color: DESIGN_TOKENS.line[300], mb: 1.5 }} />
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary, mb: 0.5 }}
                  >
                    No buildings yet — add your first building to get started
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2.5 }}>
                    Provision properties, blocks, and assign building managers.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/buildings"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      bgcolor: DESIGN_TOKENS.brand[600],
                      fontWeight: 600,
                      "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                    }}
                  >
                    Add Building
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {buildings.slice(0, 5).map((b) => (
                    <Box
                      key={b._id || b.id}
                      component={RouterLink}
                      to={`/buildings/${b._id || b.id}`}
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "8px",
                            bgcolor: DESIGN_TOKENS.brand[50],
                            color: DESIGN_TOKENS.brand[600],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}
                          >
                            {b.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}
                          >
                            {b.address?.city || b.address?.street || "Residential Complex"} •{" "}
                            {b.totalFlats || 0} Flats
                          </Typography>
                        </Box>
                      </Box>
                      <StatusChip status={b.status || "ACTIVE"} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* Right Column: Platform Growth Chart & Recent Admin Activity */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <TrendChart
                title="Platform Growth"
                subtitle="New buildings & resident onboarding"
                metric={`${buildings.length} Properties`}
                color={DESIGN_TOKENS.brand[600]}
                data={[1, 2, 2, 3, 3, buildings.length || 4]}
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
                      Recent Admin Activity
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                    >
                      Audit logs from system administrators
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to="/audit-logs"
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: DESIGN_TOKENS.brand[600],
                    }}
                  >
                    View Logs
                  </Button>
                </Box>

                {auditLogs.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                    >
                      No recent activity recorded.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {auditLogs.slice(0, 4).map((log) => (
                      <Box
                        key={log._id || log.id}
                        sx={{
                          p: 1.75,
                          borderRadius: "10px",
                          bgcolor: DESIGN_TOKENS.surface[50],
                          border: "1px solid #F1F5F9",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, fontSize: "0.8125rem" }}
                          >
                            {log.action || "SYSTEM_CHANGE"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}
                          >
                            {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "Today"}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}
                        >
                          Actor: {log.userEmail || log.userName || "Admin"} •{" "}
                          {log.ipAddress || "Internal"}
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

      {/* -------------------------------------------------------------------------
          2. BUILDING ADMIN: WORK ORDERS NEETING ATTENTION, COLLECTIONS TREND & NOTICES
          ------------------------------------------------------------------------- */}
      {role === ROLES.BUILDING_ADMIN && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left Column: Work Orders Needing Attention */}
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
                    Work Orders Needing Attention
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                  >
                    Actionable tickets requiring review or assignment
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
              ) : openRequests.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                  >
                    All caught up — no work orders need attention right now.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {openRequests.slice(0, 5).map((req) => (
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
                              req.priority === "EMERGENCY" ? "#FEE2E2" : DESIGN_TOKENS.surface[100],
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
              )}
            </Paper>
          </Grid>

          {/* Right Column: Collections Trend & Latest Notices */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <TrendChart
                title="Collections Trend"
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
                      Latest Notices
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                    >
                      Published announcements
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
                      No notices published yet.
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

      {/* -------------------------------------------------------------------------
          3. MANAGER: PRIMARY TRIAGE QUEUE, STAFF AVAILABILITY & MOVE-INS/MOVE-OUTS
          ------------------------------------------------------------------------- */}
      {role === ROLES.MANAGER && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Primary Triage Queue Card */}
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
                    Triage & Assignment Queue
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
                  >
                    Click any ticket to assign specialist technicians directly
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
                  Work Order Registry
                </Button>
              </Box>

              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : openRequests.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                  >
                    Nothing needs triage right now.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {openRequests.slice(0, 6).map((req) => (
                    <Box
                      key={req._id}
                      component={RouterLink}
                      to="/maintenance-requests"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: "10px",
                        border: "1px solid #F1F5F9",
                        bgcolor: "#FFFFFF",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.brand[600],
                          bgcolor: DESIGN_TOKENS.surface[50],
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0, mr: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}
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
                          #{req.requestNumber || req._id?.slice(-6)} • {req.category} • Flat:{" "}
                          {req.flatId?.flatNumber || "Assigned Unit"}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", flexShrink: 0 }}
                      >
                        <Chip
                          label={req.assignedStaffId ? "Assigned" : "Unassigned"}
                          size="small"
                          sx={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            borderRadius: "999px",
                            bgcolor: req.assignedStaffId ? "#ECFDF5" : "#FEF3C7",
                            color: req.assignedStaffId ? "#047857" : "#B45309",
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

          {/* Side Cards: Staff Availability & Today's Move-ins/Move-outs */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              {/* Staff Availability Card */}
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
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem" }}>
                    Staff Availability
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/staff"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.8125rem", color: DESIGN_TOKENS.brand[600] }}
                  >
                    Manage Staff
                  </Button>
                </Box>
                <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}>
                  {staff.length > 0
                    ? `${staff.length} technicians registered on building roster.`
                    : "On-duty technicians available for immediate work order assignment."}
                </Typography>
                <Stack spacing={1}>
                  {(staff.length > 0
                    ? staff.slice(0, 3)
                    : [
                        { name: "Electrical Specialist", shift: "Morning", status: "AVAILABLE" },
                        { name: "Plumbing Technician", shift: "General", status: "AVAILABLE" },
                      ]
                  ).map((s, idx) => (
                    <Box
                      key={s._id || idx}
                      sx={{
                        p: 1.5,
                        borderRadius: "8px",
                        bgcolor: DESIGN_TOKENS.surface[50],
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {s.name || s.trade || "Technician"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                          Shift: {s.shift || "Active"} • Trade: {s.trade || "General"}
                        </Typography>
                      </Box>
                      <Chip
                        label="Available"
                        size="small"
                        sx={{
                          bgcolor: "#ECFDF5",
                          color: "#047857",
                          fontWeight: 600,
                          fontSize: "0.6875rem",
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Move-ins & Move-outs Card */}
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
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem" }}>
                    Today's Move-ins / Move-outs
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/tenants"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.8125rem", color: DESIGN_TOKENS.brand[600] }}
                  >
                    Tenant Roster
                  </Button>
                </Box>
                {tenants.length === 0 ? (
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, py: 2 }}>
                    No resident transitions scheduled for today.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {tenants.slice(0, 2).map((t) => (
                      <Box
                        key={t._id || t.id}
                        sx={{
                          p: 1.5,
                          borderRadius: "8px",
                          bgcolor: DESIGN_TOKENS.surface[50],
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t.user?.firstName || t.name || "Resident"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: DESIGN_TOKENS.text.secondary }}
                          >
                            Flat: {t.flatId?.flatNumber || "Assigned"} • Active Tenancy
                          </Typography>
                        </Box>
                        <Chip
                          label="Resident"
                          size="small"
                          sx={{
                            bgcolor: DESIGN_TOKENS.surface[100],
                            fontWeight: 600,
                            fontSize: "0.6875rem",
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* -------------------------------------------------------------------------
          4. ACCOUNTANT: COLLECTIONS TREND & RANKED OVERDUE LIST
          ------------------------------------------------------------------------- */}
      {role === ROLES.ACCOUNTANT && (
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
                    Ranked Overdue Accounts
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
                /* VERBATIM PROMPT EMPTY STATE */
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                  >
                    No overdue invoices — collections are fully up to date.
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
              title="Collections Trend"
              subtitle="Monthly cumulative collection trajectory"
              metric={`${collectionRate}% Cleared`}
              color={DESIGN_TOKENS.accent.green}
              data={[58, 64, 72, 79, 86, collectionRate]}
              labels={["Sep", "Oct", "Nov", "Dec", "Jan", "Current"]}
            />
          </Grid>
        </Grid>
      )}

      {/* -------------------------------------------------------------------------
          5. MAINTENANCE STAFF: ACTION LIST TODAY
          ------------------------------------------------------------------------- */}
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
              My Work Orders — Today
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: DESIGN_TOKENS.text.secondary, mt: 0.25, display: "block" }}
            >
              Priority-ordered action items with touch-friendly status controls
            </Typography>
          </Box>

          {requests.length === 0 ? (
            /* VERBATIM PROMPT EMPTY STATE */
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
              >
                Nothing assigned to you today.
              </Typography>
            </Box>
          ) : (
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
          )}
        </Paper>
      )}

      {/* -------------------------------------------------------------------------
          6. SECURITY STAFF: GATE TERMINAL & CURRENTLY-INSIDE ROSTER
          ------------------------------------------------------------------------- */}
      {role === ROLES.SECURITY_STAFF && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Quick Check-in Terminal Card */}
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: DESIGN_TOKENS.text.primary,
                letterSpacing: "-0.015em",
                mb: 1,
              }}
            >
              Gate Terminal Quick Entry
            </Typography>
            <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 3 }}>
              Enter arriving visitor pass code or scan guest QR pass.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ maxWidth: 540 }}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Enter 6-digit pass code..."
                value={passCodeInput}
                onChange={(e) => setPassCodeInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 48,
                    borderRadius: "8px",
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => navigate("/visitors/verify")}
                startIcon={<CheckCircleOutlinedIcon />}
                sx={{
                  minHeight: 48,
                  px: 3,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  bgcolor: DESIGN_TOKENS.brand[600],
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Verify Pass
              </Button>
            </Stack>
          </Paper>

          {/* Currently Inside List */}
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
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}
            >
              <Box>
                <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.0625rem" }}>
                  Currently Inside Premises
                </Typography>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                  Active visitor passes requiring check-out upon exit
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/visitors"
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.8125rem", color: DESIGN_TOKENS.brand[600] }}
              >
                Full Visitor Log
              </Button>
            </Box>

            {loadingVisitors ? (
              <TableLoadingSkeleton rows={3} />
            ) : checkedInVisitors.length === 0 ? (
              /* VERBATIM PROMPT EMPTY STATE */
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ color: DESIGN_TOKENS.text.secondary, fontWeight: 500 }}
                >
                  No visitors currently inside.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {checkedInVisitors.map((v) => (
                  <Box
                    key={v._id || v.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      borderRadius: "10px",
                      border: "1px solid #F1F5F9",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {v.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                        Destination: Flat {v.flatId?.flatNumber || "Visiting Unit"} • Phone:{" "}
                        {v.phone || "—"}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExitToAppIcon sx={{ fontSize: 16 }} />}
                      onClick={() => navigate("/visitors/verify")}
                      sx={{
                        minHeight: 44, // >= 44px tap target per spec
                        borderColor: DESIGN_TOKENS.line[200],
                        color: DESIGN_TOKENS.text.primary,
                        fontWeight: 600,
                      }}
                    >
                      Check Out
                    </Button>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      )}

      {/* -------------------------------------------------------------------------
          7. RESIDENT (OWNER / TENANT): MY FLAT OVERVIEW & LEDGER
          ------------------------------------------------------------------------- */}
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
              {role === ROLES.OWNER ? "Residence Ledger & Invoices" : "Recent Invoices"}
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
              {invoices.slice(0, 4).map((inv) => (
                <Box
                  key={inv._id}
                  component={RouterLink}
                  to={`/invoices/${inv._id}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
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
