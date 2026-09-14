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
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/auth-context.js";
import { NAVIGATION_CONFIG } from "../../lib/constants/navigation.config.js";
import { hasPermission } from "../../lib/permissions/rbac.util.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";

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

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#FFFFFF",
        color: DESIGN_TOKENS.text.primary,
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: DESIGN_TOKENS.line[200],
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${DESIGN_TOKENS.brand[600]} 0%, #6366F1 100%)`,
            color: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.25)",
          }}
        >
          <ApartmentIcon fontSize="small" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontFamily: FONT_UI,
              fontSize: "0.9375rem",
              fontWeight: 700,
              lineHeight: 1.2,
              color: DESIGN_TOKENS.text.primary,
              letterSpacing: "-0.02em",
            }}
          >
            Flat Maintenance
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: FONT_UI,
              color: DESIGN_TOKENS.text.secondary,
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          >
            Residential Operations
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 1.5,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {authorizedNavigation.map((section) => (
          <List
            key={section.category}
            dense
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: "transparent",
                  fontSize: "0.6875rem", // 11px
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: DESIGN_TOKENS.text.disabled || "#94A3B8",
                  lineHeight: "20px",
                  px: 2.5,
                  mt: 1.75,
                  mb: 0.5,
                  fontFamily: FONT_UI,
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
                <ListItem key={item.href} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={item.href}
                    onClick={onMobileClose}
                    selected={isActive}
                    sx={{
                      borderRadius: "8px",
                      py: 0.85,
                      px: 1.5,
                      color: isActive ? DESIGN_TOKENS.brand[600] : "#475569",
                      bgcolor: isActive ? DESIGN_TOKENS.brand[50] : "transparent",
                      border: isActive
                        ? "1px solid rgba(67, 56, 202, 0.15)"
                        : "1px solid transparent",
                      "&.Mui-selected": {
                        bgcolor: DESIGN_TOKENS.brand[50],
                        color: DESIGN_TOKENS.brand[600],
                        "&:hover": {
                          bgcolor: DESIGN_TOKENS.brand[100],
                        },
                        "& .MuiListItemIcon-root": {
                          color: DESIGN_TOKENS.brand[600],
                        },
                      },
                      "&:hover": {
                        bgcolor: DESIGN_TOKENS.surface[100],
                        color: DESIGN_TOKENS.text.primary,
                        "& .MuiListItemIcon-root": {
                          color: DESIGN_TOKENS.text.primary,
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: isActive ? DESIGN_TOKENS.brand[600] : "#64748B",
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
        ))}
      </Box>

      {/* Footer / User info */}
      <Divider sx={{ borderColor: DESIGN_TOKENS.line[200] }} />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: DESIGN_TOKENS.surface[50],
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: DESIGN_TOKENS.brand[600],
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
              color: DESIGN_TOKENS.text.primary,
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
              color: DESIGN_TOKENS.text.secondary,
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
            bgcolor: "#FFFFFF",
            borderRight: "1px solid",
            borderColor: DESIGN_TOKENS.line[200],
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
            borderRight: "1px solid",
            borderColor: DESIGN_TOKENS.line[200],
            bgcolor: "#FFFFFF",
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
