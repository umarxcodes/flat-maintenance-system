// =====================  USERS DIRECTORY LIST PAGE  ===========
import React, { useState } from "react";
import Box from "@mui/material/Box";
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useUsersList,
  useUpdateUserStatusMutation,
  useInviteUserMutation,
} from "../../features/users/hooks/use-users.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { ROLES, ROLE_LABELS } from "../../lib/constants/roles.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
});

export const UsersListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [statusDialogUser, setStatusDialogUser] = useState(null);

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
      phone: "",
      role: ROLES.TENANT,
    },
  });

  const handleOpenInvite = () => {
    reset();
    setIsInviteOpen(true);
  };

  const handleCloseInvite = () => {
    setIsInviteOpen(false);
    reset();
  };

  const onInviteSubmit = (values) => {
    inviteMutation.mutate(values, {
      onSuccess: () => {
        handleCloseInvite();
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
      render: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      id: "email",
      label: "Email",
      render: (val) => val || "-",
    },
    {
      id: "role",
      label: "Role",
      render: (val) => ROLE_LABELS[val] || val,
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
          <Tooltip title="View Details">
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
    <Box>
      <PageHeader
        title="Users Directory"
        subtitle="Manage user accounts, roles, access permissions, and activation states"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenInvite}>
              Invite User
            </Button>
          </PermissionGuard>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search by name or email..."
        onReset={handleResetFilters}
        hasActiveFilters={Boolean(search || roleFilter || statusFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
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
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
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

      <DataTable
        columns={columns}
        rows={users}
        isLoading={isLoading}
        emptyTitle="No admins yet."
        emptyDescription="Invite an administrator or create a new user account to get started."
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

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onClose={handleCloseInvite} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Invite New User</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onInviteSubmit)} noValidate>
          <DialogContent dividers>
            {inviteMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {inviteMutation.error?.message || "Failed to invite user."}
              </Alert>
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
                label="Phone Number"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                {...register("phone")}
              />

              <FormControl fullWidth size="small" error={Boolean(errors.role)}>
                <InputLabel>Role</InputLabel>
                <Select label="Role" defaultValue={ROLES.TENANT} {...register("role")}>
                  {Object.entries(ROLE_LABELS).map(([code, label]) => (
                    <MenuItem key={code} value={code}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseInvite} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Sending..." : "Send invite"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        open={Boolean(statusDialogUser)}
        title="Confirm User Deactivation"
        description={
          statusDialogUser?.status === STATUSES.USER.ACTIVE
            ? `${statusDialogUser?.firstName} ${statusDialogUser?.lastName} will lose access immediately and be unassigned from their building. This can't be undone.`
            : `Are you sure you want to activate ${statusDialogUser?.firstName} ${statusDialogUser?.lastName}?`
        }
        confirmLabel={statusDialogUser?.status === STATUSES.USER.ACTIVE ? "Remove" : "Activate"}
        confirmColor={statusDialogUser?.status === STATUSES.USER.ACTIVE ? "error" : "primary"}
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleToggleStatusConfirm}
        onCancel={() => setStatusDialogUser(null)}
      />
    </Box>
  );
};

export default UsersListPage;
