// =====================  USERS DIRECTORY LIST PAGE  ===========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useUsersList,
  useUpdateUserStatusMutation,
  useInviteUserMutation,
} from "../../features/users/hooks/use-users.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { useAuth } from "../../providers/auth-context.js";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { ROLES, ROLE_LABELS } from "../../lib/constants/roles.js";
import { STATUSES } from "../../lib/constants/statuses.js";
import { DESIGN_TOKENS } from "../../theme/palette.js";
import { FONT_UI } from "../../theme/typography.js";

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

const inviteSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(64, "First name must not exceed 64 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(64, "Last name must not exceed 64 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(
      E164_PHONE_REGEX,
      "Phone number must include international country code (e.g. +923001234567)"
    ),
  role: z.enum(Object.values(ROLES)),
  assignedBuildingId: z.string().optional(),
  assignedBuildingIds: z.array(z.string()).optional().default([]),
});

export const UsersListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState("");
  // Super Admin views Building Admins by default; Building Admins view all users in their complex
  const [roleFilter, setRoleFilter] = useState(isSuperAdmin ? ROLES.BUILDING_ADMIN : "");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [statusDialogUser, setStatusDialogUser] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useUsersList(queryParams);
  const updateStatusMutation = useUpdateUserStatusMutation();
  const inviteMutation = useInviteUserMutation();

  const users = data?.users || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || users.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+92",
      role: isSuperAdmin ? ROLES.BUILDING_ADMIN : ROLES.TENANT,
      assignedBuildingId: "",
      assignedBuildingIds: [],
    },
  });

  const handleOpenInvite = () => {
    setInviteResult(null);
    const defaultRole = isSuperAdmin ? ROLES.BUILDING_ADMIN : ROLES.TENANT;
    const defaultBuilding = buildings[0] ? (buildings[0].id || buildings[0]._id) : "";
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "+92",
      role: defaultRole,
      assignedBuildingId: defaultBuilding,
    });
    setIsInviteOpen(true);
  };

  const handleCloseInvite = () => {
    setIsInviteOpen(false);
    setInviteResult(null);
    reset();
  };

  const onInviteSubmit = (values) => {
    const defaultBuilding = buildings[0] ? (buildings[0].id || buildings[0]._id) : undefined;
    const targetBuildingId = values.assignedBuildingId || defaultBuilding;

    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      role: values.role,
      assignedBuildingIds: targetBuildingId ? [targetBuildingId] : [],
    };

    inviteMutation.mutate(payload, {
      onSuccess: (res) => {
        setInviteResult(res);
        if (!res?.devActivationUrl) {
          handleCloseInvite();
        }
      },
    });
  };

  const handleToggleStatusConfirm = () => {
    if (!statusDialogUser) return;
    const newStatus =
      statusDialogUser.status === STATUSES.USER.ACTIVE
        ? STATUSES.USER.INACTIVE
        : STATUSES.USER.ACTIVE;

    updateStatusMutation.mutate(
      { id: statusDialogUser.id || statusDialogUser._id, status: newStatus },
      {
        onSuccess: () => {
          setStatusDialogUser(null);
        },
      }
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const columns = [
    {
      id: "name",
      label: "Name",
      render: (_, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: "0.8125rem", bgcolor: "#4F46E5" }}>
            {`${row.firstName?.[0] || ""}${row.lastName?.[0] || ""}`.toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ fontWeight: 600, color: DESIGN_TOKENS.text.primary }}>
              {row.firstName} {row.lastName}
            </Box>
            <Box sx={{ fontSize: "0.75rem", color: DESIGN_TOKENS.text.secondary }}>
              {row.phone || "No phone logged"}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: "email",
      label: "Email",
      render: (val) => val || "—",
    },
    {
      id: "role",
      label: "System Role",
      render: (val) => (
        <Chip
          label={ROLE_LABELS[val] || val}
          size="small"
          sx={{ fontSize: "0.75rem", fontWeight: 600, bgcolor: "#EEF2FF", color: DESIGN_TOKENS.brand[600] }}
        />
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/users/${row.id || row._id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <PermissionGuard permission={PERMISSIONS.USER_STATUS_UPDATE}>
            <Tooltip
              title={row.status === STATUSES.USER.ACTIVE ? "Deactivate User" : "Activate User"}
            >
              <IconButton
                size="small"
                color={row.status === STATUSES.USER.ACTIVE ? "success" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusDialogUser(row);
                }}
              >
                {row.status === STATUSES.USER.ACTIVE ? (
                  <ToggleOnIcon fontSize="small" />
                ) : (
                  <ToggleOffIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </PermissionGuard>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <PageHeader
        title={isSuperAdmin ? "Building Administrators" : "Users Directory"}
        subtitle={
          isSuperAdmin
            ? "Provision, oversee, and manage Building Complex Administrators across all societies"
            : "Manage resident accounts, operational staff, and access permissions"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: isSuperAdmin ? "Building Admins" : "Users" },
        ]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              sx={{ bgcolor: "#FFFFFF" }}
            >
              <ToggleButton value="grid" aria-label="User Cards">
                <GridViewIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="table" aria-label="Data Table">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>

            <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenInvite}
                sx={{
                  bgcolor: DESIGN_TOKENS.brand[600],
                  fontWeight: 600,
                  "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
                }}
              >
                {isSuperAdmin ? "Invite Building Admin" : "Invite User"}
              </Button>
            </PermissionGuard>
          </Stack>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search by name, email, or phone..."
        onReset={handleResetFilters}
        hasActiveFilters={Boolean(search || (isSuperAdmin ? roleFilter !== ROLES.BUILDING_ADMIN : roleFilter) || statusFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select
            value={roleFilter}
            label="Filter by Role"
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Roles</em>
            </MenuItem>
            {Object.entries(ROLE_LABELS).map(([code, label]) => (
              <MenuItem key={code} value={code}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Account Status</InputLabel>
          <Select
            value={statusFilter}
            label="Account Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            {Object.values(STATUSES.USER).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {/* Presentation */}
      {viewMode === "grid" ? (
        <Box sx={{ mb: 4 }}>
          {isLoading ? (
            <Grid container spacing={2.5}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "14px", borderColor: DESIGN_TOKENS.line[200] }}>
                    <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1.5 }} />
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={18} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={32} sx={{ borderRadius: "6px" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users match your filters."
              description="Invite an administrator or create a new user account to get started."
              action={
                <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenInvite}
                    sx={{ bgcolor: DESIGN_TOKENS.brand[600], fontWeight: 600 }}
                  >
                    Invite User
                  </Button>
                </PermissionGuard>
              }
            />
          ) : (
            <Grid container spacing={2.5}>
              {users.map((u) => {
                const uId = u.id || u._id;
                const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={uId}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: "14px",
                        borderColor: DESIGN_TOKENS.line[200],
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        "&:hover": {
                          borderColor: DESIGN_TOKENS.brand[600],
                          boxShadow: "0 6px 18px -3px rgba(15, 23, 42, 0.08)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box>
                        {/* Header: Avatar and Status */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Avatar sx={{ width: 44, height: 44, bgcolor: "#4F46E5", fontWeight: 700, fontSize: "1rem" }}>
                            {initials}
                          </Avatar>
                          <StatusChip status={u.status} />
                        </Box>

                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0F172A", mb: 0.25 }}>
                          {u.firstName} {u.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.text.secondary, fontSize: "0.8125rem", mb: 1.5 }} noWrap>
                          {u.email}
                        </Typography>

                        <Chip
                          label={ROLE_LABELS[u.role] || u.role}
                          size="small"
                          sx={{ fontSize: "0.75rem", fontWeight: 600, bgcolor: "#EEF2FF", color: DESIGN_TOKENS.brand[600], mb: 2 }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                        <PermissionGuard permission={PERMISSIONS.USER_STATUS_UPDATE}>
                          <Button
                            size="small"
                            onClick={() => setStatusDialogUser(u)}
                            sx={{ fontSize: "0.75rem", color: u.status === STATUSES.USER.ACTIVE ? "error.main" : "success.main" }}
                          >
                            {u.status === STATUSES.USER.ACTIVE ? "Deactivate" : "Activate"}
                          </Button>
                        </PermissionGuard>

                        <Button
                          component={RouterLink}
                          to={`/users/${uId}`}
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                          sx={{ fontWeight: 600, fontSize: "0.8125rem", color: DESIGN_TOKENS.brand[600] }}
                        >
                          Profile
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          onRowClick={(row) => navigate(`/users/${row.id || row._id}`)}
        />
      )}

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onClose={handleCloseInvite} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          {isSuperAdmin ? "Provision Building Administrator" : "Provision New User Account"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onInviteSubmit)} noValidate>
          <DialogContent dividers>
            {inviteMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
                {inviteMutation.error?.message || "Failed to invite user."}
              </Alert>
            )}

            {inviteResult && (
              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                <Alert severity="success" sx={{ borderRadius: "8px" }}>
                  User invitation successfully created! An activation link has been sent to their email.
                </Alert>
                {inviteResult.devActivationUrl && (
                  <Alert severity="info" sx={{ borderRadius: "8px" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                      ⚡ Developer Activation Link:
                    </Typography>
                    <Typography
                      component="a"
                      href={inviteResult.devActivationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{ wordBreak: "break-all", color: "inherit", textDecoration: "underline" }}
                    >
                      {inviteResult.devActivationUrl}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            )}

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="First Name"
                  fullWidth
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                  {...register("firstName")}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                  {...register("lastName")}
                />
              </Stack>

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register("email")}
              />

              <TextField
                label="Phone Number (E.164)"
                placeholder="e.g. +923001234567"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message || "Include international country code prefix (+)"}
                {...register("phone")}
              />

              {buildings.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Complex / Building</InputLabel>
                  <Select
                    label="Assigned Complex / Building"
                    defaultValue={buildings[0]?.id || buildings[0]?._id}
                    {...register("assignedBuildingId")}
                  >
                    {buildings.map((b) => (
                      <MenuItem key={b.id || b._id} value={b.id || b._id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth size="small" error={Boolean(errors.role)}>
                <InputLabel>Organizational Role</InputLabel>
                <Select
                  label="Organizational Role"
                  defaultValue={isSuperAdmin ? ROLES.BUILDING_ADMIN : ROLES.TENANT}
                  {...register("role")}
                >
                  {(isSuperAdmin
                    ? [ROLES.BUILDING_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.MAINTENANCE_STAFF, ROLES.SECURITY_STAFF, ROLES.OWNER, ROLES.TENANT]
                    : [ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.MAINTENANCE_STAFF, ROLES.SECURITY_STAFF, ROLES.OWNER, ROLES.TENANT]
                  ).map((code) => (
                    <MenuItem key={code} value={code}>
                      {ROLE_LABELS[code] || code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseInvite} color="inherit">
              {inviteResult ? "Done" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={inviteMutation.isPending}
              sx={{
                bgcolor: DESIGN_TOKENS.brand[600],
                "&:hover": { bgcolor: DESIGN_TOKENS.brand[700] },
              }}
            >
              {inviteMutation.isPending ? "Inviting..." : "Send Invitation"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        open={Boolean(statusDialogUser)}
        title={statusDialogUser?.status === STATUSES.USER.ACTIVE ? "Deactivate User Account" : "Activate User Account"}
        description={
          statusDialogUser?.status === STATUSES.USER.ACTIVE
            ? `Are you sure you want to deactivate ${statusDialogUser?.firstName} ${statusDialogUser?.lastName}? They will be temporarily blocked from signing into the portal.`
            : `Are you sure you want to activate ${statusDialogUser?.firstName} ${statusDialogUser?.lastName}? Their portal access will be restored.`
        }
        confirmLabel={statusDialogUser?.status === STATUSES.USER.ACTIVE ? "Deactivate" : "Activate"}
        confirmColor={statusDialogUser?.status === STATUSES.USER.ACTIVE ? "error" : "primary"}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleToggleStatusConfirm}
        onCancel={() => setStatusDialogUser(null)}
      />
    </Box>
  );
};

export default UsersListPage;
