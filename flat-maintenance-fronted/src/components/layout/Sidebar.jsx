// =====================  ENTERPRISE SIDEBAR COMPONENT (COLLAPSIBLE SPEC)  ========
import React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

// Icons
import DomainIcon from "@mui/icons-material/Domain";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ShieldIcon from "@mui/icons-material/Shield";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LayersIcon from "@mui/icons-material/Layers";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import TuneIcon from "@mui/icons-material/Tune";
import BuildIcon from "@mui/icons-material/Build";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import StarRateIcon from "@mui/icons-material/StarRate";
import CampaignIcon from "@mui/icons-material/Campaign";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/auth-context.js";
import { NAVIGATION_CONFIG } from "../../lib/constants/navigation.config.js";
import { hasPermission } from "../../lib/permissions/rbac.util.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { BrandLogo } from "../common/BrandLogo.jsx";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

const ICON_MAP = {
  Dashboard: <DashboardIcon fontSize="small" />,
  People: <PeopleIcon fontSize="small" />,
  Shield: <ShieldIcon fontSize="small" />,
  VpnKey: <VpnKeyIcon fontSize="small" />,
  Apartment: <ApartmentIcon fontSize="small" />,
  Domain: <DomainIcon fontSize="small" />,
  Layers: <LayersIcon fontSize="small" />,
  MeetingRoom: <MeetingRoomIcon fontSize="small" />,
  PersonPin: <PersonPinIcon fontSize="small" />,
  Group: <GroupIcon fontSize="small" />,
  Badge: <BadgeIcon fontSize="small" />,
  Tune: <TuneIcon fontSize="small" />,
  Build: <BuildIcon fontSize="small" />,
  ReceiptLong: <ReceiptLongIcon fontSize="small" />,
  Payment: <PaymentIcon fontSize="small" />,
  AccountBalanceWallet: <AccountBalanceWalletIcon fontSize="small" />,
  ReportProblem: <ReportProblemIcon fontSize="small" />,
  StarRate: <StarRateIcon fontSize="small" />,
  Campaign: <CampaignIcon fontSize="small" />,
  Notifications: <NotificationsIcon fontSize="small" />,
  TransferWithinAStation: <TransferWithinAStationIcon fontSize="small" />,
  FolderShared: <FolderSharedIcon fontSize="small" />,
  Assessment: <AssessmentIcon fontSize="small" />,
  HistoryEdu: <HistoryEduIcon fontSize="small" />,
};

export const Sidebar = ({
  mobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Filter navigation items by authorized permissions
  const authorizedNavigation = NAVIGATION_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(user, item.permission);
    }),
  })).filter((section) => section.items.length > 0);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const userFullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const userRoleLabel = user ? ROLE_LABELS[user.role] || user.role : "";

  // Super Admin specific navigation matching Figma prototype
  const superAdminNav = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    { title: "Building Admins", href: "/users", icon: <ShieldOutlinedIcon sx={{ fontSize: 20 }} /> },
    {
      title: "Maintenance & Facilities",
      href: "/maintenance-requests",
      icon: <BuildIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Property Management",
      href: "/buildings",
      icon: <ApartmentOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Roles & Permissions",
      href: "/roles",
      icon: <LockOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Audit Logs",
      href: "/audit-logs",
      icon: <TimelineOutlinedIcon sx={{ fontSize: 20 }} />,
      badge: "99+",
    },
    { title: "Reports", href: "/reports", icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} /> },
  ];

  const renderNavButton = (item, isMobile = false) => {
    const isActive =
      item.href === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname.startsWith(item.href);

    const collapsed = isMobile ? false : isCollapsed;

    const button = (
      <ListItemButton
        component={RouterLink}
        to={item.href}
        onClick={onMobileClose}
        selected={isActive}
        sx={{
          borderRadius: "10px",
          py: collapsed ? 0.85 : 0.9,
          px: collapsed ? 0.75 : 1.5,
          minHeight: 42,
          justifyContent: collapsed ? "center" : "flex-start",
          color: isActive ? "#FFFFFF" : "#94A3B8",
          bgcolor: !collapsed && isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
          border: !collapsed && isActive ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid transparent",
          transition: "background 0.15s ease, color 0.15s ease",
          "&.Mui-selected": {
            bgcolor: !collapsed && isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
            color: "#FFFFFF",
            "&:hover": {
              bgcolor: !collapsed ? "rgba(255, 255, 255, 0.12)" : "transparent",
            },
          },
          "&:hover": {
            bgcolor: !collapsed ? "rgba(255, 255, 255, 0.04)" : "transparent",
            color: "#FFFFFF",
            "& .MuiListItemIcon-root": { color: "#FFFFFF" },
          },
        }}
      >
        {/* Icon Container */}
        <Box
          sx={{
            width: collapsed ? 38 : "auto",
            height: collapsed ? 38 : "auto",
            borderRadius: collapsed ? "10px" : 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: collapsed && isActive ? DESIGN_TOKENS.brand[600] : "transparent",
            color: isActive ? "#FFFFFF" : "#94A3B8",
            flexShrink: 0,
            transition: "all 0.15s ease",
            ...(collapsed && {
              "&:hover": {
                bgcolor: isActive ? DESIGN_TOKENS.brand[600] : "rgba(255, 255, 255, 0.08)",
                color: "#FFFFFF",
              },
            }),
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? "auto" : 32,
              color: "inherit",
              justifyContent: "center",
            }}
          >
            {item.icon || ICON_MAP[item.iconName] || <DashboardIcon fontSize="small" />}
          </ListItemIcon>
        </Box>

        {/* Text Label (Completely unmounted/hidden when collapsed) */}
        {!collapsed && (
          <ListItemText
            primary={item.title}
            slotProps={{
              primary: {
                sx: {
                  fontFamily: FONT_UI,
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ml: 0.5,
                },
              },
            }}
          />
        )}

        {!collapsed && item.badge && (
          <Box
            sx={{
              bgcolor: "#6366F1",
              color: "#FFFFFF",
              fontSize: "0.6875rem",
              fontWeight: 700,
              borderRadius: "999px",
              px: 1,
              py: 0.2,
              lineHeight: 1.2,
              ml: "auto",
            }}
          >
            {item.badge}
          </Box>
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip title={item.title} placement="right" arrow enterDelay={150} leaveDelay={100} key={item.href || item.title}>
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  const getDrawerContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "#0B132B", // Exact dark navy
          color: "#FFFFFF",
          overflowX: "hidden",
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            px: collapsed ? 1.5 : 2.5,
            py: 2.5,
            minHeight: 70,
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            position: "relative",
          }}
        >
          <BrandLogo
            theme="dark"
            variant={collapsed ? "icon" : "full"}
            size={36}
            subtitle="Residential portal"
            href="/dashboard"
          />

          {/* Desktop Collapse Toggle Button */}
          {!isMobile && onToggleCollapse && (
            <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right" arrow enterDelay={200}>
              <IconButton
                onClick={onToggleCollapse}
                size="small"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  bgcolor: "rgba(255, 255, 255, 0.06)",
                  color: "#94A3B8",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: { xs: "none", md: "inline-flex" },
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: DESIGN_TOKENS.brand[600],
                    color: "#FFFFFF",
                    borderColor: DESIGN_TOKENS.brand[600],
                  },
                }}
              >
                {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Navigation List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            py: 1.5,
            px: collapsed ? 1 : 1.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {user?.role === "SUPER_ADMIN" ? (
            <List dense disablePadding>
              {superAdminNav.map((item) => (
                <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                  {renderNavButton(item, isMobile)}
                </ListItem>
              ))}
            </List>
          ) : (
            authorizedNavigation.map((section, idx) => (
              <Box key={section.category || idx} sx={{ mb: collapsed ? 1.25 : 2 }}>
                {!collapsed ? (
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: "transparent",
                      color: "#64748B",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      px: 1.5,
                      py: 0.5,
                      lineHeight: 1.4,
                      fontFamily: FONT_UI,
                    }}
                  >
                    {section.category}
                  </ListSubheader>
                ) : idx > 0 ? (
                  <Divider sx={{ my: 1.25, borderColor: "rgba(255, 255, 255, 0.08)", mx: 1 }} />
                ) : null}

                <List dense disablePadding>
                  {section.items.map((item) => (
                    <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                      {renderNavButton(item, isMobile)}
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))
          )}
        </Box>
      </Box>
    );
  };

  return (
    <>
      {/* Mobile Drawer (always full width overlay, unaffected by desktop collapse) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: EXPANDED_WIDTH,
            bgcolor: "#0B132B",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundImage: "none",
          },
        }}
      >
        {getDrawerContent(true)}
      </Drawer>

      {/* Desktop Permanent Collapsible Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          flexShrink: 0,
          transition: "width 220ms ease-out",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            bgcolor: "#0B132B",
            backgroundImage: "none",
            boxShadow: "none",
            overflowX: "hidden",
            transition: "width 220ms ease-out",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          },
        }}
        open
      >
        {getDrawerContent(false)}
      </Drawer>
    </>
  );
};

export default Sidebar;
