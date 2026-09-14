import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../providers/auth-context.js";
import { FONT_UI } from "../../../theme/typography.js";
import { DESIGN_TOKENS } from "../../../theme/palette.js";

// Monthly data matching the exact Figma prototype curve
const REVENUE_DATA = [
  { month: "Jan", revenue: 1300000, label: "Rs. 1.3M" },
  { month: "Feb", revenue: 1700000, label: "Rs. 1.7M" },
  { month: "Mar", revenue: 2000000, label: "Rs. 2.0M" },
  { month: "Apr", revenue: 1800000, label: "Rs. 1.8M" },
  { month: "May", revenue: 2400000, label: "Rs. 2.4M" },
  { month: "Jun", revenue: 2900000, label: "Rs. 2.9M" },
  { month: "Jul", revenue: 2700000, label: "Rs. 2.7M" },
  { month: "Aug", revenue: 3500000, label: "Rs. 3.5M" },
  { month: "Sep", revenue: 4250000, label: "Rs. 4.25M" },
];

const DEFAULT_OCCUPANCY = [
  { name: "Falcon Heights", pct: 93 },
  { name: "Al-Noor Residency", pct: 87 },
  { name: "Marina Towers", pct: 91 },
  { name: "Creek Vista", pct: 88 },
  { name: "Royal Orchards", pct: 76 },
];

export const SuperAdminDashboardView = ({
  buildings = [],
  users = [],
  openRequests = [],
  onMenuClick,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Month,Platform Revenue (PKR)"]
        .concat(REVENUE_DATA.map((d) => `${d.month},${d.revenue}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_revenue_ytd.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "SA";

  // Chart coordinates calculation
  const maxRevenue = 5000000;
  const chartHeight = 220;
  const chartWidth = 580;
  const paddingX = 35;
  const paddingY = 20;

  const points = REVENUE_DATA.map((d, index) => {
    const x = paddingX + (index / (REVENUE_DATA.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.revenue / maxRevenue) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Generate smooth SVG path
  const pathD = points.reduce((acc, point, index, arr) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[index - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, "");

  // Area under path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Occupancy list fallback/merge
  const occupancyList =
    buildings.length > 0
      ? buildings.slice(0, 5).map((b, idx) => ({
          name: b.name || `Property ${idx + 1}`,
          pct: DEFAULT_OCCUPANCY[idx]?.pct || 85,
        }))
      : DEFAULT_OCCUPANCY;

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
          mb: 3,
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
              System-wide maintenance registers and SaaS collection metrics.
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
            placeholder="Search buildings, admins..."
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
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 260 },
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

          <Tooltip title="Notifications">
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

      {/* 2. Live Commission Status Banner */}
      <Box
        sx={{
          bgcolor: "#EEF2FF",
          border: "1px solid #E0E7FF",
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
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "#4F46E5",
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontFamily: FONT_UI,
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "#4338CA",
            lineHeight: 1.4,
          }}
        >
          Live Commission Status: 9 urgent maintenance tickets resolved in Gulberg Heights. Next
          automated collection cycle triggers on Nov 1st.
        </Typography>
      </Box>

      {/* 3. 4 StatCards Row */}
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
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
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
              {buildings.length > 0 ? buildings.length : 12}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Box
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#15803D",
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                ↗ +2 new
              </Box>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                Registered this month
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
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
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
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
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
              {users.length > 0 ? users.length.toLocaleString() : "1,847"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Box
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#15803D",
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                ↗ +14.2%
              </Box>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                Residents & staff
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* PLATFORM COLLECTION */}
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
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                PLATFORM COLLECTION
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
                <CreditCardOutlinedIcon sx={{ fontSize: 18 }} />
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
              Rs. 4,250,000
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Box
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#15803D",
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                ↗ +28.4%
              </Box>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                YTD commission fees
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* OPEN COMPLAINTS */}
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
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Typography
                sx={{
                  fontFamily: FONT_UI,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                OPEN COMPLAINTS
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
                <ErrorOutlineOutlinedIcon sx={{ fontSize: 18 }} />
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
              {openRequests.length > 0 ? openRequests.length : 23}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Box
                sx={{
                  bgcolor: "#FEF3C7",
                  color: "#B45309",
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                ↘ -8 resolved
              </Box>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: FONT_UI }}>
                Requires admin dispatch
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 4. Main Section: Platform Revenue (YTD) & Buildings by Occupancy */}
      <Grid container spacing={2.5}>
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
                  Consolidated platform commission & subscription fees
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
                {["Rs. 5M", "Rs. 3.8M", "Rs. 2.5M", "Rs. 1.3M", "Rs. 0M"].map((lbl, idx) => {
                  const topPct = (idx / 4) * 85;
                  return (
                    <Box
                      key={lbl}
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
                          width: 54,
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
              <Box sx={{ ml: "56px", height: "calc(100% - 28px)", position: "relative" }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path d={areaD} fill="url(#revenueGradient)" />

                  {/* Smooth Line Curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Nodes */}
                  {points.map((pt, idx) => {
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
                  pl: "56px",
                  pt: 1,
                }}
              >
                {REVENUE_DATA.map((d) => (
                  <Typography
                    key={d.month}
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

        {/* Right Column: Buildings by Occupancy */}
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
            <Box sx={{ mb: 3 }}>
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
                Live booking states across high-density registers
              </Typography>
            </Box>

            {/* Occupancy List */}
            <Stack spacing={3} sx={{ flex: 1, justifyContent: "center" }}>
              {occupancyList.map((item) => (
                <Box key={item.name}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.75,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT_UI,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#0F172A",
                        minWidth: { xs: 120, sm: 140 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
                          bgcolor: "#4F46E5",
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
                        minWidth: 80,
                        textAlign: "right",
                      }}
                    >
                      {item.pct}% Booked
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboardView;
