// =====================  ENTERPRISE SIDEBAR COMPONENT (APPENDIX §A.1)  ========
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
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/auth-context.js";
import { NAVIGATION_CONFIG } from "../../lib/constants/navigation.config.js";
import { hasPermission } from "../../lib/permissions/rbac.util.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { BrandLogo } from "../common/BrandLogo.jsx";

const DRAWER_WIDTH = 260;

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

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
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

  // Super Admin specific navigation matching Figma prototype
  const superAdminNav = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Buildings",
      href: "/buildings",
      icon: <ApartmentOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    { title: "Admins", href: "/users", icon: <ShieldOutlinedIcon sx={{ fontSize: 20 }} /> },
    { title: "Users", href: "/users", icon: <PeopleOutlineOutlinedIcon sx={{ fontSize: 20 }} /> },
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
    { title: "Settings", href: "/profile", icon: <SettingsOutlinedIcon sx={{ fontSize: 20 }} /> },
  ];

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#0B132B", // Exact dark navy from Figma
        color: "#FFFFFF",
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2.5,
          py: 2.75,
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <BrandLogo
          theme="dark"
          variant="full"
          size={38}
          subtitle="Residential Portal"
          href="/dashboard"
        />
      </Box>

      {/* Navigation List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 1,
          px: 2,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {user?.role === "SUPER_ADMIN" ? (
          <List dense disablePadding>
            {superAdminNav.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.href);

              return (
                <ListItem key={item.title} disablePadding sx={{ mb: 0.75 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={item.href}
                    onClick={onMobileClose}
                    selected={isActive}
                    sx={{
                      borderRadius: "8px",
                      py: 1,
                      px: 1.75,
                      color: isActive ? "#FFFFFF" : "#94A3B8",
                      bgcolor: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      border: isActive
                        ? "1px solid rgba(255, 255, 255, 0.08)"
                        : "1px solid transparent",
                      "&.Mui-selected": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                        color: "#FFFFFF",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.12)",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "#FFFFFF",
                        },
                      },
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        "& .MuiListItemIcon-root": {
                          color: "#FFFFFF",
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 34,
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                      }}
                    >
                      {item.icon || ICON_MAP[item.iconName] || <DashboardIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      slotProps={{
                        primary: {
                          sx: {
                            fontFamily: FONT_UI,
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 600 : 500,
                          },
                        },
                      }}
                    />
                    {item.badge && (
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
                        }}
                      >
                        {item.badge}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ) : (
          authorizedNavigation.map((section) => (
            <List key={section.category} dense disablePadding sx={{ mb: 2 }}>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? location.pathname === "/dashboard"
                    : location.pathname.startsWith(item.href);

                return (
                  <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={RouterLink}
                      to={item.href}
                      onClick={onMobileClose}
                      selected={isActive}
                      sx={{
                        borderRadius: "8px",
                        py: 0.9,
                        px: 1.5,
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                        bgcolor: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                        border: isActive
                          ? "1px solid rgba(255, 255, 255, 0.08)"
                          : "1px solid transparent",
                        "&.Mui-selected": {
                          bgcolor: "rgba(255, 255, 255, 0.08)",
                          color: "#FFFFFF",
                          "& .MuiListItemIcon-root": {
                            color: "#FFFFFF",
                          },
                        },
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.04)",
                          color: "#FFFFFF",
                          "& .MuiListItemIcon-root": {
                            color: "#FFFFFF",
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: isActive ? "#FFFFFF" : "#94A3B8",
                        }}
                      >
                        {ICON_MAP[item.iconName] || <DashboardIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        slotProps={{
                          primary: {
                            sx: {
                              fontFamily: FONT_UI,
                              fontSize: "0.8125rem",
                              fontWeight: isActive ? 600 : 500,
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          ))
        )}
      </Box>

      {/* Footer / User info */}
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#4F46E5",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "0.8125rem",
            flexShrink: 0,
          }}
        >
          {initials}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              lineHeight: 1.2,
              fontFamily: FONT_UI,
            }}
            noWrap
          >
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#94A3B8",
              fontFamily: FONT_UI,
              fontSize: "0.75rem",
              display: "block",
              lineHeight: 1.2,
              mt: 0.25,
            }}
            noWrap
          >
            {user ? ROLE_LABELS[user.role] || user.role : ""}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            bgcolor: "#0B132B",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundImage: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            bgcolor: "#0B132B",
            backgroundImage: "none",
            boxShadow: "none",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
