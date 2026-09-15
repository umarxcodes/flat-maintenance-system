import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("app_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("app_sidebar_collapsed", String(next));
      } catch {
        // Fallback if localStorage is disabled
      }
      return next;
    });
  };

  const currentDrawerWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Collapsible Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "width 220ms ease-out",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <Topbar onMenuClick={handleDrawerToggle} />

        <Box
          sx={{
            width: "100%",
            flex: 1,
            py: { xs: 2.5, sm: 3 },
            px: { xs: 2, sm: 3, md: 3.5 },
          }}
        >
          <Outlet context={{ onMenuClick: handleDrawerToggle }} />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
