// =====================  TENANTS REGISTRY LIST PAGE  ==========
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
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTenantsList, useOnboardTenantMutation, useMoveOutTenantMutation } from "../../features/tenants/hooks/use-tenants.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const tenantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  buildingId: z.string().min(1, "Building complex is required"),
  flatId: z.string().min(1, "Flat ID is required"),
  leaseStartDate: z.string().min(1, "Lease start date is required"),
  leaseEndDate: z.string().min(1, "Lease end date is required"),
  monthlyRent: z.coerce.number().positive("Monthly rent must be positive"),
  securityDeposit: z.coerce.number().positive("Security deposit must be positive"),
});

export const TenantsListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [moveOutTenant, setMoveOutTenant] = useState(null);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useTenantsList(queryParams);
  const onboardMutation = useOnboardTenantMutation();
  const moveOutMutation = useMoveOutTenantMutation();

  const tenants = data?.tenants || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || tenants.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      flatId: "",
      leaseStartDate: "",
      leaseEndDate: "",
      monthlyRent: 15000,
      securityDeposit: 30000,
    },
  });

  const handleOpenCreate = () => {
    reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    onboardMutation.mutate(values, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const handleMoveOutConfirm = () => {
    if (!moveOutTenant) return;
    moveOutMutation.mutate(
      { id: moveOutTenant.id || moveOutTenant._id, data: { moveOutDate: new Date().toISOString() } },
      {
        onSuccess: () => {
          setMoveOutTenant(null);
        },
      }
    );
  };

  const columns = [
    {
      id: "name",
      label: "Tenant Name",
      render: (_, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>
            {row.user?.firstName} {row.user?.lastName}
          </Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{row.user?.email}</Box>
        </Box>
      ),
    },
    {
      id: "flat",
      label: "Leased Unit",
      render: (_, row) => `Flat ${row.flat?.flatNumber || row.flatId || "-"}`,
    },
    {
      id: "leasePeriod",
      label: "Lease Period",
      render: (_, row) =>
        `${row.leaseStartDate ? row.leaseStartDate.slice(0, 10) : "-"} to ${
          row.leaseEndDate ? row.leaseEndDate.slice(0, 10) : "-"
        }`,
    },
    {
      id: "rent",
      label: "Rent / Mo",
      render: (val, row) => `$${row.monthlyRent?.toLocaleString() || "-"}`,
    },
    {
      id: "policeVerification",
      label: "Police Verification",
      render: (val) => <StatusChip status={val || "PENDING"} />,
    },
    {
      id: "status",
      label: "Lease Status",
      render: (val) => <StatusChip status={val} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <PermissionGuard permission={PERMISSIONS.TENANT_UPDATE}>
          {row.status === "ACTIVE" && (
            <Tooltip title="Initiate Move-Out Workflow">
              <IconButton
                size="small"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveOutTenant(row);
                }}
              >
                <ExitToAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Tenants & Leases"
        subtitle="Manage resident tenant registrations, lease terms, move-out workflows, and police verifications"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tenants" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.TENANT_CREATE}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>
              Onboard Tenant
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
        searchPlaceholder="Search tenants by name or email..."
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || statusFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
            {Object.values(STATUSES.TENANT).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={tenants}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
      />

      {/* Onboard Tenant Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Onboard New Tenant Lease</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {onboardMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {onboardMutation.error?.message || "Failed to onboard tenant."}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                label="User ID (Account Reference)"
                placeholder="Registered User ID"
                fullWidth
                error={Boolean(errors.userId)}
                helperText={errors.userId?.message}
                {...register("userId")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small" error={Boolean(errors.buildingId)}>
                  <InputLabel>Building Complex</InputLabel>
                  <Select label="Building Complex" {...register("buildingId")}>
                    {buildings.map((b) => (
                      <MenuItem key={b.id || b._id} value={b.id || b._id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Flat Unit ID"
                  placeholder="Flat ObjectId"
                  fullWidth
                  error={Boolean(errors.flatId)}
                  helperText={errors.flatId?.message}
                  {...register("flatId")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Lease Start Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.leaseStartDate)}
                  helperText={errors.leaseStartDate?.message}
                  {...register("leaseStartDate")}
                />

                <TextField
                  label="Lease End Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.leaseEndDate)}
                  helperText={errors.leaseEndDate?.message}
                  {...register("leaseEndDate")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Monthly Rent Amount ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.monthlyRent)}
                  helperText={errors.monthlyRent?.message}
                  {...register("monthlyRent")}
                />

                <TextField
                  label="Security Deposit Amount ($)"
                  type="number"
                  fullWidth
                  error={Boolean(errors.securityDeposit)}
                  helperText={errors.securityDeposit?.message}
                  {...register("securityDeposit")}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={onboardMutation.isPending}>
              {onboardMutation.isPending ? "Onboarding..." : "Onboard Tenant"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Move-Out Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(moveOutTenant)}
        title="Confirm Tenant Move-Out"
        description={`Are you sure you want to process move-out for ${moveOutTenant?.user?.firstName} ${moveOutTenant?.user?.lastName}? This operation terminates the active lease and transitions the flat back to VACANT status.`}
        confirmLabel="Process Move-Out"
        confirmColor="warning"
        isLoading={moveOutMutation.isPending}
        onConfirm={handleMoveOutConfirm}
        onCancel={() => setMoveOutTenant(null)}
      />
    </Box>
  );
};

export default TenantsListPage;
