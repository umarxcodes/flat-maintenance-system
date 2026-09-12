// =====================  OWNERS REGISTRY LIST PAGE  ===========
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import Chip from "@mui/material/Chip";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOwnersList, useRegisterOwnerMutation } from "../../features/owners/hooks/use-owners.js";
import { useBuildingsList } from "../../features/buildings/hooks/use-buildings.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { FilterBar } from "../../components/common/FilterBar.jsx";
import { PermissionGuard } from "../../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../../lib/constants/permissions.js";

const ownerSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  buildingId: z.string().min(1, "Building complex is required"),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: z.string().min(1, "Emergency contact phone is required"),
  }),
});

export const OwnersListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || (Array.isArray(buildingsData) ? buildingsData : []);

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(buildingFilter && { buildingId: buildingFilter }),
  };

  const { data, isLoading } = useOwnersList(queryParams);
  const registerMutation = useRegisterOwnerMutation();

  const owners = data?.owners || (Array.isArray(data) ? data : []);
  const totalCount = data?.total || owners.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      userId: "",
      buildingId: "",
      emergencyContact: {
        name: "",
        phone: "",
      },
    },
  });

  const handleOpenRegister = () => {
    reset();
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
    reset();
  };

  const onSubmit = (values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        handleCloseRegister();
      },
    });
  };

  const columns = [
    {
      id: "name",
      label: "Owner Name",
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
      id: "phone",
      label: "Contact",
      render: (_, row) => row.user?.phone || "-",
    },
    {
      id: "emergencyContact",
      label: "Emergency Contact",
      render: (val) => (val?.name ? `${val.name} (${val.phone})` : "-"),
    },
    {
      id: "residency",
      label: "Residency",
      render: (val) => (
        <Chip
          label={val ? "Resident Owner" : "Non-Resident Owner"}
          size="small"
          variant="outlined"
          color={val ? "success" : "default"}
        />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Property Owners"
        subtitle="Manage registered property owners, property portfolios, and emergency contacts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Owners" },
        ]}
        action={
          <PermissionGuard permission={PERMISSIONS.OWNER_CREATE}>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenRegister}>
              Register Owner
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
        searchPlaceholder="Search owners by name or email..."
        onReset={() => {
          setSearch("");
          setBuildingFilter("");
          setPage(0);
        }}
        hasActiveFilters={Boolean(search || buildingFilter)}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Building Complex</InputLabel>
          <Select
            value={buildingFilter}
            label="Building Complex"
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">
              <em>All Buildings</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={owners}
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

      {/* Register Owner Modal */}
      <Dialog open={isRegisterOpen} onClose={handleCloseRegister} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Register Property Owner Profile</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            {registerMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {registerMutation.error?.message || "Failed to register owner."}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                label="User ID (Account Reference)"
                placeholder="Mongo User ID or Account ID"
                fullWidth
                error={Boolean(errors.userId)}
                helperText={errors.userId?.message}
                {...register("userId")}
              />

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
                label="Emergency Contact Person"
                fullWidth
                error={Boolean(errors.emergencyContact?.name)}
                helperText={errors.emergencyContact?.name?.message}
                {...register("emergencyContact.name")}
              />

              <TextField
                label="Emergency Contact Phone"
                fullWidth
                error={Boolean(errors.emergencyContact?.phone)}
                helperText={errors.emergencyContact?.phone?.message}
                {...register("emergencyContact.phone")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseRegister} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Registering..." : "Save Owner Profile"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default OwnersListPage;
