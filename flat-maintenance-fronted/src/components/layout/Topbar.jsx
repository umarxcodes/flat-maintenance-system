// =====================  ENTERPRISE TOPBAR COMPONENT  =========
import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/auth-context.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { BuildingSelector } from "../common/BuildingSelector.jsx";

import Badge from "@mui/material/Badge";
import { useNotificationsList } from "../../features/notifications/hooks/use-notifications.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { BrandLogo } from "../common/BrandLogo.jsx";

export const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notificationsData } = useNotificationsList();

  const notifications =
    notificationsData?.notifications || (Array.isArray(notificationsData) ? notificationsData : []);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/login");
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Left Side: Mobile Menu Button, Brand Mark & Building Scope Selector */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile-Only Brand Logo Mark */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <BrandLogo theme="light" variant="icon" size={32} href="/dashboard" />
          </Box>

          {/* Building Selector if applicable */}
          <BuildingSelector />
        </Box>

        {/* Right Side: Notifications and Profile */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {/* Notifications Shortcut */}
          <Tooltip title="Notifications">
            <IconButton onClick={() => navigate("/notifications")} color="inherit" size="small">
              <Badge
                badgeContent={unreadCount}
                invisible={unreadCount === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: DESIGN_TOKENS.brand[600],
                    color: "#FFFFFF",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                  },
                }}
              >
                <NotificationsNoneIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Trigger */}
          <Box
            onClick={handleProfileMenuOpen}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              p: 0.5,
              borderRadius: 2,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user ? ROLE_LABELS[user.role] || user.role : ""}
              </Typography>
            </Box>
          </Box>
        </Stack>

        {/* Profile Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              elevation: 3,
              sx: { minWidth: 220, mt: 1.5 },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleNavigateProfile} sx={{ gap: 1.5, py: 1 }}>
            <PersonOutlinedIcon fontSize="small" color="action" />
            <Typography variant="body2">My Profile</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1, color: "error.main" }}>
            <LogoutIcon fontSize="small" />
            <Typography variant="body2">Log out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
