// =====================  SUPER ADMIN EXECUTIVE CONSOLE  ============
import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HistoryIcon from "@mui/icons-material/History";
import BusinessIcon from "@mui/icons-material/Business";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../providers/auth-context.js";
import { FONT_UI } from "../../../theme/typography.js";
import { DESIGN_TOKENS } from "../../../theme/palette.js";
import { formatCurrency } from "../../../utils/format-currency.js";
import { ROLES } from "../../../lib/constants/roles.js";

/**
 * Enterprise Super Admin Console
 * Built for high-volume SaaS portfolio governance with 100% LIVE dynamic backend data.
 */
export const SuperAdminDashboardView = ({
  buildings = [],
  flats = [],
  users = [],
  invoices = [],
  payments = [],
  requests = [],
  complaints = [],
  auditLogs = [],
  isLoading = false,
  onMenuClick,
  selectedRoleView = null,
  onSelectRoleView = null,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "SA";

  // -------------------------------------------------------------------------
  // 1. LIVE REVENUE DATA GENERATION (LAST 9 MONTHS)
  // -------------------------------------------------------------------------
  const revenueData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("en-US", { month: "short" });
      months.push({ key, month: monthLabel, revenue: 0 });
    }

    // Accumulate actual payments
    payments.forEach((p) => {
      const dateStr = p.paymentDate || p.createdAt;
      if (!dateStr) return;
      const key = String(dateStr).slice(0, 7);
      const target = months.find((m) => m.key === key);
      if (target) {
        target.revenue += Number(p.amount) || 0;
      }
    });

    // If payments table is empty, accumulate paid invoices
    if (payments.length === 0) {
      invoices.forEach((inv) => {
        const key =
          inv.billingPeriod ||
          (inv.createdAt ? String(inv.createdAt).slice(0, 7) : "");
        const target = months.find((m) => m.key === key);
        if (target) {
          target.revenue += Number(inv.paidAmount) || 0;
        }
      });
    }

    return months.map((m) => {
      let label = `₨${m.revenue.toLocaleString()}`;
      if (m.revenue >= 1000000) {
        label = `₨${(m.revenue / 1000000).toFixed(1)}M`;
      } else if (m.revenue >= 1000) {
        label = `₨${(m.revenue / 1000).toFixed(0)}K`;
      }
      return {
        ...m,
        label,
      };
    });
  }, [payments, invoices]);

  // Export Real Data to CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Month,Billing Period,Platform Revenue (PKR)"]
        .concat(revenueData.map((d) => `${d.month},${d.key},${d.revenue}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_revenue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------------------
  // 2. DYNAMIC CHART COORDINATES CALCULATION
  // -------------------------------------------------------------------------
  const highestRevenue = useMemo(() => {
    const max = Math.max(...revenueData.map((d) => d.revenue), 0);
    return max > 0 ? max : 100000;
  }, [revenueData]);

  // Round max to comfortable milestone
  const maxRevenue = useMemo(() => {
    if (highestRevenue >= 1000000) {
      return Math.ceil((highestRevenue * 1.25) / 500000) * 500000;
    }
    return Math.max(highestRevenue * 1.25, 100000);
  }, [highestRevenue]);

  const chartHeight = 220;
  const chartWidth = 580;
  const paddingX = 35;
  const paddingY = 20;

  const points = useMemo(() => {
    return revenueData.map((d, index) => {
      const x = paddingX + (index / (revenueData.length - 1 || 1)) * (chartWidth - paddingX * 2);
      const ratio = maxRevenue > 0 ? d.revenue / maxRevenue : 0;
      const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
      return { x, y, ...d };
    });
  }, [revenueData, maxRevenue]);

  // Generate smooth SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, point, index, arr) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[index - 1];
      const cp1x = prev.x + (point.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (point.x - prev.x) / 2;
      const cp2y = point.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return "";
    return `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }, [pathD, points]);

  // Y-axis Dynamic Milestones
  const yAxisMilestones = useMemo(() => {
    const steps = [1, 0.75, 0.5, 0.25, 0];
    return steps.map((step) => {
      const val = maxRevenue * step;
      let label = "₨0";
      if (val >= 1000000) {
        label = `₨${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        label = `₨${(val / 1000).toFixed(0)}K`;
      }
      return label;
    });
  }, [maxRevenue]);

  // -------------------------------------------------------------------------
  // 3. DYNAMIC BUILDINGS OCCUPANCY CALCULATION
  // -------------------------------------------------------------------------
  const buildingOccupancyList = useMemo(() => {
    if (!buildings.length) return [];
    return buildings.slice(0, 5).map((b) => {
      const bId = (b._id || b.id || "").toString();
      const bFlats = flats.filter((f) => {
        const id = (f.buildingId?._id || f.buildingId || "").toString();
        return id === bId;
      });
      const totalUnits = bFlats.length || b.totalFlats || 0;
      const occupiedUnits = bFlats.filter((f) => f.status === "OCCUPIED").length;
      const pct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      return {
        id: bId,
        name: b.name || "Residential Complex",
        totalUnits,
        occupiedUnits,
        pct,
      };
    });
  }, [buildings, flats]);

  // -------------------------------------------------------------------------
  // 4. METRICS & COUNTS (100% REAL DATA)
  // -------------------------------------------------------------------------
  const totalRevenue = useMemo(() => {
    const fromPayments = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (fromPayments > 0) return fromPayments;
    return invoices.reduce((acc, inv) => acc + (Number(inv.paidAmount) || 0), 0);
  }, [payments, invoices]);

  const openTicketsCount = useMemo(() => {
    const activeReqs = requests.filter(
      (r) => r.status !== "RESOLVED" && r.status !== "CANCELLED"
    ).length;
    const activeComps = complaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "CLOSED"
    ).length;
    return activeReqs + activeComps;
  }, [requests, complaints]);

  const urgentTicketsCount = useMemo(() => {
    return requests.filter((r) => r.priority === "EMERGENCY" || r.priority === "HIGH").length;
  }, [requests]);

  const activeAdminsCount = useMemo(() => {
    return users.filter((u) => u.role === ROLES.BUILDING_ADMIN).length;
  }, [users]);

  const residentsCount = useMemo(() => {
    return users.filter((u) => u.role === ROLES.OWNER || u.role === ROLES.TENANT).length;
  }, [users]);

  const overdueInvoicesCount = useMemo(() => {
    return invoices.filter((i) => i.status === "OVERDUE").length;
  }, [invoices]);

  // Dynamic Live Status Banner Text
  const liveStatusText = useMemo(() => {
    if (urgentTicketsCount > 0) {
      return `Operational Alert: ${urgentTicketsCount} urgent maintenance requests requiring supervisor dispatch across registered complexes.`;
    }
    if (overdueInvoicesCount > 0) {
      return `Billing Notice: ${overdueInvoicesCount} overdue resident invoices pending collection. Next automated cycle scheduled for the 1st.`;
    }
    return `System Status: Operational health optimal. ${buildings.length} residential complexes and ${users.length} authenticated users active.`;
  }, [urgentTicketsCount, overdueInvoicesCount, buildings.length, users.length]);

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* 1. Header Section: Title & Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {onMenuClick && (
            <IconButton
              onClick={onMenuClick}
              sx={{
                display: { md: "none" },
                color: "#0F172A",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                p: 0.75,
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
          <Box>
            <Typography
              component="h1"
              sx={{
                fontFamily: FONT_UI,
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Super Admin Console
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "0.875rem",
                color: "#64748B",
                mt: 0.5,
                fontWeight: 400,
              }}
            >
              Enterprise portfolio governance, SaaS financial collections, and live audit telemetry.
            </Typography>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}
        >
          <TextField
            size="small"
            placeholder="Search buildings, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                navigate(`/buildings?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 240 },
              "& .MuiOutlinedInput-root": {
                bgcolor: "#FFFFFF",
                borderRadius: "10px",
                fontSize: "0.84rem",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
              },
            }}
          />

          <Tooltip title="View Notifications">
            <IconButton
              onClick={() => navigate("/notifications")}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#475569",
                flexShrink: 0,
                "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
              }}
            >
              <NotificationsNoneIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile & Settings">
            <Avatar
              onClick={handleProfileMenuOpen}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                cursor: "pointer",
                bgcolor: "#4F46E5",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.85rem",
                border: "2px solid #FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>
          </Tooltip>

          {/* Profile Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{
              paper: {
                elevation: 3,
                sx: { minWidth: 200, mt: 1.25, borderRadius: "10px" },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => navigate("/profile")} sx={{ gap: 1.5, py: 1 }}>
              <PersonOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2">My Profile</Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{ gap: 1.5, py: 1, color: "error.main" }}
            >
              <LogoutIcon fontSize="small" />
              <Typography variant="body2">Log out</Typography>
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* 2. Interactive Enterprise Perspective Switcher */}
      {onSelectRoleView && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 2.5,
            borderRadius: "12px",
            borderColor: "#E2E8F0",
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
              color: "#64748B",
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
            const isSelected = selectedRoleView === roleItem.id;
            return (
              <Button
                key={roleItem.id}
                size="small"
                onClick={() => onSelectRoleView(roleItem.id)}
                variant={isSelected ? "contained" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.8125rem",
                  borderRadius: "8px",
                  py: 0.5,
                  px: 1.5,
                  bgcolor: isSelected ? "#4F46E5" : "transparent",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  "&:hover": {
                    bgcolor: isSelected ? "#4338CA" : "#F1F5F9",
                  },
                }}
              >
                {roleItem.label}
              </Button>
            );
          })}
        </Paper>
      )}

      {/* 3. Live Operational Status Banner (100% Real Dynamic Text) */}
      <Box
        sx={{
          bgcolor: urgentTicketsCount > 0 ? "#FEF2F2" : "#EEF2FF",
          border: `1px solid ${urgentTicketsCount > 0 ? "#FECACA" : "#E0E7FF"}`,
          borderRadius: "10px",
          py: 1.25,
          px: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: urgentTicketsCount > 0 ? "#EF4444" : "#4F46E5",
            flexShrink: 0,
            animation: urgentTicketsCount > 0 ? "pulse 2s infinite" : "none",
          }}
        />
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.85rem",
            fontWeight: 500,
            color: urgentTicketsCount > 0 ? "#B91C1C" : "#4338CA",
            lineHeight: 1.4,
          }}
        >
          {liveStatusText}
        </Typography>
      </Box>

      {/* 4. Four Executive StatCards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* TOTAL BUILDINGS */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                TOTAL BUILDINGS
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ApartmentOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#0F172A",
                my: 0.75,
                lineHeight: 1.2,
              }}
            >
              {isLoading ? <Skeleton width={60} /> : buildings.length}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Chip
                label={buildings.length > 0 ? `${buildings.length} Active` : "None"}
                size="small"
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#15803D",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                Registered complexes
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* TOTAL USERS */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                TOTAL USERS
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  bgcolor: "#F5F3FF",
                  color: "#7C3AED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PeopleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#0F172A",
                my: 0.75,
                lineHeight: 1.2,
              }}
            >
              {isLoading ? <Skeleton width={60} /> : users.length.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Chip
                label={`${activeAdminsCount} Admins`}
                size="small"
                sx={{
                  bgcolor: "#E0E7FF",
                  color: "#4338CA",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                {residentsCount} Residents
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* PLATFORM REVENUE */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                PLATFORM REVENUE
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  bgcolor: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCardOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#059669",
                my: 0.75,
                lineHeight: 1.2,
              }}
            >
              {isLoading ? <Skeleton width={100} /> : formatCurrency(totalRevenue)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Chip
                label={`${invoices.filter((i) => i.status === "PAID").length} Settled`}
                size="small"
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#15803D",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                {overdueInvoicesCount > 0 ? `${overdueInvoicesCount} Overdue` : "All Current"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* OPEN TICKETS & COMPLAINTS */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                OPEN WORK ORDERS
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  bgcolor: "#FFFBEB",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: FONT_UI,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: openTicketsCount > 0 ? "#D97706" : "#0F172A",
                my: 0.75,
                lineHeight: 1.2,
              }}
            >
              {isLoading ? <Skeleton width={60} /> : openTicketsCount}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Chip
                label={urgentTicketsCount > 0 ? `${urgentTicketsCount} Urgent` : "Low SLA"}
                size="small"
                sx={{
                  bgcolor: urgentTicketsCount > 0 ? "#FEE2E2" : "#FEF3C7",
                  color: urgentTicketsCount > 0 ? "#DC2626" : "#B45309",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                Across all properties
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 5. Main Section: Platform Revenue (YTD) & Buildings by Occupancy */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Left Column: Platform Revenue (YTD) */}
        <Grid item xs={12} lg={7.5}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Platform Revenue (YTD)
                </Typography>
                <Typography
                  sx={{
                    fontFamily: FONT_UI,
                    fontSize: "0.875rem",
                    color: "#64748B",
                    mt: 0.25,
                  }}
                >
                  Dynamic aggregated collections across all residential complexes
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExportCSV}
                startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  borderRadius: "8px",
                  px: 1.5,
                  py: 0.5,
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    bgcolor: "#F8FAFC",
                  },
                }}
              >
                Export CSV
              </Button>
            </Box>

            {/* SVG Line Chart */}
            <Box sx={{ position: "relative", width: "100%", mt: 2, flex: 1, minHeight: 260 }}>
              {/* Y-Axis Labels & Gridlines */}
              <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 28, width: "100%" }}>
                {yAxisMilestones.map((lbl, idx) => {
                  const topPct = (idx / 4) * 85;
                  return (
                    <Box
                      key={`${lbl}-${idx}`}
                      sx={{
                        position: "absolute",
                        top: `${topPct}%`,
                        left: 0,
                        right: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: "#94A3B8",
                          fontFamily: FONT_UI,
                          width: 58,
                          flexShrink: 0,
                          textAlign: "left",
                        }}
                      >
                        {lbl}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          borderBottom: "1px dashed #F1F5F9",
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>

              {/* Responsive SVG Chart */}
              <Box sx={{ ml: "60px", height: "calc(100% - 28px)", position: "relative" }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

                  {/* Smooth Line Curve */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Nodes */}
                  {points.map((pt) => {
                    const isHovered = hoveredPoint?.month === pt.month;
                    return (
                      <g key={pt.month}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6.5 : 4.5}
                          fill="#FFFFFF"
                          stroke="#4F46E5"
                          strokeWidth={isHovered ? 3 : 2.5}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            filter: isHovered
                              ? "drop-shadow(0 2px 4px rgba(79, 70, 229, 0.4))"
                              : "none",
                          }}
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPoint && (
                  <Paper
                    elevation={3}
                    sx={{
                      position: "absolute",
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                      transform: "translate(-50%, -125%)",
                      bgcolor: "#0F172A",
                      color: "#FFFFFF",
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "6px",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      zIndex: 10,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {hoveredPoint.month}: {hoveredPoint.label}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* X-Axis Months */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  pl: "60px",
                  pt: 1,
                }}
              >
                {revenueData.map((d) => (
                  <Typography
                    key={d.key}
                    sx={{
                      fontSize: "0.75rem",
                      color: "#64748B",
                      fontFamily: FONT_UI,
                      textAlign: "center",
                      fontWeight: 500,
                    }}
                  >
                    {d.month}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Buildings by Occupancy (100% Real Live Flats Data) */}
        <Grid item xs={12} lg={4.5}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card Header */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                Buildings by Occupancy
              </Typography>
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.875rem",
                  color: "#64748B",
                  mt: 0.25,
                }}
              >
                Live resident occupancy ratios per residential register
              </Typography>
            </Box>

            {/* Occupancy List */}
            {buildingOccupancyList.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                  bgcolor: "#F8FAFC",
                  borderRadius: "12px",
                  border: "1px dashed #CBD5E1",
                  textAlign: "center",
                }}
              >
                <BusinessIcon sx={{ fontSize: 36, color: "#94A3B8", mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                  No Buildings Registered Yet
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", mt: 0.5, mb: 2 }}>
                  Add your first residential complex to begin tracking occupancy.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/buildings"
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: "#4F46E5", textTransform: "none", borderRadius: "8px" }}
                >
                  Register Building
                </Button>
              </Box>
            ) : (
              <Stack spacing={2.5} sx={{ flex: 1, justifyContent: "center" }}>
                {buildingOccupancyList.map((item) => (
                  <Box key={item.id || item.name}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0.75,
                      }}
                    >
                      <Typography
                        component={RouterLink}
                        to={`/buildings/${item.id}`}
                        sx={{
                          fontFamily: FONT_UI,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0F172A",
                          textDecoration: "none",
                          minWidth: { xs: 110, sm: 130 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          "&:hover": { color: "#4F46E5" },
                        }}
                      >
                        {item.name}
                      </Typography>

                      {/* Progress Bar in Middle */}
                      <Box
                        sx={{
                          flex: 1,
                          mx: 2,
                          height: 6,
                          bgcolor: "#F1F5F9",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${item.pct}%`,
                            height: "100%",
                            bgcolor: item.pct > 75 ? "#10B981" : "#4F46E5",
                            borderRadius: "999px",
                            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </Box>

                      {/* Percentage Text */}
                      <Typography
                        sx={{
                          fontFamily: FONT_UI,
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#475569",
                          minWidth: 90,
                          textAlign: "right",
                        }}
                      >
                        {item.pct}% ({item.occupiedUnits}/{item.totalUnits})
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 6. Lower Enterprise Section: Managed Properties & Compliance Trail */}
      <Grid container spacing={2.5}>
        {/* Managed Complexes Portfolio */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F172A" }}>
                  Managed Complexes
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
                  Provisioned residential properties and occupancy
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/buildings"
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 600, color: "#4F46E5", textTransform: "none" }}
              >
                View All
              </Button>
            </Box>

            {buildings.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: "10px" }}>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  No complexes configured yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {buildings.slice(0, 4).map((b) => (
                  <Box
                    key={b._id || b.id}
                    component={RouterLink}
                    to={`/buildings/${b._id || b.id}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: "10px",
                      border: "1px solid #F1F5F9",
                      bgcolor: "#FFFFFF",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "#CBD5E1",
                        bgcolor: "#F8FAFC",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          bgcolor: "#EEF2FF",
                          color: "#4F46E5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ApartmentOutlinedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                          {b.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          {b.address?.city || b.address?.street || "Residential Complex"} •{" "}
                          {b.totalFlats || 0} units
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={b.status || "ACTIVE"}
                      size="small"
                      sx={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        bgcolor: b.status === "ACTIVE" ? "#DCFCE7" : "#FEF3C7",
                        color: b.status === "ACTIVE" ? "#15803D" : "#B45309",
                        borderRadius: "6px",
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Recent Audit & Compliance Activity */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "14px",
              borderColor: "#E2E8F0",
              bgcolor: "#FFFFFF",
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
                <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F172A" }}>
                  Compliance & Security Trail
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
                  Immutable record of mutations and administrative actions
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/audit-logs"
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 600, color: "#4F46E5", textTransform: "none" }}
              >
                Inspect Logs
              </Button>
            </Box>

            {auditLogs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: "10px" }}>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  No audit log entries recorded yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {auditLogs.slice(0, 4).map((log) => (
                  <Box
                    key={log._id || log.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: "10px",
                      border: "1px solid #F1F5F9",
                      bgcolor: "#F8FAFC",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          bgcolor: "#F5F3FF",
                          color: "#7C3AED",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ShieldOutlinedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                          {log.action ? log.action.replace(/_/g, " ") : "AUDIT_MUTATION"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          Role: {log.actorRole || "SYSTEM"} • {log.ipAddress || "127.0.0.1"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "#64748B", fontFamily: "monospace" }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "Today"}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboardView;
