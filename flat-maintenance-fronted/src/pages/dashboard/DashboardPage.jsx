// =====================  ROLE-AWARE DASHBOARD (AUTHORITATIVE MASTER SPEC)  ===========
import React, { useState, useMemo } from "react";
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
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
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
import { Link as RouterLink, useNavigate, useOutletContext } from "react-router-dom";
import { SuperAdminDashboardView } from "./components/SuperAdminDashboardView.jsx";
import { useAuth } from "../../providers/auth-context.js";
import { ROLES } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { useMaintenanceRequestsList } from "../../features/maintenance-requests/hooks/use-maintenance-requests.js";
import { useInvoicesList } from "../../features/invoices/hooks/use-invoices.js";
import { usePaymentsList } from "../../features/payments/hooks/use-payments.js";
import { useComplaintsList } from "../../features/complaints/hooks/use-complaints.js";
import { useNoticesList } from "../../features/notices/hooks/use-notices.js";
import { useFlatsList } from "../../features/flats/hooks/use-flats.js";
import { useVisitorsList } from "../../features/visitors/hooks/use-visitors.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { useUsersList } from "../../features/users/hooks/use-users.js";
import { useAuditLogsList } from "../../features/audit-logs/hooks/use-audit-logs.js";
import { useExpensesList } from "../../features/expenses/hooks/use-expenses.js";
import { useStaffList } from "../../features/staff/hooks/use-staff.js";
import { TrendChart } from "../../components/common/TrendChart.jsx";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

// =========================================================================
// REUSABLE CARD CONTAINERS & ROW PRESENTERS
// =========================================================================

const DashboardCard = ({ title, subtitle, action, actionLink, children, sx = {} }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 3,
      borderRadius: "14px",
      borderColor: DESIGN_TOKENS.line[200],
      backgroundColor: "#FFFFFF",
      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        boxShadow: "0 6px 18px -4px rgba(15, 23, 42, 0.06)",
        borderColor: DESIGN_TOKENS.line[300],
      },
      ...sx,
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        mb: 2.25,
      }}
    >
      <Box sx={{ minWidth: 0, pr: 1.5 }}>
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "1.125rem",
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
            variant="body2"
            sx={{
              color: DESIGN_TOKENS.text.secondary,
              mt: 0.25,
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 400,
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

const DashboardEmptyState = ({ message, subtext = null, action = null, icon = null }) => (
  <Box
    sx={{
      py: 4,
      px: 3,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: DESIGN_TOKENS.surface[50],
      borderRadius: "12px",
      border: `1px dashed ${DESIGN_TOKENS.line[200]}`,
      my: 0.5,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "12px",
        bgcolor: "#FFFFFF",
        border: `1px solid ${DESIGN_TOKENS.line[200]}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: DESIGN_TOKENS.brand[600],
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
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
        fontWeight: 600,
        color: DESIGN_TOKENS.text.primary,
        fontSize: "0.9375rem",
        maxWidth: 380,
        lineHeight: 1.4,
        mb: subtext ? 0.5 : 0,
      }}
    >
      {message}
    </Typography>
    {subtext && (
      <Typography
        variant="caption"
        sx={{
          color: DESIGN_TOKENS.text.secondary,
          maxWidth: 360,
          display: "block",
          fontSize: "0.8125rem",
          lineHeight: 1.45,
        }}
      >
        {subtext}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
  </Box>
);

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
          borderColor: DESIGN_TOKENS.brand[300],
          bgcolor: "rgba(67, 56, 202, 0.03)",
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

  // Interactive Perspective Switcher State
  const [selectedRoleView, setSelectedRoleView] = useState(null);
  const effectiveRole = selectedRoleView || role;

  // 1. Live Domain Queries (Full Datasets for Dashboard Computation)
  const { data: buildingsData, isLoading: loadingBuildings } = useBuildingsList({ limit: 100 });
  const { data: flatsData } = useFlatsList({
    buildingId: activeBuildingId || undefined,
    limit: 100,
  });
  const { data: usersData, isLoading: loadingUsers } = useUsersList({ limit: 100 });
  const { data: maintenanceData, isLoading: loadingMaintenance } = useMaintenanceRequestsList({
    buildingId: activeBuildingId || undefined,
    limit: 100,
  });
  const { data: complaintsData } = useComplaintsList({
    buildingId: activeBuildingId || undefined,
    limit: 100,
  });
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoicesList({
    buildingId: activeBuildingId || undefined,
    limit: 100,
  });
  const { data: paymentsData } = usePaymentsList({ limit: 100 });
  const { data: noticesData } = useNoticesList({
    buildingId: activeBuildingId || undefined,
    limit: 10,
  });
  const { data: visitorsData, isLoading: loadingVisitors } = useVisitorsList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: auditLogsData } = useAuditLogsList({ limit: 10 });
  const { data: expensesData } = useExpensesList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: staffData } = useStaffList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });
  const { data: tenantsData } = useTenantsList({
    buildingId: activeBuildingId || undefined,
    limit: 50,
  });

  // Normalize Arrays
  const buildings = useMemo(
    () => buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []),
    [buildingsData]
  );
  const flats = useMemo(
    () => flatsData?.flats || (Array.isArray(flatsData) ? flatsData : []),
    [flatsData]
  );
  const users = useMemo(
    () => usersData?.users || (Array.isArray(usersData) ? usersData : []),
    [usersData]
  );
  const requests = useMemo(
    () => maintenanceData?.requests || (Array.isArray(maintenanceData) ? maintenanceData : []),
    [maintenanceData]
  );
  const complaints = useMemo(
    () => complaintsData?.complaints || (Array.isArray(complaintsData) ? complaintsData : []),
    [complaintsData]
  );
  const invoices = useMemo(
    () => invoicesData?.invoices || (Array.isArray(invoicesData) ? invoicesData : []),
    [invoicesData]
  );
  const payments = useMemo(
    () => paymentsData?.payments || (Array.isArray(paymentsData) ? paymentsData : []),
    [paymentsData]
  );
  const notices = useMemo(
    () => noticesData?.notices || (Array.isArray(noticesData) ? noticesData : []),
    [noticesData]
  );
  const visitors = useMemo(
    () => visitorsData?.visitors || (Array.isArray(visitorsData) ? visitorsData : []),
    [visitorsData]
  );
  const auditLogs = useMemo(
    () =>
      auditLogsData?.auditLogs ||
      auditLogsData?.logs ||
      (Array.isArray(auditLogsData) ? auditLogsData : []),
    [auditLogsData]
  );
  const expenses = useMemo(
    () => expensesData?.expenses || (Array.isArray(expensesData) ? expensesData : []),
    [expensesData]
  );
  const staff = useMemo(
    () => staffData?.staff || (Array.isArray(staffData) ? staffData : []),
    [staffData]
  );

  // Compute Live Operational Metrics (100% Real Backend Data)
  const openRequests = useMemo(
    () => requests.filter((r) => r.status === "OPEN" || r.status === "TRIAGED"),
    [requests]
  );
  const unassignedRequests = useMemo(
    () => requests.filter((r) => !r.assignedStaffId && r.status !== "RESOLVED"),
    [requests]
  );
  const urgentRequests = useMemo(
    () => requests.filter((r) => r.priority === "EMERGENCY" || r.priority === "HIGH"),
    [requests]
  );

  const occupiedFlats = useMemo(() => flats.filter((f) => f.status === "OCCUPIED").length, [flats]);
  const vacantFlats = useMemo(() => flats.filter((f) => f.status === "VACANT").length, [flats]);
  const totalFlats = flats.length || 1;
  const occupancyPct = Math.round((occupiedFlats / totalFlats) * 100);

  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === "OVERDUE"),
    [invoices]
  );
  const totalOverdueAmount = useMemo(
    () =>
      overdueInvoices.reduce(
        (acc, curr) => acc + (Number(curr.dueAmount) || Number(curr.totalAmount) || 0),
        0
      ),
    [overdueInvoices]
  );
  const paidInvoices = useMemo(() => invoices.filter((i) => i.status === "PAID"), [invoices]);
  const collectionRate = useMemo(
    () => (invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0),
    [invoices, paidInvoices]
  );

  const pendingExpenses = useMemo(
    () =>
      expenses.filter((e) => e.status === "PENDING" || e.status === "PENDING_APPROVAL"),
    [expenses]
  );

  // Security staff visitor metrics
  const expectedVisitors = useMemo(
    () => visitors.filter((v) => v.status === "EXPECTED"),
    [visitors]
  );
  const checkedInVisitors = useMemo(
    () => visitors.filter((v) => v.status === "CHECKED_IN"),
    [visitors]
  );

  // Security gate quick-entry state
  const [passCodeInput, setPassCodeInput] = useState("");

  // Real Dynamic Collections Trend Calculation
  const collectionsTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      months.push({ key, label, totalBilled: 0, totalPaid: 0 });
    }

    invoices.forEach((inv) => {
      const p = inv.billingPeriod || (inv.createdAt ? String(inv.createdAt).slice(0, 7) : "");
      const target = months.find((m) => m.key === p);
      if (target) {
        target.totalBilled += Number(inv.totalAmount) || 0;
        target.totalPaid +=
          Number(inv.paidAmount) || (inv.status === "PAID" ? Number(inv.totalAmount) || 0 : 0);
      }
    });

    return {
      labels: months.map((m) => m.label),
      rates: months.map((m) =>
        m.totalBilled > 0 ? Math.round((m.totalPaid / m.totalBilled) * 100) : 0
      ),
    };
  }, [invoices]);

  const roleSubtitles = {
    [ROLES.SUPER_ADMIN]:
      "Manage residential complexes, administrative accounts, and platform operations.",
    [ROLES.BUILDING_ADMIN]:
      "Monitor flat occupancies, active service work orders, and billing collections.",
    [ROLES.MANAGER]:
      "Triage incoming maintenance requests, assign technicians, and track resident arrivals.",
    [ROLES.ACCOUNTANT]:
      "Track monthly maintenance fee collections, overdue invoices, and operational expenses.",
    [ROLES.MAINTENANCE_STAFF]:
      "View and resolve your assigned work orders and emergency repair requests.",
    [ROLES.SECURITY_STAFF]:
      "Verify visitor passes, manage gate entries, and monitor visitors inside the premises.",
    [ROLES.OWNER]: "View your flat maintenance dues, service work orders, and community notices.",
    [ROLES.TENANT]: "View your flat maintenance dues, service work orders, and community notices.",
  };

  const outletContext = useOutletContext();

  // 1. SUPER ADMIN EXECUTIVE CONSOLE VIEW (WITH 100% REAL DATA PROPS)
  if (effectiveRole === ROLES.SUPER_ADMIN) {
    return (
      <SuperAdminDashboardView
        buildings={buildings}
        flats={flats}
        users={users}
        invoices={invoices}
        payments={payments}
        requests={requests}
        complaints={complaints}
        auditLogs={auditLogs}
        isLoading={loadingBuildings || loadingUsers || loadingInvoices}
        selectedRoleView={selectedRoleView}
        onSelectRoleView={setSelectedRoleView}
        onMenuClick={outletContext?.onMenuClick}
      />
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Perspective Switcher for Admins (Big Companies Multi-Perspective Suite) */}
      {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.BUILDING_ADMIN) && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 2.5,
            borderRadius: "12px",
            borderColor: DESIGN_TOKENS.line[200],
            bgcolor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: DESIGN_TOKENS.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              px: 1,
            }}
          >
            Dashboard Perspective:
          </Typography>
          {[
            { id: ROLES.SUPER_ADMIN, label: "Super Admin (SaaS Console)" },
            { id: ROLES.BUILDING_ADMIN, label: "Building Operations" },
            { id: ROLES.MANAGER, label: "Work Order Dispatch" },
            { id: ROLES.ACCOUNTANT, label: "Financial Ledger" },
            { id: ROLES.SECURITY_STAFF, label: "Security Gate" },
            { id: ROLES.TENANT, label: "Resident Portal" },
          ].map((roleItem) => {
            const isSelected = effectiveRole === roleItem.id;
            return (
              <Button
                key={roleItem.id}
                size="small"
                onClick={() => setSelectedRoleView(roleItem.id)}
                variant={isSelected ? "contained" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.8125rem",
                  borderRadius: "8px",
                  py: 0.5,
                  px: 1.5,
                  bgcolor: isSelected ? DESIGN_TOKENS.brand[600] : "transparent",
                  color: isSelected ? "#FFFFFF" : DESIGN_TOKENS.text.secondary,
                  "&:hover": {
                    bgcolor: isSelected ? DESIGN_TOKENS.brand[700] : DESIGN_TOKENS.surface[100],
                  },
                }}
              >
                {roleItem.label}
              </Button>
            );
          })}
        </Paper>
      )}

      {/* Header */}
      <PageHeader
        title={`Good day, ${user?.firstName || "Resident"}`}
        subtitle={roleSubtitles[effectiveRole] || "Welcome to your operations overview."}
        action={
          (effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
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
        {/* 1. BUILDING ADMIN */}
        {effectiveRole === ROLES.BUILDING_ADMIN && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${occupancyPct}%`}
                label="Occupancy Rate"
                delta={`${occupiedFlats} occupied, ${vacantFlats} vacant`}
                icon={<HomeWorkIcon />}
                iconBg="#ECFDF5"
                iconColor="#059669"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={openRequests.length}
                label="Active Work Orders"
                delta={`${openRequests.length} awaiting dispatch`}
                icon={<BuildIcon />}
                iconBg={openRequests.length > 0 ? "#FEF3C7" : "#F1F5F9"}
                iconColor={openRequests.length > 0 ? "#B45309" : "#64748B"}
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="This Month's Collection Rate"
                delta={`${paidInvoices.length} of ${invoices.length} invoices settled`}
                icon={<AccountBalanceWalletIcon />}
                iconBg="#EEF2FF"
                iconColor={DESIGN_TOKENS.brand[600]}
              />
            </Grid>
          </Grid>
        )}

        {/* 2. MANAGER */}
        {effectiveRole === ROLES.MANAGER && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={openRequests.length}
                label="Open Work Orders"
                delta="Tickets currently open"
                icon={<BuildIcon />}
                iconBg="#FEF3C7"
                iconColor="#B45309"
                isHero={openRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={unassignedRequests.length}
                label="Unassigned Tickets"
                delta="Requires technician assignment"
                icon={<AssignmentLateIcon />}
                iconBg={unassignedRequests.length > 0 ? "#FEE2E2" : "#ECFDF5"}
                iconColor={unassignedRequests.length > 0 ? "#DC2626" : "#059669"}
                isHero={unassignedRequests.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={urgentRequests.length}
                label="High / Urgent Priority"
                delta="Requires immediate dispatch"
                icon={<WarningAmberIcon />}
                iconBg={urgentRequests.length > 0 ? "#FEE2E2" : "#F1F5F9"}
                iconColor={urgentRequests.length > 0 ? "#DC2626" : "#64748B"}
              />
            </Grid>
          </Grid>
        )}

        {/* 3. ACCOUNTANT */}
        {effectiveRole === ROLES.ACCOUNTANT && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={`${collectionRate}%`}
                label="Collection Rate"
                delta={`${paidInvoices.length} settled this billing period`}
                icon={<TrendingUpIcon />}
                iconBg="#ECFDF5"
                iconColor="#059669"
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
                iconBg={overdueInvoices.length > 0 ? "#FEE2E2" : "#ECFDF5"}
                iconColor={overdueInvoices.length > 0 ? "#DC2626" : "#059669"}
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                value={pendingExpenses.length}
                label="Pending Expense Approvals"
                delta="Awaiting financial review"
                icon={<PendingActionsIcon />}
                iconBg="#FEF3C7"
                iconColor="#B45309"
              />
            </Grid>
          </Grid>
        )}

        {/* 4. MAINTENANCE STAFF */}
        {effectiveRole === ROLES.MAINTENANCE_STAFF && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={requests.length}
                label="Assigned Work Orders"
                delta="Prioritized duty queue"
                icon={<BuildIcon />}
                iconBg="#EEF2FF"
                iconColor={DESIGN_TOKENS.brand[600]}
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={urgentRequests.length}
                label="Emergency / High Urgency"
                delta="Requires immediate attention"
                icon={<WarningAmberIcon />}
                iconBg={urgentRequests.length > 0 ? "#FEE2E2" : "#ECFDF5"}
                iconColor={urgentRequests.length > 0 ? "#DC2626" : "#059669"}
              />
            </Grid>
          </Grid>
        )}

        {/* 5. SECURITY STAFF */}
        {effectiveRole === ROLES.SECURITY_STAFF && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={expectedVisitors.length}
                label="Expected Arrivals Today"
                delta="Pre-approved resident passes"
                icon={<BadgeIcon />}
                iconBg="#EEF2FF"
                iconColor={DESIGN_TOKENS.brand[600]}
                isHero={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                value={checkedInVisitors.length}
                label="Currently Inside Premises"
                delta="Active visitor passes"
                icon={<DoorSlidingIcon />}
                iconBg="#ECFDF5"
                iconColor="#059669"
              />
            </Grid>
          </Grid>
        )}

        {/* 6. OWNER & TENANT RESIDENTS */}
        {(effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={effectiveRole === ROLES.OWNER ? 4 : 6}>
              <StatCard
                value={
                  overdueInvoices.length > 0
                    ? `₨${totalOverdueAmount.toLocaleString()}`
                    : "₨0"
                }
                label="Current Dues Status"
                delta={
                  overdueInvoices.length > 0
                    ? "Maintenance fee overdue"
                    : "All maintenance dues settled"
                }
                icon={<ReceiptIcon />}
                iconBg={overdueInvoices.length > 0 ? "#FEE2E2" : "#ECFDF5"}
                iconColor={overdueInvoices.length > 0 ? "#DC2626" : "#059669"}
                isHero={overdueInvoices.length > 0}
              />
            </Grid>
            <Grid item xs={12} sm={effectiveRole === ROLES.OWNER ? 4 : 6}>
              <StatCard
                value={requests.length}
                label="Open Work Orders"
                delta="Active service tickets in your flat"
                icon={<BuildIcon />}
                iconBg="#EEF2FF"
                iconColor={DESIGN_TOKENS.brand[600]}
              />
            </Grid>
            {effectiveRole === ROLES.OWNER && (
              <Grid item xs={12} sm={4}>
                <StatCard
                  value={notices.length}
                  label="Community Bulletins"
                  delta="Official notices from management"
                  icon={<CampaignIcon />}
                  iconBg="#FEF3C7"
                  iconColor="#B45309"
                />
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* =========================================================================
          ROLE-SPECIFIC PRIMARY CONTENT PANELS
          ========================================================================= */}

      {/* 1. BUILDING ADMIN: WORK ORDERS NEEDING ATTENTION & COLLECTIONS TREND */}
      {effectiveRole === ROLES.BUILDING_ADMIN && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Work Orders Needing Attention */}
          <Grid item xs={12} md={7}>
            <DashboardCard
              title="Work Orders Needing Attention"
              subtitle="Requests waiting to be reviewed or assigned"
              action="View All"
              actionLink="/maintenance-requests"
            >
              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : openRequests.length === 0 ? (
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
                      subtitle={`#${req.requestNumber || req._id?.slice(-6)}, ${req.category}, Flat ${req.flatId?.flatNumber || "Assigned"}`}
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

          {/* Right Column: Collections Trend (100% Real Invoices Data) */}
          <Grid item xs={12} md={5}>
            <TrendChart
              title="Collections Trend"
              subtitle="Percentage of billed fees collected across recent periods"
              metric={`${collectionRate}% Paid`}
              color={DESIGN_TOKENS.brand[600]}
              data={collectionsTrend.rates}
              labels={collectionsTrend.labels}
              emptyMessage="No payments recorded yet this period"
            />
          </Grid>

          {/* Latest Notices */}
          <Grid item xs={12}>
            <DashboardCard
              title="Latest Notices"
              subtitle="Published community announcements"
              action="All Notices"
              actionLink="/notices"
            >
              {notices.length === 0 ? (
                <DashboardEmptyState message="No notices published yet." />
              ) : (
                <Grid container spacing={2}>
                  {notices.slice(0, 4).map((notice) => (
                    <Grid item xs={12} sm={6} key={notice._id}>
                      <Box
                        sx={{
                          p: "14px 16px",
                          borderRadius: "10px",
                          bgcolor:
                            notice.priority === "URGENT_EMERGENCY"
                              ? "#FFFBEB"
                              : DESIGN_TOKENS.surface[50],
                          border: "1px solid",
                          borderColor:
                            notice.priority === "URGENT_EMERGENCY" ? "#FDE68A" : "#F1F5F9",
                          height: "100%",
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
                    </Grid>
                  ))}
                </Grid>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      )}

      {/* 2. MANAGER: PRIMARY TRIAGE QUEUE & WORK ORDERS */}
      {effectiveRole === ROLES.MANAGER && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={7}>
            <DashboardCard
              title="Triage & Assignment Queue"
              subtitle="Select any ticket to assign a technician"
              action="Work Order Registry"
              actionLink="/maintenance-requests"
            >
              {loadingMaintenance ? (
                <TableLoadingSkeleton rows={4} />
              ) : openRequests.length === 0 ? (
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
                      subtitle={`#${req.requestNumber || req._id?.slice(-6)}, ${req.category}, Flat ${req.flatId?.flatNumber || "Assigned Unit"}`}
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

          <Grid item xs={12} md={5}>
            <DashboardCard
              title="Assigned Technical Staff"
              subtitle="Operational staff roster"
              action="Manage Staff"
              actionLink="/staff"
            >
              {staff.length === 0 ? (
                <DashboardEmptyState message="No staff accounts registered yet." />
              ) : (
                <Stack spacing={1}>
                  {staff.slice(0, 5).map((s) => (
                    <DashboardListItem
                      key={s._id || s.id}
                      icon={<SupervisorAccountIcon />}
                      title={`${s.userId?.firstName || ""} ${s.userId?.lastName || s.name || "Technician"}`}
                      subtitle={`Specialty: ${s.department || s.role || "General Maintenance"}`}
                      rightContent={
                        <Chip
                          label={s.status || "ACTIVE"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            bgcolor: "#DCFCE7",
                            color: "#15803D",
                          }}
                        />
                      }
                    />
                  ))}
                </Stack>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      )}

      {/* 3. ACCOUNTANT: COLLECTIONS & OVERDUE LIST */}
      {effectiveRole === ROLES.ACCOUNTANT && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={7}>
            <DashboardCard
              title="Ranked Overdue Accounts"
              subtitle="Flats with unpaid dues. Select any row to view billing details"
              action="Billing Registry"
              actionLink="/invoices"
            >
              {loadingInvoices ? (
                <TableLoadingSkeleton rows={4} />
              ) : overdueInvoices.length === 0 ? (
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
                      subtitle={`Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}`}
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
                            ₨{(Number(inv.dueAmount) || Number(inv.totalAmount) || 0).toLocaleString()}
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
              subtitle="Percentage of billed fees collected across recent periods"
              metric={`${collectionRate}% Cleared`}
              color={DESIGN_TOKENS.accent.green}
              data={collectionsTrend.rates}
              labels={collectionsTrend.labels}
              emptyMessage="No payments recorded yet this period"
            />
          </Grid>
        </Grid>
      )}

      {/* 4. MAINTENANCE STAFF: ACTION LIST TODAY */}
      {effectiveRole === ROLES.MAINTENANCE_STAFF && (
        <Box sx={{ mb: 4 }}>
          <DashboardCard
            title="My Work Orders — Today"
            subtitle="Your assigned maintenance tasks for today"
          >
            {requests.length === 0 ? (
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
                    subtitle={`Flat ${req.flatId?.flatNumber || "Assigned Unit"}, ${req.category}`}
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

      {/* 5. SECURITY STAFF: GATE TERMINAL & ROSTER */}
      {effectiveRole === ROLES.SECURITY_STAFF && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          <DashboardCard
            title="Gate Terminal Quick Entry"
            subtitle="Enter a 6-digit visitor code or check in guests"
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
                onClick={() => {
                  if (passCodeInput.trim()) {
                    navigate(`/visitors/verify?code=${encodeURIComponent(passCodeInput.trim())}`);
                  } else {
                    navigate("/visitors/verify");
                  }
                }}
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

          <DashboardCard
            title="Currently Inside Premises"
            subtitle="Visitors on site who need to be checked out upon leaving"
            action="Full Visitor Log"
            actionLink="/visitors"
          >
            {loadingVisitors ? (
              <TableLoadingSkeleton rows={3} />
            ) : checkedInVisitors.length === 0 ? (
              <DashboardEmptyState message="No visitors currently inside." />
            ) : (
              <Stack spacing={1}>
                {checkedInVisitors.map((v) => (
                  <DashboardListItem
                    key={v._id || v.id}
                    icon={<BadgeIcon />}
                    title={v.visitorName || v.name || "Guest Visitor"}
                    subtitle={`Visiting Flat ${v.flatId?.flatNumber || v.flat?.flatNumber || "Visiting Unit"}, Phone: ${v.visitorPhone || v.phone || "—"}`}
                    rightContent={
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ExitToAppIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate("/visitors/verify")}
                        sx={{
                          minHeight: 44,
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

      {/* 6. RESIDENT (OWNER / TENANT): MY FLAT OVERVIEW & INVOICES */}
      {(effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
        <DashboardCard
          title={effectiveRole === ROLES.OWNER ? "Residence Ledger & Invoices" : "Recent Invoices"}
          subtitle="Monthly maintenance bills and payment records for your flat"
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
                        ₨{(Number(inv.totalAmount) || 0).toLocaleString()}
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
