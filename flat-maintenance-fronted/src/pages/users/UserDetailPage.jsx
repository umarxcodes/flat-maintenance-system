// =====================  USER DETAIL PAGE  ====================
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import { useParams, useNavigate } from "react-router-dom";
import {
  useUserDetail,
  useUpdateUserStatusMutation,
} from "../../features/users/hooks/use-users.js";
import { ROLE_LABELS } from "../../lib/constants/roles.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { TableLoadingSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

export const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: user, isLoading, refetch } = useUserDetail(id);
  const updateStatusMutation = useUpdateUserStatusMutation();

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableLoadingSkeleton rows={4} columns={2} />
      </Box>
    );
  }

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  const handleOpenStatus = () => {
    setNewStatus(user?.status || STATUSES.USER.ACTIVE);
    setIsStatusOpen(true);
  };

  const handleStatusSubmit = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          setIsStatusOpen(false);
          refetch();
        },
      }
    );
  };

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title={`${user?.firstName || "User"} ${user?.lastName || "Profile"}`}
        subtitle={`User ID: ${id} • Detailed profile and permissions overview`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users", href: "/users" },
          { label: `${user?.firstName || "User"}` },
        ]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/users")}
              sx={{
                borderColor: DESIGN_TOKENS.line[200],
                color: DESIGN_TOKENS.text.primary,
                fontWeight: 600,
              }}
            >
              Back to Users
            </Button>

            <PermissionGuard permission={PERMISSIONS.USER_STATUS_UPDATE}>
              <Button
                variant="contained"
                startIcon={<ManageAccountsOutlinedIcon />}
                onClick={handleOpenStatus}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                Change Status
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        {/* Left Column: Identity Card */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
            }}
          >
            <Avatar
              src={user?.avatarUrl || ""}
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                bgcolor: "#4F46E5",
                fontSize: "1.75rem",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
              }}
            >
              {initials}
            </Avatar>

            <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.25rem", color: "#0F172A", mb: 0.5 }}>
              {user?.firstName} {user?.lastName}
            </Typography>

            <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, mb: 2 }}>
              {user?.email}
            </Typography>

            <Chip
              label={user ? ROLE_LABELS[user.role] || user.role : "User"}
              size="small"
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                bgcolor: "#EEF2FF",
                color: DESIGN_TOKENS.brand[600],
                mb: 2,
              }}
            />

            <Box>
              <StatusChip status={user?.status || STATUSES.USER.ACTIVE} />
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Profile & Scope Details */}
        <Grid item xs={12} md={8}>
          <Paper
            variant="outlined"
            sx={{
              p: 3.5,
              borderRadius: "14px",
              borderColor: DESIGN_TOKENS.line[200],
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              height: "100%",
            }}
          >
            <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1.125rem", color: "#0F172A", mb: 2.5 }}>
              Account Metadata & Contact
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: DESIGN_TOKENS.text.secondary }}>
                    <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Primary Email
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {user?.email || "—"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: DESIGN_TOKENS.text.secondary }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Phone (E.164)
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {user?.phone || user?.phoneNumber || "Not registered"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: DESIGN_TOKENS.text.secondary }}>
                    <BadgeOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                      Assigned Role
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {ROLE_LABELS[user?.role] || user?.role || "Resident"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: DESIGN_TOKENS.surface[50], border: "1px solid #F1F5F9" }}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.text.secondary, display: "block" }}>
                    Account Creation Date
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active Record"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: "1rem", color: "#0F172A", mb: 1.5 }}>
              Assigned Building Complexes
            </Typography>

            {user?.assignedBuildingIds && user.assignedBuildingIds.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {user.assignedBuildingIds.map((bId) => (
                  <Chip
                    key={bId}
                    icon={<ApartmentOutlinedIcon sx={{ fontSize: 16 }} />}
                    label={`Complex: ${bId}`}
                    variant="outlined"
                    sx={{ borderRadius: "8px" }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary }}>
                {user?.role === "SUPER_ADMIN"
                  ? "Global Platform Administrator — full un-scoped operational access across all societies."
                  : "No specific residential complexes assigned to this user."}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Status Transition Dialog */}
      <Dialog open={isStatusOpen} onClose={() => setIsStatusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Update User Account Status
        </DialogTitle>
        <DialogContent dividers>
          {updateStatusMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateStatusMutation.error?.message || "Failed to update user status."}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: DESIGN_TOKENS.text.secondary }}>
            Select account operational state for {user?.firstName} {user?.lastName}:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Account Status</InputLabel>
            <Select
              value={newStatus}
              label="Account Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value={STATUSES.USER.ACTIVE}>Active (Full Access)</MenuItem>
              <MenuItem value={STATUSES.USER.INACTIVE}>Inactive (Deactivated)</MenuItem>
              <MenuItem value={STATUSES.USER.SUSPENDED}>Suspended (Security Hold)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsStatusOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusSubmit}
            disabled={updateStatusMutation.isPending}
            sx={{
              bgcolor: DESIGN_TOKENS.brand[600],
              "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
            }}
          >
            {updateStatusMutation.isPending ? "Saving..." : "Confirm Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetailPage;
