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

const DashboardCard = ({ title, subtitle, action, actionLink, children, sx = {} }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 2.25, sm: 3 },
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
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: DESIGN_TOKENS.text.primary,
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
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
              mt: 0.5,
              fontSize: "0.8125rem",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && actionLink && (
        <Button
          component={RouterLink}
          to={actionLink}
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "0.875rem !important" }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: DESIGN_TOKENS.brand[600],
            p: "4px 8px",
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
      )}
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
        p: "10px 12px",
        borderRadius: "10px",
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, mr: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              bgcolor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor,
              flexShrink: 0,
              "& svg": { fontSize: 18 },
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
              fontSize: "0.84rem",
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
                  fontSize: "0.75rem",
                  mt: 0.25,
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

    // Start chart from first month with activity if early platform
    const firstActiveIdx = months.findIndex((m) => m.count > 0);
    const startIdx = firstActiveIdx > 1 ? firstActiveIdx - 1 : 0;
    const visibleLabels = months.slice(startIdx).map((m) => m.label);
    const visibleCounts = cumulativeCounts.slice(startIdx);

    return {
      labels: visibleLabels.length >= 2 ? visibleLabels : months.map((m) => m.label),
      counts: visibleCounts.length >= 2 ? visibleCounts : cumulativeCounts,
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

  // Time-aware warm greeting pattern
  const getGreeting = (name) => {
    const hour = new Date().getHours();
    let timeStr = "Good morning";
    if (hour >= 12 && hour < 17) timeStr = "Good afternoon";
    else if (hour >= 17) timeStr = "Good evening";
    return `${timeStr}, ${name || "Resident"}`;
  };

  // Check if Super Admin portfolio has 0 buildings
  const isSuperAdminEmpty = effectiveRole === ROLES.SUPER_ADMIN && buildings.length === 0 && !loadingBuildings;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>

      {/* -------------------------------------------------------------------------
          0. STANDARD PAGE HEADER
          ------------------------------------------------------------------------- */}
      <PageHeader
        title={getGreeting(user?.firstName)}
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
            : undefined
        }
        action={
          effectiveRole === ROLES.SECURITY_STAFF ? (
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
          <Box sx={{ mb: 3.5 }}>
            {/* 1. SUPER ADMIN (Section §1) */}
            {effectiveRole === ROLES.SUPER_ADMIN && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={buildings.length}
                    label="Total Buildings"
                    delta="+1 this quarter"
                    icon={<ApartmentIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={users.length}
                    label="Total Active Users"
                    delta="Across all platform roles"
                    icon={<PeopleIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="Platform Collection Rate"
                    delta="Fees collected this period"
                    icon={<AccountBalanceWalletIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={openRequests.length}
                    label="Open Work Orders"
                    delta="Platform-wide active tickets"
                    icon={<BuildIcon />}
                    iconBg={openRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={openRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={openRequests.length > 0}
                  />
                </Grid>
              </Grid>
            )}

            {/* 2. BUILDING ADMIN (Section §2) */}
            {effectiveRole === ROLES.BUILDING_ADMIN && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={`${occupancyPct}%`}
                    label="Occupancy Rate"
                    delta={`${occupiedFlats} of ${totalFlats} flats occupied`}
                    icon={<HomeWorkIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={openRequests.length}
                    label="Open Work Orders"
                    delta={`${unassignedRequests.length} awaiting technician dispatch`}
                    icon={<BuildIcon />}
                    iconBg={openRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={openRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={openRequests.length > 0}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="This Month's Collection"
                    delta={`${paidInvoices.length} of ${invoices.length} invoices settled`}
                    icon={<AccountBalanceWalletIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={complaints.filter((c) => c.status !== "RESOLVED").length}
                    label="Open Complaints"
                    delta="Resident grievances under triage"
                    icon={<ReportProblemIcon />}
                    iconBg={complaints.filter((c) => c.status !== "RESOLVED").length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={complaints.filter((c) => c.status !== "RESOLVED").length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
              </Grid>
            )}

            {/* 3. MANAGER (Section §3 - Working Queue) */}
            {effectiveRole === ROLES.MANAGER && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={unassignedRequests.length}
                    label="Unassigned Work Orders"
                    delta="Require technician assignment"
                    icon={<AssignmentLateIcon />}
                    iconBg={unassignedRequests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={unassignedRequests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                    isHero={unassignedRequests.length > 0}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={urgentRequests.length}
                    label="Urgent / SLA At Risk"
                    delta="Emergency priority work orders"
                    icon={<WarningAmberIcon />}
                    iconBg={urgentRequests.length > 0 ? "#FEE2E2" : "#EEF2FF"}
                    iconColor={urgentRequests.length > 0 ? "#DC2626" : DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={staff.filter((s) => s.status === "ACTIVE" || s.isAvailable !== false).length}
                    label="Staff Available"
                    delta={`${staff.length} technicians registered`}
                    icon={<SupervisorAccountIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={tenants.slice(0, 3).length}
                    label="Scheduled Move-ins"
                    delta="Active resident transitions"
                    icon={<DoorSlidingIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
              </Grid>
            )}

            {/* 4. ACCOUNTANT (Section §4) */}
            {effectiveRole === ROLES.ACCOUNTANT && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={`${collectionRate}%`}
                    label="This Month's Collection Rate"
                    delta={`${paidInvoices.length} invoices settled this period`}
                    icon={<TrendingUpIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={`₨${totalOverdueAmount.toLocaleString()}`}
                    label="Total Outstanding"
                    delta="Accumulated unpaid ledger balances"
                    icon={<AccountBalanceWalletIcon />}
                    iconBg={totalOverdueAmount > 0 ? "#FEE2E2" : "#ECFDF5"}
                    iconColor={totalOverdueAmount > 0 ? "#DC2626" : "#059669"}
                    isHero={totalOverdueAmount > 0}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={overdueInvoices.length}
                    label="Overdue Invoices"
                    delta="Invoices past grace period deadline"
                    icon={<ReceiptLongIcon />}
                    iconBg={overdueInvoices.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={overdueInvoices.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    value={pendingExpenses.length}
                    label="Pending Expense Approvals"
                    delta="Operational claims awaiting review"
                    icon={<PendingActionsIcon />}
                    iconBg={pendingExpenses.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={pendingExpenses.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
              </Grid>
            )}

            {/* 5. MAINTENANCE STAFF (Section §5 - Mobile-First Compact Pair) */}
            {effectiveRole === ROLES.MAINTENANCE_STAFF && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    value={requests.filter((r) => r.status !== "CLOSED" && r.status !== "CANCELLED").length}
                    label="Assigned to You Today"
                    delta="Active work orders in your queue"
                    icon={<BuildIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    isHero={true}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    value={requests.filter((r) => r.status === "COMPLETED" || r.status === "VERIFIED").length}
                    label="Completed This Week"
                    delta="Successfully resolved jobs"
                    icon={<CheckCircleOutlinedIcon />}
                    iconBg="#ECFDF5"
                    iconColor="#059669"
                  />
                </Grid>
              </Grid>
            )}

            {/* 6. SECURITY STAFF (Section §6 - Gate Launcher) */}
            {effectiveRole === ROLES.SECURITY_STAFF && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    value={checkedInVisitors.length}
                    label="Currently Inside Premises"
                    delta="Guests on site awaiting checkout"
                    icon={<BadgeIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                    isHero={true}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    value={expectedVisitors.length}
                    label="Expected Today"
                    delta="Pre-approved resident entry passes"
                    icon={<DoorSlidingIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
              </Grid>
            )}

            {/* 7 & 8. RESIDENTS (FLAT OWNER & TENANT - Sections §7 & §8) */}
            {(effectiveRole === ROLES.OWNER || effectiveRole === ROLES.TENANT) && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
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
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <StatCard
                    value={requests.length}
                    label="Open Work Orders"
                    delta="Service tickets logged for your unit"
                    icon={<BuildIcon />}
                    iconBg={requests.length > 0 ? "#FEF3C7" : "#EEF2FF"}
                    iconColor={requests.length > 0 ? "#B45309" : DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <StatCard
                    value={visitors.filter((v) => v.status === "EXPECTED" || v.status === "CHECKED_IN").length}
                    label="Active Visitor Passes"
                    delta="Valid guest codes currently active"
                    icon={<BadgeIcon />}
                    iconBg="#EEF2FF"
                    iconColor={DESIGN_TOKENS.brand[600]}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          {/* =========================================================================
              2. ROW 2 & ROW 3 PANELS (Standard 60/40 Split or Full Width)
              ========================================================================= */}

          {/* 1. SUPER ADMIN DASHBOARD PANELS (Section §1) */}
          {effectiveRole === ROLES.SUPER_ADMIN && (
            <Stack spacing={3}>
              {/* Row 2: 60/40 Split */}
              <Grid container spacing={3}>
                {/* Left: TrendChart Platform Growth */}
                <Grid item xs={12} md={7.2}>
                  <TrendChart
                    title="Platform Growth"
                    subtitle="Cumulative resident and team onboarding over time"
                    metric={`${users.length} active members`}
                    color={DESIGN_TOKENS.brand[600]}
                    data={platformGrowthTrend.counts}
                    labels={platformGrowthTrend.labels}
                    emptyMessage="Growth data will appear as accounts register"
                  />
                </Grid>

                {/* Right: Ranked List Buildings Needing Attention */}
                <Grid item xs={12} md={4.8}>
                  <DashboardCard
                    title="Buildings Needing Attention"
                    subtitle="Ranked by lowest collection rate or open complaints"
                    action="All Buildings"
                    actionLink="/buildings"
                  >
                    {rankedBuildings.length === 0 ? (
                      <DashboardEmptyState message="All buildings are in good standing." />
                    ) : (
                      <Stack spacing={1}>
                        {rankedBuildings.map((b) => (
                          <DashboardListItem
                            key={b.id || b._id}
                            to={`/buildings/${b.id || b._id}`}
                            icon={<ApartmentIcon />}
                            title={b.name}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: DESIGN_TOKENS.text.secondary,
                                  }}
                                >
                                  {b.code || "BLD"}
                                </Typography>
                                {b.address && (
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#94A3B8",
                                      maxWidth: 160,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {formatAddress(b.address)}
                                  </Typography>
                                )}
                              </Box>
                            }
                            rightContent={
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <Chip
                                  label={`${b.collectionRate}% collected`}
                                  size="small"
                                  sx={{
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    bgcolor: b.collectionRate < 80 ? "#FEE2E2" : "#ECFDF5",
                                    color: b.collectionRate < 80 ? "#DC2626" : "#059669",
                                    borderRadius: "6px",
                                  }}
                                />
                                {b.openComplaints > 0 && (
                                  <Chip
                                    label={`${b.openComplaints} open complaints`}
                                    size="small"
                                    sx={{
                                      fontSize: "0.6875rem",
                                      fontWeight: 600,
                                      bgcolor: "#FEF3C7",
                                      color: "#B45309",
                                      borderRadius: "6px",
                                    }}
                                  />
                                )}
                              </Stack>
                            }
                          />
                        ))}
                      </Stack>
                    )}
                  </DashboardCard>
                </Grid>
              </Grid>

              {/* Row 3: Paired Cards (Recent Activity + Latest Notices) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Recent Admin Activity"
                    subtitle="Platform mutations and security audit events"
                    action="View Full Audit Log"
                    actionLink="/audit-logs"
                  >
                    {auditLogs.length === 0 ? (
                      <DashboardEmptyState message="No recent admin activity recorded." />
                    ) : (
                      <Stack spacing={1}>
                        {auditLogs.slice(0, 4).map((log) => (
                          <DashboardListItem
                            key={log.id || log._id}
                            to="/audit-logs"
                            icon={<HistoryIcon />}
                            title={toSentenceCase(log.action) || "System action"}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                <Chip
                                  label={toSentenceCase(log.resourceType || "System")}
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
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: DESIGN_TOKENS.text.secondary,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {log.actorUserId?.firstName
                                    ? `${log.actorUserId.firstName} ${log.actorUserId.lastName || ""}`.trim()
                                    : "System administrator"}
                                </Typography>
                              </Box>
                            }
                            rightContent={
                              <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                {formatRelativeTime(log.timestamp || log.createdAt)}
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
                    title="Latest Notices Across Platform"
                    subtitle="Recent bulletins published across residential complexes"
                    action="All Notices"
                    actionLink="/notices"
                  >
                    {notices.length === 0 ? (
                      <DashboardEmptyState message="No notices published yet." />
                    ) : (
                      <Stack spacing={1}>
                        {notices.slice(0, 4).map((n) => (
                          <DashboardListItem
                            key={n.id || n._id}
                            to="/notices"
                            icon={<CampaignIcon />}
                            title={n.title}
                            subtitle={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                <Chip
                                  label={toSentenceCase(n.targetAudience || "All residents")}
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
                                <Typography
                                  variant="caption"
                                  sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.75rem" }}
                                >
                                  {n.buildingId?.name || "General announcement"}
                                </Typography>
                              </Box>
                            }
                            rightContent={
                              <Chip
                                label={toSentenceCase(n.priority || "Normal")}
                                size="small"
                                sx={{
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  bgcolor: n.priority === "URGENT_EMERGENCY" ? "#FEE2E2" : "#F1F5F9",
                                  color: n.priority === "URGENT_EMERGENCY" ? "#DC2626" : "#475569",
                                  borderRadius: "6px",
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
            </Stack>
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

          {/* 3. MANAGER DASHBOARD (Section §3 - Working Triage Queue) */}
          {effectiveRole === ROLES.MANAGER && (
            <Stack spacing={3}>
              {/* Row 2: Full-Width Primary Working Triage Queue */}
              <DashboardCard
                title="Live Triage & Dispatch Queue"
                subtitle="Review, prioritize, and assign incoming service requests"
                action="Work Order Registry"
                actionLink="/maintenance-requests"
              >
                {openRequests.length === 0 ? (
                  <DashboardEmptyState
                    message="Nothing needs triage right now — new work orders will appear here the moment they're submitted."
                    icon={<CheckCircleOutlinedIcon sx={{ color: "#059669" }} />}
                  />
                ) : (
                  <DataTable
                    columns={[
                      { id: "requestNumber", label: "Ticket #", minWidth: 90, render: (r) => <Typography sx={{ fontWeight: 700, fontSize: "0.8125rem" }}>#{r.requestNumber || r._id?.slice(-6)}</Typography> },
                      { id: "title", label: "Request Title", render: (r) => <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{r.title}</Typography> },
                      { id: "category", label: "Category", render: (r) => <Chip label={toSentenceCase(r.category)} size="small" sx={{ fontSize: "0.75rem" }} /> },
                      { id: "priority", label: "Priority", render: (r) => <StatusChip status={r.priority} /> },
                      { id: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
                      {
                        id: "actions",
                        label: "Action",
                        align: "right",
                        render: (r) => (
                          <Button
                            component={RouterLink}
                            to={`/maintenance-requests`}
                            size="small"
                            variant="contained"
                            sx={{
                              bgcolor: DESIGN_TOKENS.brand[600],
                              fontSize: "0.75rem",
                              py: 0.25,
                              px: 1.5,
                              fontWeight: 600,
                              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                            }}
                          >
                            Assign Staff
                          </Button>
                        ),
                      },
                    ]}
                    rows={openRequests.slice(0, 6)}
                    totalCount={openRequests.length}
                    rowsPerPage={6}
                    page={0}
                  />
                )}
              </DashboardCard>

              {/* Row 3: Paired Cards (Staff Availability + Scheduled Move-ins) */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Staff Availability by Trade"
                    subtitle="Duty roster of active technicians ready for dispatch"
                    action="Staff Registry"
                    actionLink="/staff"
                  >
                    {staff.length === 0 ? (
                      <DashboardEmptyState message="No staff registered." />
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
                </Grid>

                <Grid item xs={12} md={6}>
                  <DashboardCard
                    title="Today's Move-ins & Move-outs"
                    subtitle="Scheduled resident tenancy changes and gate checklists"
                    action="Tenants Registry"
                    actionLink="/tenants"
                  >
                    {tenants.length === 0 ? (
                      <DashboardEmptyState message="No tenant transitions scheduled for today." />
                    ) : (
                      <Stack spacing={1}>
                        {tenants.slice(0, 4).map((t) => (
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
                </Grid>
              </Grid>
            </Stack>
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
