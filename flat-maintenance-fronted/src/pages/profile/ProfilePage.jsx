// =====================  MY PROFILE PAGE  =====================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { useAuth } from "../../providers/auth-provider.jsx";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";

export const ProfilePage = () => {
  const { user } = useAuth();

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <Box>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal account credentials and view organizational building scope"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />

      <Grid container spacing={3}>
        {/* User Card */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
                fontSize: "1.75rem",
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user?.firstName} {user?.lastName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.email}
            </Typography>

            <Chip
              label={user ? ROLE_LABELS[user.role] || user.role : "User"}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mt: 1 }}>
              <StatusChip status={user?.status || "ACTIVE"} />
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Information & Scope */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Account Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  First Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.firstName || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.lastName || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.email || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.phone || user?.phoneNumber || "Not provided"}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Scope info */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Assigned Building Complexes (OBAC Scope)
            </Typography>

            {user?.role === "SUPER_ADMIN" ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
                <Typography variant="body2" color="text.secondary">
                  SuperAdmin maintains global access across all registered building complexes.
                </Typography>
              </Paper>
            ) : user?.assignedBuildingIds && user.assignedBuildingIds.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {user.assignedBuildingIds.map((bId) => (
                  <Chip key={bId} label={`Complex: ${bId}`} variant="outlined" size="small" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No explicit building complex assigned.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
