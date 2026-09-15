import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { useAuth } from "../../providers/auth-context.js";
import { ROLES } from "../../lib/constants/roles.js";

const DRAWER_WIDTH = 260;

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
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
