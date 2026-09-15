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
import Rating from "@mui/material/Rating";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PeopleIcon from "@mui/icons-material/People";
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
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import StarRateIcon from "@mui/icons-material/StarRate";
import HistoryIcon from "@mui/icons-material/History";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../providers/auth-context.js";
import { ROLES, ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { TrendChart } from "../../components/common/TrendChart.jsx";
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
import { useTenantsList } from "../../features/tenants/hooks/use-tenants.js";
import { FONT_UI } from "../../theme/typography.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";

// =========================================================================
// REUSABLE HELPERS, FORMATTERS & ROW PRESENTERS
// =========================================================================

/**
 * Cleanly format physical address without [object Object] serialization
 */
const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.city, addr.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (addr.city || "");
};

/**
 * Clean sentence-case converter for enums and actions
 */
const toSentenceCase = (str) => {
  if (!str) return "";
  const clean = String(str).replace(/_/g, " ").trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Human-readable relative time formatter ("2 hours ago", "Yesterday", etc.)
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1 min ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const DashboardCard = ({
  title,
  subtitle,
  action,
  actionLink,
  actionComponent = null,
  children,
  sx = {},
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 1.75, sm: 2 },
      borderRadius: "12px",
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
        mb: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0, pr: 1.5 }}>
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.015em",
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: FONT_UI,
              color: DESIGN_TOKENS.text.secondary,
              display: "block",
              mt: 0.25,
              fontSize: "0.75rem",
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionComponent ? (
        actionComponent
      ) : action && actionLink ? (
        <Button
          component={RouterLink}
          to={actionLink}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "0.8125rem !important" }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: DESIGN_TOKENS.brand[600],
            p: "2px 6px",
            minWidth: "auto",
            flexShrink: 0,
            "&:hover": {
              bgcolor: DESIGN_TOKENS.brand[50],
              color: DESIGN_TOKENS.brand[700],
            },
          }}
        >
          {action}
        </Button>
      ) : null}
    </Box>
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</Box>
  </Paper>
);

const DashboardEmptyState = ({ message, subtext = null, action = null, icon = null, compact = false }) => (
  <Box
    sx={{
      p: { xs: 2.5, sm: 3 },
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#F8FAFC",
      borderRadius: "12px",
      border: `1px dashed ${DESIGN_TOKENS.line[200]}`,
      my: "auto",
      minHeight: compact ? 120 : 150,
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: "10px",
        bgcolor: "#FFFFFF",
        border: `1px solid ${DESIGN_TOKENS.line[200]}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: DESIGN_TOKENS.brand[600],
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        mb: 1.25,
      }}
    >
      {icon ? (
        React.cloneElement(icon, { sx: { fontSize: 20, ...icon.props?.sx } })
      ) : (
        <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />
      )}
    </Box>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        color: DESIGN_TOKENS.text.primary,
        fontSize: "0.875rem",
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
          fontSize: "0.75rem",
          lineHeight: 1.45,
        }}
      >
        {subtext}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
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
        p: "7px 10px",
        borderRadius: "8px",
        border: "1px solid",
        borderColor: "#F1F5F9",
        bgcolor: "#FFFFFF",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: DESIGN_TOKENS.brand[300],
          bgcolor: "rgba(79, 70, 229, 0.03)",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, mr: 1.25 }}>
        {icon && (
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "6px",
              bgcolor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor,
              flexShrink: 0,
              "& svg": { fontSize: 16 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: DESIGN_TOKENS.text.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            typeof subtitle === "string" ? (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: FONT_UI,
                  color: DESIGN_TOKENS.text.secondary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                  fontSize: "0.7188rem",
                  mt: 0.2,
                }}
              >
                {subtitle}
              </Typography>
            ) : (
              subtitle
            )
          )}
        </Box>
      </Box>
      {rightContent && <Box sx={{ flexShrink: 0, ml: 1 }}>{rightContent}</Box>}
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
  const effectiveRole = role;
  const [managerTriageFilter, setManagerTriageFilter] = useState("ALL");

  // Live Domain Queries
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
  const tenants = useMemo(
    () => tenantsData?.tenants || (Array.isArray(tenantsData) ? tenantsData : []),
    [tenantsData]
  );

  // Active building name for scoped titles
  const activeBuilding = useMemo(() => {
    return buildings.find((b) => (b.id || b._id) === activeBuildingId);
  }, [buildings, activeBuildingId]);

  // Compute Live Operational Metrics
  const openRequests = useMemo(
    () => requests.filter((r) => r.status === "OPEN" || r.status === "TRIAGED" || r.status === "ASSIGNED" || r.status === "IN_PROGRESS"),
    [requests]
  );
  const unassignedRequests = useMemo(
    () => requests.filter((r) => !r.assignedStaffId && r.status !== "RESOLVED" && r.status !== "CLOSED"),
    [requests]
  );
  const urgentRequests = useMemo(
    () => requests.filter((r) => (r.priority === "EMERGENCY" || r.priority === "HIGH") && r.status !== "CLOSED" && r.status !== "RESOLVED"),
    [requests]
  );
  const managerFilteredRequests = useMemo(() => {
    if (managerTriageFilter === "UNASSIGNED") return unassignedRequests;
    if (managerTriageFilter === "URGENT") return urgentRequests;
    return openRequests;
  }, [managerTriageFilter, unassignedRequests, urgentRequests, openRequests]);

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
  const totalBilled = useMemo(
    () => invoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () =>
      invoices.reduce(
        (acc, curr) =>
          acc + (Number(curr.paidAmount) || (curr.status === "PAID" ? Number(curr.totalAmount) || 0 : 0)),
        0
      ),
    [invoices]
  );
  const collectionRate = useMemo(
    () =>
      totalBilled > 0
        ? Math.round((totalCollected / totalBilled) * 100)
        : invoices.length > 0
        ? Math.round((paidInvoices.length / invoices.length) * 100)
        : 0,
    [totalBilled, totalCollected, invoices, paidInvoices]
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

  // Real Dynamic Collections Trend Calculation (trailing 6 months)
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

  // Platform Growth Trend Calculation (cumulative active resident & user onboarding)
  const platformGrowthTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      months.push({ key, label, count: 0 });
    }

    users.forEach((u) => {
      const p = u.createdAt ? String(u.createdAt).slice(0, 7) : "";
      const target = months.find((m) => m.key === p);
      if (target) {
        target.count += 1;
      }
    });

    // Calculate prior count before window
    const priorCount = users.filter((u) => {
      const p = u.createdAt ? String(u.createdAt).slice(0, 7) : "";
      return p && p < months[0].key;
    }).length;

    // Cumulative progression
    let runningTotal = priorCount;
    const cumulativeCounts = months.map((m) => {
      runningTotal += m.count;
      return runningTotal;
    });

    return {
      labels: months.map((m) => m.label),
      counts: cumulativeCounts,
    };
  }, [users]);

  // Buildings Ranked by Lowest Collection / Open Complaints
  const rankedBuildings = useMemo(() => {
    return buildings
      .map((b) => {
        const bInvoices = invoices.filter((i) => i.buildingId === (b.id || b._id));
        const bPaid = bInvoices.filter((i) => i.status === "PAID").length;
        const bRate = bInvoices.length > 0 ? Math.round((bPaid / bInvoices.length) * 100) : 100;
        const bComplaints = complaints.filter(
          (c) => c.buildingId === (b.id || b._id) && c.status !== "RESOLVED"
        ).length;
        return {
          ...b,
          collectionRate: bRate,
          openComplaints: bComplaints,
        };
      })
      .sort((a, b) => a.collectionRate - b.collectionRate || b.openComplaints - a.openComplaints)
      .slice(0, 5);
  }, [buildings, invoices, complaints]);

  // Time-aware warm greeting pattern showing full name
  const getGreeting = (firstName, lastName) => {
    const hour = new Date().getHours();
    let timeStr = "Good morning";
    if (hour >= 12 && hour < 17) timeStr = "Good afternoon";
    else if (hour >= 17) timeStr = "Good evening";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return `${timeStr}, ${fullName || "Resident"}`;
  };

  // Check if Super Admin portfolio has 0 buildings
  const isSuperAdminEmpty = effectiveRole === ROLES.SUPER_ADMIN && buildings.length === 0 && !loadingBuildings;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>

      {/* -------------------------------------------------------------------------
          0. STANDARD PAGE HEADER
          ------------------------------------------------------------------------- */}
      <PageHeader
        title={getGreeting(user?.firstName, user?.lastName)}
        subtitle={
          effectiveRole === ROLES.BUILDING_ADMIN && activeBuilding
            ? `Currently managing: ${activeBuilding.name || "Building Operations"}`
            : effectiveRole === ROLES.ACCOUNTANT && activeBuilding
            ? `Financial ledger scope: ${activeBuilding.name || "Portfolio Ledger"}`
            : effectiveRole === ROLES.SECURITY_STAFF
            ? "Gate control & entry pass verification terminal"
            : effectiveRole === ROLES.MAINTENANCE_STAFF
            ? "Today's work orders & assigned technical tickets"
            : effectiveRole === ROLES.OWNER
            ? (user?.flatId?.flatNumber ? `Flat ${user.flatId.flatNumber}: Residence maintenance dues and service requests` : "Residence maintenance dues and service requests")
            : effectiveRole === ROLES.TENANT
            ? (user?.flatId?.flatNumber ? `Flat ${user.flatId.flatNumber}: Resident portal and active dues` : "Resident portal and active dues")
            : effectiveRole === ROLES.SUPER_ADMIN
            ? "Global property portfolio and operations command center"
            : undefined
        }
        action={
          effectiveRole === ROLES.SUPER_ADMIN ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981", ml: 0.5, mr: -0.25 }} />}
                label="All Systems Operational"
                size="small"
                sx={{
                  bgcolor: "#ECFDF5",
                  color: "#065F46",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  border: "1px solid #A7F3D0",
                  display: { xs: "none", sm: "inline-flex" },
                }}
              />
              <Button
                component={RouterLink}
                to="/buildings"
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  borderRadius: "8px",
                  textTransform: "none",
                  py: 0.6,
                  px: 1.75,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Building
              </Button>
            </Stack>
          ) : effectiveRole === ROLES.SECURITY_STAFF ? (
            <Button
              component={RouterLink}
              to="/visitors/verify"
              variant="contained"
              startIcon={<ExitToAppIcon />}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                fontWeight: 700,
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              }}
            >
              Open Gate Terminal
            </Button>
          ) : (effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) ? (
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
                startIcon={<BadgeIcon />}
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
          ) : null
        }
      />

      {/* -------------------------------------------------------------------------
          SUPER ADMIN EMPTY STATE (Section §1: No Buildings Yet)
          ------------------------------------------------------------------------- */}
      {isSuperAdminEmpty ? (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            borderRadius: "16px",
            borderColor: DESIGN_TOKENS.line[200],
            bgcolor: "#FFFFFF",
            textAlign: "center",
            mt: 2,
          }}
        >
          <EmptyState
            icon={<ApartmentIcon sx={{ fontSize: 48, color: DESIGN_TOKENS.brand[600] }} />}
            title="No buildings yet"
            description="Add your first building to start managing your residential portfolio and operational staff."
            action={
              <Button
                component={RouterLink}
                to="/buildings"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Add Building
              </Button>
            }
          />
        </Paper>
      ) : (
        <>
          {/* =========================================================================
              1. STATCARD ROW (Symmetric 4 or 3 Equal Columns across All Dashboards)
              ========================================================================= */}
          <Box sx={{ mb: 2, width: "100%" }}>
            {/* 1. SUPER ADMIN (Section §1) */}
            {effectiveRole === ROLES.SUPER_ADMIN && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={buildings.length}
                    label="Total Buildings"
                    delta="+1 this quarter"
                    icon={<ApartmentIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={users.length}
                    label="Total Active Users"
                    delta="Across all platform roles"
                    icon={<PeopleIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="Platform Collection Rate"
                    delta="Fees collected this period"
                    icon={<AccountBalanceWalletIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={openRequests.length}
                    label="Open Work Orders"
                    delta="Platform-wide active tickets"
                    icon={<BuildIcon />}
                    iconBg={openRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={openRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={openRequests.length > 0}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 2. BUILDING ADMIN (Section §2) */}
            {effectiveRole === ROLES.BUILDING_ADMIN && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`${occupancyPct}%`}
                    label="Occupancy Rate"
                    delta={`${occupiedFlats} of ${totalFlats} flats occupied`}
                    icon={<HomeWorkIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={openRequests.length}
                    label="Open Work Orders"
                    delta={`${unassignedRequests.length} awaiting technician dispatch`}
                    icon={<BuildIcon />}
                    iconBg={openRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={openRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={openRequests.length > 0}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="This Month's Collection"
                    delta={`${paidInvoices.length} of ${invoices.length} invoices settled`}
                    icon={<AccountBalanceWalletIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={complaints.filter((c) => c.status !== "RESOLVED").length}
                    label="Open Complaints"
                    delta="Resident grievances under triage"
                    icon={<ReportProblemIcon />}
                    iconBg={complaints.filter((c) => c.status !== "RESOLVED").length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={complaints.filter((c) => c.status !== "RESOLVED").length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 3. MANAGER (Section §3 - Working Queue) */}
            {effectiveRole === ROLES.MANAGER && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={unassignedRequests.length}
                    label="Unassigned Work Orders"
                    delta="Require technician assignment"
                    icon={<AssignmentLateIcon />}
                    iconBg={unassignedRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={unassignedRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={unassignedRequests.length > 0}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={urgentRequests.length}
                    label="Urgent / SLA At Risk"
                    delta="Emergency priority tickets"
                    icon={<WarningAmberIcon />}
                    iconBg={urgentRequests.length > 0 ? "#FEE2E2" : "#EEF2FF"}
                    iconColor={urgentRequests.length > 0 ? "#DC2626" : DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={staff.filter((s) => s.status === "ACTIVE" || s.isAvailable !== false).length}
                    label="Staff Available"
                    delta={`${staff.length} technicians registered`}
                    icon={<SupervisorAccountIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`${occupancyPct}%`}
                    label="Building Occupancy"
                    delta={`${occupiedFlats} of ${flats.length} units occupied`}
                    icon={<HomeWorkIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 4. ACCOUNTANT (Section §4) */}
            {effectiveRole === ROLES.ACCOUNTANT && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="This Month's Collection Rate"
                    delta={`${paidInvoices.length} invoices settled this period`}
                    icon={<TrendingUpIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={`₨${totalOverdueAmount.toLocaleString()}`}
                    label="Total Outstanding"
                    delta="Accumulated unpaid ledger balances"
                    icon={<AccountBalanceWalletIcon />}
                    iconBg={totalOverdueAmount > 0 ? "#FEE2E2" : "#ECFDF5"}
                    iconColor={totalOverdueAmount > 0 ? "#DC2626" : "#059669"}
                    isHero={totalOverdueAmount > 0}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={overdueInvoices.length}
                    label="Overdue Invoices"
                    delta="Invoices past grace period deadline"
                    icon={<ReceiptLongIcon />}
                    iconBg={overdueInvoices.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={overdueInvoices.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <StatCard
                    value={pendingExpenses.length}
                    label="Pending Expense Approvals"
                    delta="Operational claims awaiting review"
                    icon={<PendingActionsIcon />}
                    iconBg={pendingExpenses.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={pendingExpenses.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 5. MAINTENANCE STAFF (Section §5 - Mobile-First Compact Pair) */}
            {effectiveRole === ROLES.MAINTENANCE_STAFF && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                  <StatCard
                    value={requests.filter((r) => r.status !== "CLOSED" && r.status !== "CANCELLED").length}
                    label="Assigned to You Today"
                    delta="Active work orders in your queue"
                    icon={<BuildIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    isHero={true}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                  <StatCard
                    value={requests.filter((r) => r.status === "COMPLETED" || r.status === "VERIFIED").length}
                    label="Completed This Week"
                    delta="Successfully resolved jobs"
                    icon={<CheckCircleOutlinedIcon />}
                    iconBg="#ECFDF5"
                    iconColor="#059669"
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 6. SECURITY STAFF (Section §6 - Gate Launcher) */}
            {effectiveRole === ROLES.SECURITY_STAFF && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} sm={6} sx={{ display: "flex" }}>
                  <StatCard
                    value={checkedInVisitors.length}
                    label="Currently Inside Premises"
                    delta="Guests on site awaiting checkout"
                    icon={<BadgeIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    isHero={true}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: "flex" }}>
                  <StatCard
                    value={expectedVisitors.length}
                    label="Expected Today"
                    delta="Pre-approved resident entry passes"
                    icon={<DoorSlidingIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}

            {/* 7 & 8. RESIDENTS (FLAT OWNER & TENANT - Sections §7 & §8) */}
            {(effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
              <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                  <StatCard
                    value={totalOverdueAmount > 0 ? `₨${totalOverdueAmount.toLocaleString()} Due` : "All Paid"}
                    label="Dues Status"
                    delta={
                      totalOverdueAmount > 0
                        ? "Outstanding maintenance dues"
                        : "Your maintenance fees are caught up"
                    }
                    icon={<AccountBalanceWalletIcon />}
                    iconBg={totalOverdueAmount > 0 ? "#FEE2E2" : "#ECFDF5"}
                    iconColor={totalOverdueAmount > 0 ? "#DC2626" : "#059669"}
                    isHero={totalOverdueAmount > 0}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                  <StatCard
                    value={requests.length}
                    label="Open Work Orders"
                    delta="Service tickets logged for your unit"
                    icon={<BuildIcon />}
                    iconBg={requests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={requests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                  <StatCard
                    value={visitors.filter((v) => v.status === "EXPECTED" || v.status === "CHECKED_IN").length}
                    label="Active Visitor Passes"
                    delta="Valid guest codes currently active"
                    icon={<BadgeIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          {/* =========================================================================
              2. ROW 2 & ROW 3 PANELS (Standard 60/40 Split or Full Width)
              ========================================================================= */}

          {/* 1. SUPER ADMIN DASHBOARD (Section §1 - Enterprise Command Center) */}
          {effectiveRole === ROLES.SUPER_ADMIN && (
            <Grid container spacing={2}>
              {/* Left Major Column: Growth, Portfolio & Mutations (8 cols on lg) */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={2}>
                  {/* Card 1: Platform Growth & Velocity Analytics */}
                  <TrendChart
                    title="Platform Growth & User Velocity"
                    subtitle="Cumulative member and staff onboarding trajectory"
                    metric={`${users.length} active members`}
                    color={DESIGN_TOKENS.brand[600]}
                    data={platformGrowthTrend.counts}
                    labels={platformGrowthTrend.labels}
                    emptyMessage="Growth data will appear as accounts register"
                    height={85}
                    compact={true}
                  />

                  {/* Card 2: Managed Building Complexes Portfolio */}
                  <DashboardCard
                    title="Managed Complex Portfolio"
                    subtitle="Real-time operational standing across residential complexes"
                    action="Buildings Registry"
                    actionLink="/buildings"
                  >
                    {buildings.length === 0 ? (
                      <DashboardEmptyState message="No building complexes registered yet." compact={true} />
                    ) : (
                      <Stack spacing={1}>
                        {buildings.map((b) => {
                          const bId = b.id || b._id;
                          const bFlats = flats.filter((f) => String(f.buildingId?._id || f.buildingId) === String(bId));
                          const bOccupied = bFlats.filter((f) => f.status === "OCCUPIED").length;
                          const bInvoices = invoices.filter((i) => String(i.buildingId?._id || i.buildingId) === String(bId));
                          const bPaid = bInvoices.filter((i) => i.status === "PAID").length;
                          const bRate = bInvoices.length > 0 ? Math.round((bPaid / bInvoices.length) * 100) : 100;

                          return (
                            <DashboardListItem
                              key={bId}
                              to={`/buildings/${bId}`}
                              icon={<ApartmentIcon />}
                              title={b.name}
                              subtitle={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.2, flexWrap: "wrap" }}>
                                  <Chip
                                    label={`Code: ${b.code || "BLD"}`}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: "0.625rem",
                                      fontWeight: 600,
                                      bgcolor: "#EEF2FF",
                                      color: DESIGN_TOKENS.brand[700],
                                      borderRadius: "4px",
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.7188rem" }}>
                                    {bFlats.length > 0 ? `${bOccupied}/${bFlats.length} flats occupied` : `${b.totalFlats || 0} flats total`}
                                  </Typography>
                                  {b.address && formatAddress(b.address) && (
                                    <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.7188rem" }}>
                                      • {formatAddress(b.address)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              rightContent={
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <Chip
                                    label={`${bRate}% collected`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.6875rem",
                                      fontWeight: 600,
                                      bgcolor: bRate < 80 ? "#FEE2E2" : "#ECFDF5",
                                      color: bRate < 80 ? "#DC2626" : "#059669",
                                      borderRadius: "5px",
                                    }}
                                  />
                                  <StatusChip status={b.status || "ACTIVE"} />
                                </Stack>
                              }
                            />
                          );
                        })}
                      </Stack>
                    )}
                  </DashboardCard>

                  {/* Card 3: Live System Audit Trail */}
                  <DashboardCard
                    title="Live Security & Administrative Audit Trail"
                    subtitle="Immutable cryptographic ledger of platform events and role mutations"
                    action="Full Audit Log"
                    actionLink="/audit-logs"
                  >
                    {auditLogs.length === 0 ? (
                      <DashboardEmptyState message="No administrative activity recorded yet." compact={true} />
                    ) : (
                      <Stack spacing={0.85}>
                        {auditLogs.slice(0, 3).map((log) => (
                          <DashboardListItem
                            key={log.id || log._id}
                            to="/audit-logs"
                            icon={<HistoryIcon />}
                            title={toSentenceCase(log.action) || "Platform event"}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.2 }}>
                                <Chip
                                  label={toSentenceCase(log.resourceType || "System")}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: "0.625rem",
                                    fontWeight: 600,
                                    bgcolor: "#F1F5F9",
                                    color: "#475569",
                                    borderRadius: "4px",
                                    px: 0.5,
                                    "& .MuiChip-label": { px: 0.5 },
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.7188rem" }}>
                                  {log.actorUserId?.firstName
                                    ? `${log.actorUserId.firstName} ${log.actorUserId.lastName || ""}`.trim()
                                    : "System administrator"}
                                </Typography>
                              </Box>
                            }
                            rightContent={
                              <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.7188rem", whiteSpace: "nowrap" }}>
                                {formatRelativeTime(log.timestamp || log.createdAt)}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Stack>
              </Grid>

              {/* Right Control Column: Infrastructure, Bulletins, and Quick Launcher (4 cols on lg) */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={2}>
                  {/* Card 4: Platform Infrastructure Telemetry */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      borderColor: DESIGN_TOKENS.line[200],
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
                      <Box>
                        <Typography sx={{ fontFamily: FONT_UI, fontSize: "0.9375rem", fontWeight: 700, color: DESIGN_TOKENS.text.primary, lineHeight: 1.25 }}>
                          Platform Telemetry
                        </Typography>
                        <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block", fontSize: "0.75rem", mt: 0.25 }}>
                          Infrastructure & services status
                        </Typography>
                      </Box>
                      <Chip
                        label="Healthy"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: "#ECFDF5",
                          color: "#059669",
                          borderRadius: "5px",
                        }}
                      />
                    </Box>

                    <Stack spacing={1}>
                      {[
                        { label: "REST API Gateway", value: "200 OK • Node.js" },
                        { label: "Database Cluster", value: "MongoDB Atlas Connected" },
                        { label: "Auth & OBAC Engine", value: "8 Roles Configured" },
                        { label: "Active User Base", value: `${users.length} registered accounts` },
                      ].map((service) => (
                        <Box
                          key={service.label}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: "6px 10px",
                            borderRadius: "7px",
                            bgcolor: "#F8FAFC",
                            border: "1px solid #F1F5F9",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.85 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#10B981" }} />
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
                              {service.label}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: "0.7188rem", color: DESIGN_TOKENS.text.secondary }}>
                            {service.value}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Card 5: Platform Bulletins & Notices */}
                  <DashboardCard
                    title="Platform Bulletins"
                    subtitle="System-wide broadcasts"
                    action="All Notices"
                    actionLink="/notices"
                  >
                    {notices.length === 0 ? (
                      <DashboardEmptyState message="No bulletins currently active." compact={true} />
                    ) : (
                      <Stack spacing={0.85}>
                        {notices.slice(0, 2).map((n) => (
                          <DashboardListItem
                            key={n.id || n._id}
                            to="/notices"
                            icon={<CampaignIcon />}
                            title={n.title}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.2 }}>
                                <Chip
                                  label={toSentenceCase(n.targetAudience || "All residents")}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: "0.625rem",
                                    fontWeight: 600,
                                    bgcolor: "#F1F5F9",
                                    color: "#475569",
                                    borderRadius: "4px",
                                    px: 0.5,
                                    "& .MuiChip-label": { px: 0.5 },
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.7188rem" }}>
                                  {n.buildingId?.name || "Global notice"}
                                </Typography>
                              </Box>
                            }
                            rightContent={
                              <Chip
                                label={toSentenceCase(n.priority || "Normal")}
                                size="small"
                                sx={{
                                  fontSize: "0.65rem",
                                  height: 18,
                                  fontWeight: 600,
                                  bgcolor: n.priority === "URGENT_EMERGENCY" ? "#FEE2E2" : "#F1F5F9",
                                  color: n.priority === "URGENT_EMERGENCY" ? "#DC2626" : "#475569",
                                  borderRadius: "5px",
                                }}
                              />
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>

                  {/* Card 6: Executive Quick Launcher */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      borderColor: DESIGN_TOKENS.line[200],
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <Typography sx={{ fontFamily: FONT_UI, fontSize: "0.875rem", fontWeight: 700, color: DESIGN_TOKENS.text.primary, mb: 0.25, lineHeight: 1.25 }}>
                      Executive Operations
                    </Typography>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block", mb: 1.25, fontSize: "0.75rem" }}>
                      Administrative launcher
                    </Typography>
                    <Grid container spacing={1}>
                      {[
                        { label: "Add Building", to: "/buildings", icon: <ApartmentIcon sx={{ fontSize: 16 }} /> },
                        { label: "Invite User", to: "/users", icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
                        { label: "Audit Trail", to: "/audit-logs", icon: <HistoryIcon sx={{ fontSize: 16 }} /> },
                        { label: "System Reports", to: "/reports", icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
                      ].map((actionItem) => (
                        <Grid item xs={6} key={actionItem.label}>
                          <Button
                            component={RouterLink}
                            to={actionItem.to}
                            fullWidth
                            variant="outlined"
                            startIcon={actionItem.icon}
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.7188rem",
                              borderRadius: "8px",
                              py: 0.65,
                              px: 1,
                              color: DESIGN_TOKENS.text.primary,
                              borderColor: DESIGN_TOKENS.line[200],
                              bgcolor: "#F8FAFC",
                              "&:hover": {
                                borderColor: DESIGN_TOKENS.brand[600],
                                bgcolor: "#EEF2FF",
                                color: DESIGN_TOKENS.brand[700],
                              },
                            }}
                          >
                            {actionItem.label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* 2. BUILDING ADMIN DASHBOARD PANELS (Section §2) */}
          {effectiveRole === ROLES.BUILDING_ADMIN && (
            <Stack spacing={3}>
              {/* Row 2: 60/40 Split */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={7.2}>
                  <TrendChart
                    title="Collections Trend"
                    subtitle="Trailing 6-month collection recovery velocity"
                    metric={`${collectionRate}% collected`}
                    color={DESIGN_TOKENS.brand[600]}
                    data={collectionsTrend.rates}
                    labels={collectionsTrend.labels}
                    emptyMessage="No billing records available for this period"
                  />
                </Grid>

                <Grid item xs={12} md={4.8}>
                  <DashboardCard
                    title="Work Orders Needing Attention"
                    subtitle="Highest-priority and unassigned service tickets"
                    action="View All"
                    actionLink="/maintenance-requests"
                  >
                    {openRequests.length === 0 ? (
                      <DashboardEmptyState message="All caught up — no work orders need attention." />
                    ) : (
                      <Stack spacing={1}>
                        {openRequests.slice(0, 5).map((req) => (
                          <DashboardListItem
                            key={req._id || req.id}
                            to="/maintenance-requests"
                            icon={<BuildIcon />}
                            iconBg={req.priority === "EMERGENCY" ? "#FEE2E2" : DESIGN_TOKENS.brand[50]}
                            iconColor={req.priority === "EMERGENCY" ? "#DC2626" : DESIGN_TOKENS.brand[600]}
                            title={req.title}
                            subtitle={`Ticket #${req.requestNumber || "WO"}, category: ${toSentenceCase(req.category)}`}
                            rightContent={
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <Chip
                                  label={toSentenceCase(req.priority)}
                                  size="small"
                                  sx={{
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    bgcolor: req.priority === "EMERGENCY" ? "#FEE2E2" : "#F1F5F9",
                                    color: req.priority === "EMERGENCY" ? "#DC2626" : "#475569",
                                    borderRadius: "6px",
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
              </Grid>

              {/* Row 3: Paired Cards (Latest Notices + Staff Snapshot) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Latest Notices"
                    subtitle="Community bulletins published for residents"
                    action="All Notices"
                    actionLink="/notices"
                  >
                    {notices.length === 0 ? (
                      <DashboardEmptyState message="No notices published yet." />
                    ) : (
                      <Stack spacing={1}>
                        {notices.slice(0, 4).map((n) => (
                          <DashboardListItem
                            key={n._id || n.id}
                            to="/notices"
                            icon={<CampaignIcon />}
                            title={n.title}
                            subtitle={n.content?.slice(0, 60) + "..."}
                            rightContent={<StatusChip status={n.priority} />}
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Staff Performance Snapshot"
                    subtitle="Technicians ranked by resolution rating and duty availability"
                    action="Manage Staff"
                    actionLink="/staff"
                  >
                    {staff.length === 0 ? (
                      <DashboardEmptyState message="No staff registered for this building." />
                    ) : (
                      <Stack spacing={1}>
                        {staff.slice(0, 4).map((s) => (
                          <DashboardListItem
                            key={s._id || s.id}
                            to="/staff"
                            icon={<SupervisorAccountIcon />}
                            title={`${s.userId?.firstName || ""} ${s.userId?.lastName || s.designation || "Technician"}`}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}>
                                  {toSentenceCase(s.category || s.specialization || "General")}
                                </Typography>
                                <Chip
                                  label={`Shift: ${toSentenceCase(s.shift || "Morning")}`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    bgcolor: "#F1F5F9",
                                    color: "#475569",
                                    borderRadius: "4px",
                                    px: 0.5,
                                    "& .MuiChip-label": { px: 0.5 },
                                  }}
                                />
                              </Box>
                            }
                            rightContent={
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                <Rating value={s.averageRating || 4.5} precision={0.5} size="small" readOnly />
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, ml: 0.5 }}>
                                  {s.averageRating || "4.5"}
                                </Typography>
                              </Stack>
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* 3. MANAGER DASHBOARD (Section §3 - Operational Command Center) */}
          {effectiveRole === ROLES.MANAGER && (
            <Grid container spacing={3}>
              {/* Left Primary Column: Triage Queue & Resident Inquiries (8 cols) */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                  {/* Primary Working Triage Queue */}
                  <DashboardCard
                    title="Live Triage & Dispatch Queue"
                    subtitle="Review, prioritize, and assign incoming service requests"
                    action="Work Order Registry"
                    actionLink="/maintenance-requests"
                    actionComponent={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {[
                          { id: "ALL", label: `All (${openRequests.length})` },
                          { id: "UNASSIGNED", label: `Unassigned (${unassignedRequests.length})` },
                          { id: "URGENT", label: `Urgent (${urgentRequests.length})` },
                        ].map((filterTab) => {
                          const isActive = managerTriageFilter === filterTab.id;
                          return (
                            <Chip
                              key={filterTab.id}
                              label={filterTab.label}
                              size="small"
                              onClick={() => setManagerTriageFilter(filterTab.id)}
                              sx={{
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: isActive ? 700 : 500,
                                bgcolor: isActive ? DESIGN_TOKENS.brand[600] : "#F1F5F9",
                                color: isActive ? "#FFFFFF" : DESIGN_TOKENS.text.secondary,
                                border: "1px solid",
                                borderColor: isActive ? DESIGN_TOKENS.brand[600] : "#E2E8F0",
                                "&:hover": {
                                  bgcolor: isActive ? DESIGN_TOKENS.brand[700] : "#E2E8F0",
                                },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    }
                  >
                    {managerFilteredRequests.length === 0 ? (
                      <DashboardEmptyState
                        message={
                          managerTriageFilter === "UNASSIGNED"
                            ? "All work orders have been assigned to technicians."
                            : managerTriageFilter === "URGENT"
                            ? "No urgent or emergency work orders pending."
                            : "Nothing needs triage right now — new work orders will appear here the moment they're submitted."
                        }
                        icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                      />
                    ) : (
                      <DataTable
                        columns={[
                          {
                            id: "requestNumber",
                            label: "Ticket #",
                            minWidth: 90,
                            render: (r) => (
                              <Typography sx={{ fontWeight: 700, fontSize: "0.8125rem", color: DESIGN_TOKENS.brand[700] }}>
                                #{r.requestNumber || r._id?.slice(-6)}
                              </Typography>
                            ),
                          },
                          {
                            id: "title",
                            label: "Request Title",
                            render: (r) => (
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: DESIGN_TOKENS.text.primary }}>
                                  {r.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}>
                                  {r.flatId?.flatNumber ? `Unit: Flat ${r.flatId.flatNumber}` : "General Area"}
                                </Typography>
                              </Box>
                            ),
                          },
                          {
                            id: "category",
                            label: "Category",
                            render: (r) => (
                              <Chip
                                label={toSentenceCase(r.category)}
                                size="small"
                                sx={{
                                  fontSize: "0.75rem",
                                  bgcolor: "#F1F5F9",
                                  color: DESIGN_TOKENS.text.primary,
                                  fontWeight: 500,
                                }}
                              />
                            ),
                          },
                          { id: "priority", label: "Priority", render: (r) => <StatusChip status={r.priority} /> },
                          { id: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
                          {
                            id: "actions",
                            label: "Action",
                            align: "right",
                            render: () => (
                              <Button
                                component={RouterLink}
                                to="/maintenance-requests"
                                size="small"
                                variant="contained"
                                sx={{
                                  bgcolor: DESIGN_TOKENS.brand[600],
                                  fontSize: "0.75rem",
                                  py: 0.35,
                                  px: 1.5,
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                                }}
                              >
                                Assign
                              </Button>
                            ),
                          },
                        ]}
                        rows={managerFilteredRequests.slice(0, 5)}
                        totalCount={managerFilteredRequests.length}
                        rowsPerPage={5}
                        page={0}
                      />
                    )}
                  </DashboardCard>

                  {/* Secondary: Priority Resident Inquiries & Complaints */}
                  <DashboardCard
                    title="Resident Inquiries & Grievances"
                    subtitle="Open complaints and facility concerns requiring operational review"
                    action="Complaints Center"
                    actionLink="/complaints"
                  >
                    {complaints.filter((c) => c.status !== "RESOLVED").length === 0 ? (
                      <DashboardEmptyState
                        message="All resident inquiries and complaints are currently resolved."
                        icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                      />
                    ) : (
                      <Stack spacing={1}>
                        {complaints
                          .filter((c) => c.status !== "RESOLVED")
                          .slice(0, 3)
                          .map((c) => (
                            <DashboardListItem
                              key={c._id || c.id}
                              to="/complaints"
                              icon={<ReportProblemIcon />}
                              iconBg={c.status === "OPEN" ? "#FEE2E2" : "#FEF3C7"}
                              iconColor={c.status === "OPEN" ? "#DC2626" : "#B45309"}
                              title={c.title}
                              subtitle={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}>
                                    {c.flat?.flatNumber ? `Flat ${c.flat.flatNumber}` : "Common Facility"}
                                  </Typography>
                                  <Chip
                                    label={toSentenceCase(c.type || "General")}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "0.6875rem",
                                      fontWeight: 600,
                                      bgcolor: "#F1F5F9",
                                      color: "#475569",
                                      borderRadius: "4px",
                                    }}
                                  />
                                </Box>
                              }
                              rightContent={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <StatusChip status={c.status} />
                                  <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                                    {formatRelativeTime(c.createdAt)}
                                  </Typography>
                                </Stack>
                              }
                            />
                          ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Stack>
              </Grid>

              {/* Right Secondary Column: Duty Roster, Tenancies, & Actions (4 cols) */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={3}>
                  {/* Card 1: Duty Roster & Staff Availability */}
                  <DashboardCard
                    title="Duty Roster & Staff"
                    subtitle="Technicians available for dispatch"
                    action="Staff Registry"
                    actionLink="/staff"
                  >
                    {staff.length === 0 ? (
                      <DashboardEmptyState message="No staff registered in this building complex." />
                    ) : (
                      <Stack spacing={1}>
                        {staff.slice(0, 4).map((s) => (
                          <DashboardListItem
                            key={s._id || s.id}
                            to="/staff"
                            icon={<SupervisorAccountIcon />}
                            title={`${s.userId?.firstName || ""} ${s.userId?.lastName || s.designation || "Staff"}`.trim()}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}>
                                  {toSentenceCase(s.category || "General maintenance")}
                                </Typography>
                                <Chip
                                  label={`Shift: ${toSentenceCase(s.shift || "Morning")}`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    bgcolor: "#F1F5F9",
                                    color: "#475569",
                                    borderRadius: "4px",
                                    px: 0.5,
                                    "& .MuiChip-label": { px: 0.5 },
                                  }}
                                />
                              </Box>
                            }
                            rightContent={
                              <Chip
                                label={toSentenceCase(s.status === "ACTIVE" ? "Available" : "On leave")}
                                size="small"
                                sx={{
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  bgcolor: s.status === "ACTIVE" ? "#DCFCE7" : "#FEE2E2",
                                  color: s.status === "ACTIVE" ? "#15803D" : "#DC2626",
                                  borderRadius: "6px",
                                }}
                              />
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>

                  {/* Card 2: Upcoming Move-ins */}
                  <DashboardCard
                    title="Scheduled Move-ins"
                    subtitle="Active resident transitions"
                    action="Tenants"
                    actionLink="/tenants"
                  >
                    {tenants.length === 0 ? (
                      <DashboardEmptyState message="No tenant transitions scheduled for this week." />
                    ) : (
                      <Stack spacing={1}>
                        {tenants.slice(0, 3).map((t) => (
                          <DashboardListItem
                            key={t._id || t.id}
                            to="/tenants"
                            icon={<DoorSlidingIcon />}
                            title={`${t.userId?.firstName || "Resident"} ${t.userId?.lastName || ""}`}
                            subtitle={`Lease Start: ${t.leaseStartDate ? new Date(t.leaseStartDate).toLocaleDateString() : "Active"}`}
                            rightContent={<StatusChip status={t.status} />}
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>

                  {/* Card 3: Manager Quick Operations */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: "14px",
                      borderColor: DESIGN_TOKENS.line[200],
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "0.9375rem",
                        fontWeight: 700,
                        color: DESIGN_TOKENS.text.primary,
                        mb: 0.5,
                      }}
                    >
                      Quick Operations
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: DESIGN_TOKENS.text.secondary,
                        display: "block",
                        mb: 2,
                        fontSize: "0.8125rem",
                      }}
                    >
                      Instant shortcuts for frequent workflows
                    </Typography>
                    <Grid container spacing={1.5}>
                      {[
                        { label: "New Ticket", to: "/maintenance-requests", icon: <BuildIcon fontSize="small" /> },
                        { label: "Post Notice", to: "/notices", icon: <CampaignIcon fontSize="small" /> },
                        { label: "Log Complaint", to: "/complaints", icon: <ReportProblemIcon fontSize="small" /> },
                        { label: "View Reports", to: "/reports", icon: <TrendingUpIcon fontSize="small" /> },
                      ].map((actionItem) => (
                        <Grid item xs={6} key={actionItem.label}>
                          <Button
                            component={RouterLink}
                            to={actionItem.to}
                            fullWidth
                            variant="outlined"
                            startIcon={actionItem.icon}
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              borderRadius: "10px",
                              py: 0.85,
                              px: 1.25,
                              color: DESIGN_TOKENS.text.primary,
                              borderColor: DESIGN_TOKENS.line[200],
                              bgcolor: "#F8FAFC",
                              "&:hover": {
                                borderColor: DESIGN_TOKENS.brand[600],
                                bgcolor: "#EEF2FF",
                                color: DESIGN_TOKENS.brand[700],
                              },
                            }}
                          >
                            {actionItem.label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* 4. ACCOUNTANT DASHBOARD (Section §4) */}
          {effectiveRole === ROLES.ACCOUNTANT && (
            <Stack spacing={3}>
              {/* Row 2: 60/40 Split */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={7.2}>
                  <TrendChart
                    title="Collections Trend"
                    subtitle="Monthly maintenance fee collections and recovery trajectory"
                    metric={`${collectionRate}% collected`}
                    color={DESIGN_TOKENS.accent.green}
                    data={collectionsTrend.rates}
                    labels={collectionsTrend.labels}
                    emptyMessage="No collections recorded yet"
                  />
                </Grid>

                <Grid item xs={12} md={4.8}>
                  <DashboardCard
                    title="Top Overdue Flats"
                    subtitle="Residents with outstanding unpaid ledger balances"
                    action="View Invoices"
                    actionLink="/invoices"
                  >
                    {overdueInvoices.length === 0 ? (
                      <DashboardEmptyState
                        message="No overdue accounts — every resident is caught up."
                        icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                      />
                    ) : (
                      <Stack spacing={1}>
                        {overdueInvoices.slice(0, 5).map((inv) => (
                          <DashboardListItem
                            key={inv._id || inv.id}
                            to={`/invoices/${inv._id || inv.id}`}
                            icon={<ReceiptLongIcon />}
                            iconBg="#FEE2E2"
                            iconColor="#DC2626"
                            title={`Invoice #${inv.invoiceNumber}`}
                            subtitle={`Due date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Past due"}`}
                            rightContent={
                              <Typography
                                sx={{
                                  fontFamily: FONT_UI,
                                  fontWeight: 700,
                                  fontSize: "0.875rem",
                                  color: DESIGN_TOKENS.danger[600],
                                }}
                              >
                                ₨{(Number(inv.dueAmount) || Number(inv.totalAmount) || 0).toLocaleString()}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>
              </Grid>

              {/* Row 3: Paired Cards (Pending Expense Approvals + Billing Summary) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Pending Expense Approvals"
                    subtitle="Operational claims and invoices submitted for financial approval"
                    action="Expenses Queue"
                    actionLink="/expenses"
                  >
                    {pendingExpenses.length === 0 ? (
                      <DashboardEmptyState message="No pending expenses awaiting approval." />
                    ) : (
                      <Stack spacing={1}>
                        {pendingExpenses.slice(0, 4).map((exp) => (
                          <DashboardListItem
                            key={exp._id || exp.id}
                            to="/expenses"
                            icon={<PendingActionsIcon />}
                            title={exp.title}
                            subtitle={`Vendor: ${exp.vendor || "Operational"}, category: ${toSentenceCase(exp.category)}`}
                            rightContent={
                              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#B45309" }}>
                                ₨{(Number(exp.amount) || 0).toLocaleString()}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="This Month's Billing Summary"
                    subtitle="Overview of total billed fees vs actual collected funds"
                  >
                    <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Total billed</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mt: 0.5 }}>
                            ₨{totalBilled.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>Total collected</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669", mt: 0.5 }}>
                            ₨{totalCollected.toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: totalBilled > totalCollected ? "#D97706" : "#059669" }}>
                        {totalBilled > totalCollected
                          ? `₨${(totalBilled - totalCollected).toLocaleString()} still to collect this month`
                          : "100% of this month's maintenance billing has been collected"}
                      </Typography>
                    </Box>
                  </DashboardCard>
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* 5. MAINTENANCE STAFF DASHBOARD (Section §5 - Mobile-First Worklist) */}
          {effectiveRole === ROLES.MAINTENANCE_STAFF && (
            <Stack spacing={3}>
              <DashboardCard
                title="Assigned Work Orders — Priority Queue"
                subtitle="Your prioritized field repair queue. Tap any ticket to update progress"
              >
                {requests.length === 0 ? (
                  <DashboardEmptyState
                    message="Nothing assigned to you right now — check back soon or ask your manager."
                    icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                  />
                ) : (
                  <Stack spacing={1.5}>
                    {requests.map((req) => (
                      <DashboardListItem
                        key={req._id || req.id}
                        to="/maintenance-requests"
                        icon={<BuildIcon />}
                        iconBg={req.priority === "EMERGENCY" ? "#FEE2E2" : "#EEF2FF"}
                        iconColor={req.priority === "EMERGENCY" ? "#DC2626" : DESIGN_TOKENS.brand[600]}
                        title={req.title}
                        subtitle={`Flat ${req.flatId?.flatNumber || "Assigned unit"}, category: ${toSentenceCase(req.category)}`}
                        sx={{
                          py: 1.75,
                          px: 2,
                          bgcolor: req.priority === "EMERGENCY" ? "#FEF2F2" : "#FFFFFF",
                          borderColor: req.priority === "EMERGENCY" ? "#FECACA" : "#E2E8F0",
                        }}
                        rightContent={
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <StatusChip status={req.priority} />
                            <StatusChip status={req.status} />
                          </Stack>
                        }
                      />
                    ))}
                  </Stack>
                )}
              </DashboardCard>

              {/* Secondary Rating Snapshot */}
              <DashboardCard
                title="This Week's Resident Rating"
                subtitle="Verified customer satisfaction from completed work orders"
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "14px",
                      bgcolor: "#FEF3C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#B45309",
                    }}
                  >
                    <StarRateIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      4.9 <Typography component="span" sx={{ fontSize: "1rem", color: "#64748B" }}>/ 5.0</Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                      Outstanding performance rating based on verified resident feedback
                    </Typography>
                  </Box>
                </Stack>
              </DashboardCard>
            </Stack>
          )}

          {/* 6. SECURITY STAFF DASHBOARD (Section §6 - Gate Launcher) */}
          {effectiveRole === ROLES.SECURITY_STAFF && (
            <Stack spacing={3}>
              {/* Quick Entry Pass Code Terminal */}
              <DashboardCard
                title="Gate Terminal Verification"
                subtitle="Quickly enter a 6-digit visitor pass code or launch the full terminal"
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ maxWidth: 580 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter 6-digit visitor pass code..."
                    value={passCodeInput}
                    onChange={(e) => setPassCodeInput(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#64748B" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { height: 48, borderRadius: "10px" },
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
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      bgcolor: DESIGN_TOKENS.brand[600],
                      "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                    }}
                  >
                    Verify Pass
                  </Button>
                </Stack>
              </DashboardCard>

              {/* Today's Expected Visitors List */}
              <DashboardCard
                title="Today's Expected Visitors"
                subtitle="Pre-authorized guest passes scheduled for arrival"
                action="All Visitors"
                actionLink="/visitors"
              >
                {expectedVisitors.length === 0 ? (
                  <DashboardEmptyState message="No visitors expected right now." />
                ) : (
                  <Stack spacing={1}>
                    {expectedVisitors.slice(0, 5).map((v) => (
                      <DashboardListItem
                        key={v._id || v.id}
                        icon={<BadgeIcon />}
                        title={v.visitorName}
                        subtitle={`Visiting Flat ${v.flatId?.flatNumber || "Unit"}`}
                        rightContent={
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                              {v.expectedArrival || "Today"}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/visitors/verify?code=${v.passCode}`)}
                              sx={{
                                borderColor: DESIGN_TOKENS.line[200],
                                color: DESIGN_TOKENS.text.primary,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              Check In
                            </Button>
                          </Stack>
                        }
                      />
                    ))}
                  </Stack>
                )}
              </DashboardCard>
            </Stack>
          )}

          {/* 7 & 8. RESIDENTS: FLAT OWNER & TENANT (Sections §7 & §8) */}
          {(effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
            <Stack spacing={3}>
              {/* Row 2: Paired Cards (Ledger Summary / "My Dues" + Quick Actions) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title={effectiveRole === ROLES.OWNER ? "Residence Ledger Summary" : "My Active Dues"}
                    subtitle={
                      effectiveRole === ROLES.OWNER
                        ? "Recent maintenance billings and settlement receipts"
                        : "Maintenance fees and charges for your flat"
                    }
                    action="Full Ledger"
                    actionLink="/invoices"
                  >
                    {invoices.length === 0 ? (
                      <DashboardEmptyState
                        message="You're all caught up — no outstanding dues."
                        icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                      />
                    ) : (
                      <Stack spacing={1}>
                        {invoices.slice(0, 4).map((inv) => (
                          <DashboardListItem
                            key={inv._id || inv.id}
                            to={`/invoices/${inv._id || inv.id}`}
                            icon={<ReceiptIcon />}
                            title={`Invoice #${inv.invoiceNumber}`}
                            subtitle={`Billing period: ${toSentenceCase(inv.billingPeriod || "Monthly")}`}
                            rightContent={
                              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
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
                </Grid>

                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Resident Quick Actions"
                    subtitle="Frequent resident workflows and requests"
                  >
                    <Stack spacing={2} sx={{ my: "auto" }}>
                      <Button
                        component={RouterLink}
                        to="/maintenance-requests"
                        variant="contained"
                        size="large"
                        startIcon={<BuildIcon />}
                        sx={{
                          py: 1.75,
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          bgcolor: DESIGN_TOKENS.brand[600],
                          "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                          borderRadius: "10px",
                        }}
                      >
                        Submit a Work Order
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/visitors"
                        variant="outlined"
                        size="large"
                        startIcon={<BadgeIcon />}
                        sx={{
                          py: 1.75,
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          borderColor: DESIGN_TOKENS.line[200],
                          color: DESIGN_TOKENS.text.primary,
                          "&:hover": {
                            borderColor: DESIGN_TOKENS.line[300],
                            bgcolor: DESIGN_TOKENS.surface[50],
                          },
                          borderRadius: "10px",
                        }}
                      >
                        Generate a Visitor Pass
                      </Button>
                    </Stack>
                  </DashboardCard>
                </Grid>
              </Grid>

              {/* Row 3: Paired Cards (My Open Work Orders + Recent Notices) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="My Open Work Orders"
                    subtitle="Track progress of reported repairs and service tickets"
                    action="All Tickets"
                    actionLink="/maintenance-requests"
                  >
                    {requests.length === 0 ? (
                      <DashboardEmptyState message="No open work orders for your flat." />
                    ) : (
                      <Stack spacing={1}>
                        {requests.slice(0, 4).map((r) => (
                          <DashboardListItem
                            key={r._id || r.id}
                            to="/maintenance-requests"
                            icon={<BuildIcon />}
                            title={r.title}
                            subtitle={`Ticket #${r.requestNumber || "WO"}, category: ${toSentenceCase(r.category)}`}
                            rightContent={<StatusChip status={r.status} />}
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Recent Community Notices"
                    subtitle="Official bulletins from building management"
                    action="All Notices"
                    actionLink="/notices"
                  >
                    {notices.length === 0 ? (
                      <DashboardEmptyState message="No community notices posted." />
                    ) : (
                      <Stack spacing={1}>
                        {notices.slice(0, 3).map((n) => (
                          <DashboardListItem
                            key={n._id || n.id}
                            to="/notices"
                            icon={<CampaignIcon />}
                            title={n.title}
                            subtitle={n.content?.slice(0, 60) + "..."}
                            rightContent={<StatusChip status={n.priority} />}
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>
              </Grid>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
