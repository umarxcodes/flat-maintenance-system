// =====================  ENTERPRISE SIDEBAR COMPONENT  ========
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
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/auth-provider.jsx";
import { NAVIGATION_CONFIG } from "../../lib/constants/navigation.config.js";
import { hasPermission } from "../../lib/permissions/rbac.util.js";

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

  // Filter navigation items by authenticated user's permissions
  const authorizedNavigation = NAVIGATION_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(user, item.permission);
    }),
  })).filter((section) => section.items.length > 0);

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <ApartmentIcon />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Flat Maintenance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Management System
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {authorizedNavigation.map((section) => (
          <List
            key={section.category}
            dense
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: "transparent",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "text.disabled",
                  lineHeight: "28px",
                  px: 2.5,
                }}
              >
                {section.category}
              </ListSubheader>
            }
          >
            {section.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.href);

              return (
                <ListItem key={item.href} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={item.href}
                    onClick={onMobileClose}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 0.85,
                      px: 1.5,
                      color: isActive ? "primary.main" : "text.secondary",
                      bgcolor: isActive ? "action.selected" : "transparent",
                      "&.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "inherit",
                        },
                      },
                      "&:hover": {
                        bgcolor: "action.hover",
                        color: "text.primary",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: isActive ? "inherit" : "text.secondary",
                      }}
                    >
                      {ICON_MAP[item.iconName] || <DashboardIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      slotProps={{
                        primary: {
                          sx: {
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
        ))}
      </Box>

      {/* Footer / Scope info */}
      <Divider />
      <Box sx={{ p: 2, bgcolor: "action.hover" }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Logged in as:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {user?.firstName} {user?.lastName}
        </Typography>
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
            bgcolor: "background.paper",
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
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            backgroundImage: "none",
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
