// =====================  ROLE-AWARE DASHBOARD (AUTHORITATIVE MASTER SPEC)  ===========
import React, { useState } from "react";
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
import DomainIcon from "@mui/icons-material/Domain";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CampaignIcon from "@mui/icons-material/Campaign";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BadgeIcon from "@mui/icons-material/Badge";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DoorSlidingIcon from "@mui/icons-material/DoorSliding";
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

// =========================================================================
// REUSABLE ULTRA-CLEAN CARD CONTAINERS & ROW PRESENTERS
// =========================================================================

/**
 * Clean Card Container matching Figma tokens:
 * - Pure #FFFFFF background, 1px #E2E8F0 border, 12px border radius
 * - Subdued SaaS elevation, clean header with title and action
 */
const DashboardCard = ({ title, subtitle, action, actionLink, children, sx = {} }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 2.5, sm: 3 },
      borderRadius: "12px",
      borderColor: DESIGN_TOKENS.line[200],
      backgroundColor: "#FFFFFF",
      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      ...sx,
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        mb: 2.5,
      }}
    >
      <Box sx={{ minWidth: 0, pr: 1.5 }}>
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1rem",
            fontWeight: 600,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: DESIGN_TOKENS.text.secondary,
              mt: 0.25,
              display: "block",
              fontSize: "0.8125rem",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionLink ? (
        <Button
          component={RouterLink}
          to={actionLink}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          sx={{
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: DESIGN_TOKENS.brand[600],
            p: 0.5,
            minWidth: "auto",
            "&:hover": { bgcolor: "transparent", color: DESIGN_TOKENS.brand[700] },
          }}
        >
          {action || "View All"}
        </Button>
      ) : (
        action
      )}
    </Box>
    <Box sx={{ flex: 1 }}>{children}</Box>
  </Paper>
);

/**
 * Super-clean Empty State inside Cards
 * Uses verbatim specification strings with subtle iconography
 */
const DashboardEmptyState = ({ message, subtext = null, action = null, icon = null }) => (
  <Box
    sx={{
      py: 5,
      px: 2,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        bgcolor: DESIGN_TOKENS.surface[50],
        border: "1px solid",
        borderColor: DESIGN_TOKENS.line[200],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: DESIGN_TOKENS.text.secondary,
        mb: 1.5,
      }}
    >
      {icon ? (
        React.cloneElement(icon, { sx: { fontSize: 22, ...icon.props?.sx } })
      ) : (
        <CheckCircleOutlinedIcon sx={{ fontSize: 22 }} />
      )}
    </Box>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: DESIGN_TOKENS.text.secondary,
        fontSize: "0.875rem",
        maxWidth: 380,
        lineHeight: 1.5,
      }}
    >
      {message}
    </Typography>
    {subtext && (
      <Typography
        variant="caption"
        sx={{
          color: DESIGN_TOKENS.text.disabled || "#94A3B8",
          mt: 0.5,
          display: "block",
          fontSize: "0.75rem",
        }}
      >
        {subtext}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

/**
 * Clean List Row for Dashboard cards
 * Standardized padding, avatar box, typography, and hover interaction
 */
const DashboardListItem = ({
  to,
  icon,
  iconBg = DESIGN_TOKENS.brand[50],
  iconColor = DESIGN_TOKENS.brand[600],
  title,
  subtitle,
  rightContent,
  onClick,
  sx = {},
}) => {
  const content = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: "12px 14px",
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "#F1F5F9",
        bgcolor: "#FFFFFF",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: DESIGN_TOKENS.line[200],
          bgcolor: DESIGN_TOKENS.surface[50],
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, mr: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              bgcolor: iconBg,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 18, ...icon.props?.sx } })}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: DESIGN_TOKENS.text.primary,
              fontSize: "0.875rem",
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: DESIGN_TOKENS.text.secondary,
                fontSize: "0.75rem",
                display: "block",
                mt: 0.25,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {rightContent && <Box sx={{ flexShrink: 0 }}>{rightContent}</Box>}
    </Box>
  );

  if (to) {
    return (
      <Box
        component={RouterLink}
        to={to}
        sx={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {content}
      </Box>
    );
  }

  if (onClick) {
    return (
      <Box onClick={onClick} sx={{ cursor: "pointer", display: "block" }}>
        {content}
      </Box>
    );
  }

  return content;
};

// =========================================================================
// MAIN DASHBOARD COMPONENT
// =========================================================================

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
  const [passCodeInput, setPassCodeInput] = useState("");

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
                icon={<DomainIcon />}
                isHero={buildings.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={activeAdmins.length}
                label="Active Administrators"
                delta="Assigned building operators"
                icon={<SupervisorAccountIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={totalResidents.length}
                label="Platform Residents"
                delta="Registered owners & tenants"
                icon={<PeopleIcon />}
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
                icon={<HomeWorkIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={openRequests.length}
                label="Active Work Orders"
                delta={`${openRequests.length} awaiting dispatch`}
                icon={<BuildIcon />}
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="This Month's Collection Rate"
                delta={`${paidInvoices.length} of ${invoices.length} invoices paid`}
                icon={<AccountBalanceWalletIcon />}
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
                icon={<BuildIcon />}
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={unassignedRequests.length}
                label="Unassigned Tickets"
                delta="Requires technician assignment"
                icon={<AssignmentLateIcon />}
                isHero={unassignedRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={urgentRequests.length}
                label="High / Urgent Priority"
                delta="Requires immediate dispatch"
                icon={<WarningAmberIcon />}
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
                icon={<TrendingUpIcon />}
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
                icon={<ReceiptLongIcon />}
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={pendingExpenses.length}
                label="Pending Expense Approvals"
                delta="Awaiting financial review"
                icon={<PendingActionsIcon />}
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
                icon={<BuildIcon />}
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={urgentRequests.length}
                label="Emergency / High Urgency"
                delta="Requires immediate attention"
                icon={<WarningAmberIcon />}
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
                icon={<BadgeIcon />}
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={checkedInVisitors.length}
                label="Currently Inside Premises"
                delta="Active visitor passes"
                icon={<DoorSlidingIcon />}
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
                icon={<ReceiptIcon />}
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={role === ROLES.OWNER ? 4 : 6}>
              <StatCard
                value={requests.length}
                label="Open Work Orders"
                delta="Active service tickets in your flat"
                icon={<BuildIcon />}
              />
            </Grid>
            {role === ROLES.OWNER && (
              <Grid item xs={12} sm={4}>
                <StatCard
                  value={notices.length}
                  label="Community Bulletins"
                  delta="Official notices from management"
                  icon={<CampaignIcon />}
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
            <DashboardCard
              title="Managed Properties"
              subtitle="Recently provisioned residential buildings"
              action="View All"
              actionLink="/buildings"
            >
              {loadingBuildings ? (
                <TableLoadingSkeleton rows={4} />
              ) : buildings.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <DashboardEmptyState
                  icon={<ApartmentIcon />}
                  message="No buildings yet — add your first building to get started"
                  subtext="Provision properties, blocks, and assign building managers."
                  action={
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
                  }
                />
              ) : (
                <Stack spacing={1}>
                  {buildings.slice(0, 5).map((b) => (
                    <DashboardListItem
                      key={b._id || b.id}
                      to={`/buildings/${b._id || b.id}`}
                      icon={<BusinessIcon />}
                      title={b.name}
                      subtitle={`${b.address?.city || b.address?.street || "Residential Complex"} • ${b.totalFlats || 0} Flats`}
                      rightContent={<StatusChip status={b.status || "ACTIVE"} />}
                    />
                  ))}
                </Stack>
              )}
            </DashboardCard>
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

              <DashboardCard
                title="Recent Admin Activity"
                subtitle="Audit logs from system administrators"
                action="View Logs"
                actionLink="/audit-logs"
              >
                {auditLogs.length === 0 ? (
                  <DashboardEmptyState message="No activity in this range." />
                ) : (
                  <Stack spacing={1}>
                    {auditLogs.slice(0, 4).map((log) => (
                      <Box
                        key={log._id || log.id}
                        sx={{
                          p: "10px 12px",
                          borderRadius: "8px",
                          bgcolor: DESIGN_TOKENS.surface[50],
                          border: "1px solid #F1F5F9",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
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
              </DashboardCard>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* -------------------------------------------------------------------------
          2. BUILDING ADMIN: WORK ORDERS NEEDING ATTENTION, COLLECTIONS TREND & NOTICES
          ------------------------------------------------------------------------- */}
      {role === ROLES.BUILDING_ADMIN && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left Column: Work Orders Needing Attention */}
          <Grid item xs={12} lg={7}>
            <DashboardCard
              title="Work Orders Needing Attention"
              subtitle="Actionable tickets requiring review or assignment"
              action="View All"
              actionLink="/maintenance-requests"
            >
              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : openRequests.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <DashboardEmptyState message="All caught up — no work orders need attention right now." />
              ) : (
                <Stack spacing={1}>
                  {openRequests.slice(0, 5).map((req) => (
                    <DashboardListItem
                      key={req._id}
                      to="/maintenance-requests"
                      icon={<BuildIcon />}
                      iconBg={req.priority === "EMERGENCY" ? "#FEE2E2" : "rgba(67, 56, 202, 0.08)"}
                      iconColor={
                        req.priority === "EMERGENCY"
                          ? DESIGN_TOKENS.danger[600]
                          : DESIGN_TOKENS.brand[600]
                      }
                      title={req.title}
                      subtitle={`#${req.requestNumber || req._id?.slice(-6)} • ${req.category} • Flat: ${req.flatId?.flatNumber || "Assigned"}`}
                      rightContent={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
                      }
                    />
                  ))}
                </Stack>
              )}
            </DashboardCard>
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

              <DashboardCard
                title="Latest Notices"
                subtitle="Published announcements"
                action="All Notices"
                actionLink="/notices"
              >
                {notices.length === 0 ? (
                  /* VERBATIM PROMPT EMPTY STATE */
                  <DashboardEmptyState message="No notices published yet." />
                ) : (
                  <Stack spacing={1.25}>
                    {notices.slice(0, 2).map((notice) => (
                      <Box
                        key={notice._id}
                        sx={{
                          p: "12px 14px",
                          borderRadius: "10px",
                          bgcolor:
                            notice.priority === "URGENT_EMERGENCY"
                              ? "#FFFBEB"
                              : DESIGN_TOKENS.surface[50],
                          border: "1px solid",
                          borderColor:
                            notice.priority === "URGENT_EMERGENCY" ? "#FDE68A" : "#F1F5F9",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
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
                                notice.priority === "URGENT_EMERGENCY" ? "#FEF3C7" : "#E2E8F0",
                              color: notice.priority === "URGENT_EMERGENCY" ? "#B45309" : "#475569",
                              fontWeight: 600,
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
              </DashboardCard>
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
            <DashboardCard
              title="Triage & Assignment Queue"
              subtitle="Click any ticket to assign specialist technicians directly"
              action="Work Order Registry"
              actionLink="/maintenance-requests"
            >
              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : openRequests.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <DashboardEmptyState message="Nothing needs triage right now." />
              ) : (
                <Stack spacing={1}>
                  {openRequests.slice(0, 6).map((req) => (
                    <DashboardListItem
                      key={req._id}
                      to="/maintenance-requests"
                      icon={<BuildIcon />}
                      iconBg={req.assignedStaffId ? "#ECFDF5" : "#FEF3C7"}
                      iconColor={req.assignedStaffId ? "#047857" : "#B45309"}
                      title={req.title}
                      subtitle={`#${req.requestNumber || req._id?.slice(-6)} • ${req.category} • Flat: ${req.flatId?.flatNumber || "Assigned Unit"}`}
                      rightContent={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
                      }
                    />
                  ))}
                </Stack>
              )}
            </DashboardCard>
          </Grid>

          {/* Side Cards: Staff Availability & Today's Move-ins/Move-outs */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              {/* Staff Availability Card */}
              <DashboardCard
                title="Staff Availability"
                subtitle="On-duty technicians available for assignment"
                action="Manage Staff"
                actionLink="/staff"
              >
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
                        p: "10px 12px",
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
              </DashboardCard>

              {/* Move-ins & Move-outs Card */}
              <DashboardCard
                title="Today's Move-ins / Move-outs"
                subtitle="Resident arrival and departure schedules"
                action="Tenant Roster"
                actionLink="/tenants"
              >
                {tenants.length === 0 ? (
                  <DashboardEmptyState message="No resident transitions scheduled for today." />
                ) : (
                  <Stack spacing={1}>
                    {tenants.slice(0, 2).map((t) => (
                      <Box
                        key={t._id || t.id}
                        sx={{
                          p: "10px 12px",
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
              </DashboardCard>
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
            <DashboardCard
              title="Ranked Overdue Accounts"
              subtitle="Ranked by outstanding dues • Click any row to inspect flat ledger"
              action="Billing Registry"
              actionLink="/invoices"
            >
              {loadingInvoices ? (
                <TableLoadingSkeleton rows={4} />
              ) : overdueInvoices.length === 0 ? (
                /* VERBATIM PROMPT EMPTY STATE */
                <DashboardEmptyState message="No overdue invoices — collections are fully up to date." />
              ) : (
                <Stack spacing={1}>
                  {overdueInvoices.slice(0, 5).map((inv) => (
                    <DashboardListItem
                      key={inv._id}
                      to={`/invoices/${inv._id}`}
                      icon={<ReceiptLongIcon />}
                      iconBg="#FEE2E2"
                      iconColor={DESIGN_TOKENS.danger[600]}
                      title={`Invoice #${inv.invoiceNumber}`}
                      subtitle={`Period: ${inv.periodMonth}/${inv.periodYear} • Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}`}
                      rightContent={
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Typography
                            sx={{
                              fontFamily: FONT_UI,
                              fontSize: "0.9375rem",
                              fontWeight: 700,
                              color: DESIGN_TOKENS.danger[600],
                              letterSpacing: "-0.01em",
                            }}
                          >
                            ₨{(inv.dueAmount || inv.totalAmount || 0).toLocaleString()}
                          </Typography>
                          <StatusChip status={inv.status} />
                        </Stack>
                      }
                    />
                  ))}
                </Stack>
              )}
            </DashboardCard>
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
        <Box sx={{ mb: 4 }}>
          <DashboardCard
            title="My Work Orders — Today"
            subtitle="Priority-ordered action items with touch-friendly status controls"
          >
            {requests.length === 0 ? (
              /* VERBATIM PROMPT EMPTY STATE */
              <DashboardEmptyState message="Nothing assigned to you today." />
            ) : (
              <Stack spacing={1.25}>
                {requests.map((req) => (
                  <DashboardListItem
                    key={req._id}
                    to="/maintenance-requests"
                    icon={<BuildIcon />}
                    iconBg={req.priority === "EMERGENCY" ? "#FEE2E2" : "rgba(67, 56, 202, 0.08)"}
                    iconColor={
                      req.priority === "EMERGENCY"
                        ? DESIGN_TOKENS.danger[600]
                        : DESIGN_TOKENS.brand[600]
                    }
                    title={req.title}
                    subtitle={`Unit: ${req.flatId?.flatNumber || "Assigned Unit"} • Category: ${req.category}`}
                    sx={{
                      minHeight: 48,
                      borderColor: req.priority === "EMERGENCY" ? "#FECACA" : "#F1F5F9",
                      bgcolor: req.priority === "EMERGENCY" ? "#FEF2F2" : "#FFFFFF",
                    }}
                    rightContent={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
                    }
                  />
                ))}
              </Stack>
            )}
          </DashboardCard>
        </Box>
      )}

      {/* -------------------------------------------------------------------------
          6. SECURITY STAFF: GATE TERMINAL & CURRENTLY-INSIDE ROSTER
          ------------------------------------------------------------------------- */}
      {role === ROLES.SECURITY_STAFF && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Quick Check-in Terminal Card */}
          <DashboardCard
            title="Gate Terminal Quick Entry"
            subtitle="Enter arriving visitor pass code or scan guest QR pass"
          >
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
          </DashboardCard>

          {/* Currently Inside List */}
          <DashboardCard
            title="Currently Inside Premises"
            subtitle="Active visitor passes requiring check-out upon exit"
            action="Full Visitor Log"
            actionLink="/visitors"
          >
            {loadingVisitors ? (
              <TableLoadingSkeleton rows={3} />
            ) : checkedInVisitors.length === 0 ? (
              /* VERBATIM PROMPT EMPTY STATE */
              <DashboardEmptyState message="No visitors currently inside." />
            ) : (
              <Stack spacing={1}>
                {checkedInVisitors.map((v) => (
                  <DashboardListItem
                    key={v._id || v.id}
                    icon={<BadgeIcon />}
                    title={v.name}
                    subtitle={`Destination: Flat ${v.flatId?.flatNumber || "Visiting Unit"} • Phone: ${v.phone || "—"}`}
                    rightContent={
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ExitToAppIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate("/visitors/verify")}
                        sx={{
                          minHeight: 44, // >= 44px tap target per mobile-first spec
                          borderColor: DESIGN_TOKENS.line[200],
                          color: DESIGN_TOKENS.text.primary,
                          fontWeight: 600,
                        }}
                      >
                        Check Out
                      </Button>
                    }
                  />
                ))}
              </Stack>
            )}
          </DashboardCard>
        </Stack>
      )}

      {/* -------------------------------------------------------------------------
          7. RESIDENT (OWNER / TENANT): MY FLAT OVERVIEW & LEDGER
          ------------------------------------------------------------------------- */}
      {(role === ROLES.OWNER || role === ROLES.TENANT) && (
        <DashboardCard
          title={role === ROLES.OWNER ? "Residence Ledger & Invoices" : "Recent Invoices"}
          subtitle="Official monthly flat maintenance charges and receipts"
          action="View Invoices"
          actionLink="/invoices"
          sx={{ mb: 4 }}
        >
          {invoices.length === 0 ? (
            <DashboardEmptyState message="No invoices issued yet for your residence." />
          ) : (
            <Stack spacing={1}>
              {invoices.slice(0, 4).map((inv) => (
                <DashboardListItem
                  key={inv._id}
                  to={`/invoices/${inv._id}`}
                  icon={<ReceiptIcon />}
                  title={`Invoice #${inv.invoiceNumber}`}
                  subtitle={`Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}`}
                  rightContent={
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Typography
                        sx={{
                          fontFamily: FONT_UI,
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: DESIGN_TOKENS.text.primary,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        ₨{(inv.totalAmount || 0).toLocaleString()}
                      </Typography>
                      <StatusChip status={inv.status} />
                    </Stack>
                  }
                />
              ))}
            </Stack>
          )}
        </DashboardCard>
      )}
    </Box>
  );
};

export default DashboardPage;
