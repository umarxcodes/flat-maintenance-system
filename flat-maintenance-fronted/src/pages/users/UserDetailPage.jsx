// =====================  USER DETAIL PAGE  ====================
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router-dom";
import { useUserDetail } from "../../features/users/hooks/use-users.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";

export const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUserDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <Box>
      <PageHeader
        title={`${user?.firstName || "User"} ${user?.lastName || "Profile"}`}
        subtitle={`User ID: ${id} • Detailed profile and permissions overview`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users", href: "/users" },
          { label: "Details" },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/users")}
          >
            Back to Users
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
                fontSize: "1.5rem",
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

            <Box>
              <StatusChip status={user?.status || "ACTIVE"} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Profile Details
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
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.email || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.phone || user?.phoneNumber || "Not provided"}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Assigned Building Scope
            </Typography>

            {user?.assignedBuildingIds && user.assignedBuildingIds.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {user.assignedBuildingIds.map((bId) => (
                  <Chip key={bId} label={`Building: ${bId}`} variant="outlined" size="small" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {user?.role === "SUPER_ADMIN"
                  ? "Global access across all building complexes."
                  : "No specific building complexes assigned."}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetailPage;
