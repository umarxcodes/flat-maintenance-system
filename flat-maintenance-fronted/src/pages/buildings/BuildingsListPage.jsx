// =====================  BUILDINGS LIST PAGE  ==================
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
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useBuildingsList,
  useCreateBuildingMutation,
} from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { StatusChip } from "../../components/common/StatusChip.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";
import { STATUSES } from "../../lib/constants/statuses.js";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  code: z.string().min(1, "Building code is required"),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export const BuildingsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useBuildingsList(queryParams);
  const createMutation = useCreateBuildingMutation();

  const buildings = data?.buildings || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || buildings.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      code: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
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
    createMutation.mutate(values, {
      onSuccess: () => {
        handleCloseCreate();
      },
    });
  };

  const columns = [
    {
      id: "name",
      label: "Building Name",
      render: (val, row) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Code: {row.code}</Box>
        </Box>
      ),
    },
    {
      id: "city",
      label: "City / Location",
      render: (_, row) => `${row.address?.city || "-"}, ${row.address?.state || "-"}`,
    },
    {
      id: "street",
      label: "Street Address",
      render: (_, row) => row.address?.street || "-",
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusChip status={val || "ACTIVE"} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/buildings/${row.id || row._id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Buildings & Complexes"
        subtitle="Manage registered properties, address settings, and structural statistics"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Buildings" }]}
        action={
          <PermissionGuard permission={PERMISSIONS.BUILDING_CREATE}>
            <Button variant="contained" startIcon={<AddBusinessIcon />} onClick={handleOpenCreate}>
              Add Building
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
        searchPlaceholder="Search buildings by name or code..."
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
            {Object.values(STATUSES.BUILDING).map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={buildings}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
        onRowClick={(row) => navigate(`/buildings/${row.id || row._id}`)}
      />

      {/* Create Building Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Register New Building Complex</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createMutation.error?.message || "Failed to create building."}
              </Alert>
            )}

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Building Name"
                  fullWidth
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register("name")}
                />
                <TextField
                  label="Building Code"
                  placeholder="e.g. BLD-01"
                  fullWidth
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message}
                  {...register("code")}
                />
              </Stack>

              <TextField
                label="Street Address"
                fullWidth
                error={Boolean(errors.address?.street)}
                helperText={errors.address?.street?.message}
                {...register("address.street")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="City"
                  fullWidth
                  error={Boolean(errors.address?.city)}
                  helperText={errors.address?.city?.message}
                  {...register("address.city")}
                />
                <TextField
                  label="State / Province"
                  fullWidth
                  error={Boolean(errors.address?.state)}
                  helperText={errors.address?.state?.message}
                  {...register("address.state")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Postal Code"
                  fullWidth
                  error={Boolean(errors.address?.postalCode)}
                  helperText={errors.address?.postalCode?.message}
                  {...register("address.postalCode")}
                />
                <TextField
                  label="Country"
                  fullWidth
                  error={Boolean(errors.address?.country)}
                  helperText={errors.address?.country?.message}
                  {...register("address.country")}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Building"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BuildingsListPage;
